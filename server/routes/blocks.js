const express = require('express');
const Block = require('../models/Block');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');
const { predictEffort, predictDelayRisk, suggestBestEngineer } = require('../utils/aiPredictor');

const router = express.Router();

// Get all blocks with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, assignedTo, search, sort, priority, page = 1, limit = 50 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Engineers see only their assigned blocks by default
    if (req.user.role === 'engineer' && !assignedTo) {
      filter.assignedTo = req.user._id;
    }
    
    let sortObj = { createdAt: -1 };
    if (sort === 'name') sortObj = { name: 1 };
    if (sort === 'priority') sortObj = { priority: -1 };
    if (sort === 'status') sortObj = { status: 1 };
    if (sort === 'dueDate') sortObj = { dueDate: 1 };
    
    const blocks = await Block.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Block.countDocuments(filter);
    
    res.json({ blocks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blocks', error: error.message });
  }
});

// Get single block
router.get('/:id', auth, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id)
      .populate('assignedTo', 'name email avatar skills')
      .populate('createdBy', 'name email avatar')
      .populate('statusHistory.changedBy', 'name email avatar')
      .populate('approvals.submittedBy', 'name email avatar')
      .populate('approvals.reviewedBy', 'name email avatar');
    
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create block (managers only)
router.post('/', auth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { name, type, description, estimatedArea, technologyNode, complexityLevel, priority, dueDate, baseHours } = req.body;
    
    const aiPredictedHours = predictEffort(type, technologyNode, complexityLevel);
    
    const block = await Block.create({
      name,
      type,
      description,
      estimatedArea,
      technologyNode,
      complexityLevel,
      priority: priority || 'Medium',
      dueDate,
      baseHours: baseHours || aiPredictedHours,
      aiPredictedHours,
      createdBy: req.user._id,
      statusHistory: [{
        status: 'Not Started',
        changedBy: req.user._id,
        comment: 'Block created',
      }],
    });
    
    await block.populate('createdBy', 'name email avatar');
    res.status(201).json(block);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create block', error: error.message });
  }
});

// Update block
router.put('/:id', auth, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    
    const allowedFields = ['name', 'type', 'description', 'estimatedArea', 'technologyNode',
      'complexityLevel', 'priority', 'dueDate', 'baseHours', 'managerOverrideHours', 'tags'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) block[field] = req.body[field];
    });
    
    if (req.body.technologyNode || req.body.complexityLevel || req.body.type) {
      block.aiPredictedHours = predictEffort(
        block.type, block.technologyNode, block.complexityLevel
      );
    }
    
    await block.save();
    await block.populate('assignedTo', 'name email avatar');
    await block.populate('createdBy', 'name email avatar');
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

// Delete block
router.delete('/:id', auth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    await Block.findByIdAndDelete(req.params.id);
    res.json({ message: 'Block deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// Assign engineer to block
router.post('/:id/assign', auth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { engineerId } = req.body;
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    
    // Check double assignment
    const existingAssignment = await Block.findOne({
      assignedTo: engineerId,
      status: { $in: ['In Progress', 'DRC', 'LVS'] },
      _id: { $ne: block._id }
    });
    
    // Allow assignment but warn
    block.assignedTo = engineerId;
    if (block.status === 'Not Started') {
      block.status = 'Not Started';
    }
    await block.save();
    
    // Create notification
    await Notification.create({
      recipient: engineerId,
      sender: req.user._id,
      type: 'assignment',
      title: 'New Block Assignment',
      message: `You have been assigned to block "${block.name}"`,
      blockId: block._id,
    });
    
    await block.populate('assignedTo', 'name email avatar');
    await block.populate('createdBy', 'name email avatar');
    
    res.json({
      block,
      warning: existingAssignment ? 'Engineer already has active assignments' : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Assignment failed', error: error.message });
  }
});

// Update block status (workflow transition)
router.post('/:id/status', auth, async (req, res) => {
  try {
    const { status, comment, hoursLogged } = req.body;
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    
    // Only assigned engineer or manager can update
    const isAssigned = block.assignedTo?.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';
    
    if (!isAssigned && !isManager) {
      return res.status(403).json({ message: 'Only assigned engineer can update status' });
    }
    
    const validTransitions = {
      'Not Started': ['In Progress'],
      'In Progress': ['DRC', 'Review'],
      'DRC': ['LVS', 'In Progress'],
      'LVS': ['Review', 'In Progress'],
      'Review': ['Completed', 'In Progress'],
    };
    
    if (!validTransitions[block.status]?.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition from ${block.status} to ${status}`
      });
    }
    
    block.status = status;
    block.statusHistory.push({
      status,
      changedBy: req.user._id,
      comment: comment || `Status changed to ${status}`,
    });
    
    if (hoursLogged) {
      block.actualHours = (block.actualHours || 0) + hoursLogged;
    }
    
    if (status === 'In Progress' && !block.startDate) {
      block.startDate = new Date();
    }
    if (status === 'Completed') {
      block.completedDate = new Date();
      if (block.assignedTo) {
        await User.findByIdAndUpdate(block.assignedTo, {
          $inc: { completedBlocks: 1, totalHoursLogged: block.actualHours || 0 }
        });
      }
    }
    
    block.delayRisk = predictDelayRisk(block);
    await block.save();
    
    // Notify manager of status change
    if (!isManager) {
      const managers = await User.find({ role: 'manager' });
      for (const mgr of managers) {
        await Notification.create({
          recipient: mgr._id,
          sender: req.user._id,
          type: 'status_update',
          title: 'Block Status Updated',
          message: `Block "${block.name}" moved to ${status}`,
          blockId: block._id,
        });
      }
    }
    
    await block.populate('assignedTo', 'name email avatar');
    await block.populate('createdBy', 'name email avatar');
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Status update failed', error: error.message });
  }
});

// Submit for approval
router.post('/:id/submit-review', auth, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    
    block.status = 'Review';
    block.approvals.push({
      submittedBy: req.user._id,
      submittedAt: new Date(),
      status: 'pending',
    });
    block.statusHistory.push({
      status: 'Review',
      changedBy: req.user._id,
      comment: 'Submitted for review',
    });
    
    await block.save();
    
    const managers = await User.find({ role: 'manager' });
    for (const mgr of managers) {
      await Notification.create({
        recipient: mgr._id,
        sender: req.user._id,
        type: 'approval_request',
        title: 'Approval Required',
        message: `Block "${block.name}" submitted for approval`,
        blockId: block._id,
        priority: 'high',
      });
    }
    
    await block.populate('assignedTo', 'name email avatar');
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Submission failed', error: error.message });
  }
});

// Approve or reject block
router.post('/:id/review', auth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { action, comments } = req.body;
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    
    const pendingApproval = block.approvals.find(a => a.status === 'pending');
    if (pendingApproval) {
      pendingApproval.reviewedBy = req.user._id;
      pendingApproval.reviewedAt = new Date();
      pendingApproval.status = action;
      pendingApproval.comments = comments;
    }
    
    if (action === 'approved') {
      block.status = 'Completed';
      block.completedDate = new Date();
      block.statusHistory.push({
        status: 'Completed',
        changedBy: req.user._id,
        comment: comments || 'Approved and completed',
      });
      if (block.assignedTo) {
        await User.findByIdAndUpdate(block.assignedTo, {
          $inc: { completedBlocks: 1 }
        });
      }
    } else if (action === 'rejected') {
      block.status = 'In Progress';
      block.statusHistory.push({
        status: 'In Progress',
        changedBy: req.user._id,
        comment: `Rejected: ${comments || 'Needs rework'}`,
      });
    }
    
    await block.save();
    
    if (block.assignedTo) {
      await Notification.create({
        recipient: block.assignedTo,
        sender: req.user._id,
        type: 'approval_result',
        title: action === 'approved' ? 'Block Approved! ✅' : 'Block Rejected ❌',
        message: comments || (action === 'approved' ? 'Your block has been approved' : 'Your block needs rework'),
        blockId: block._id,
        priority: action === 'rejected' ? 'high' : 'medium',
      });
    }
    
    await block.populate('assignedTo', 'name email avatar');
    await block.populate('createdBy', 'name email avatar');
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Review failed', error: error.message });
  }
});

// Get AI suggestions for engineer
router.get('/:id/suggest-engineer', auth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    
    const suggestions = await suggestBestEngineer(block);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Suggestion failed', error: error.message });
  }
});

// Get AI effort prediction
router.post('/predict-effort', auth, async (req, res) => {
  try {
    const { type, technologyNode, complexityLevel } = req.body;
    const predictedHours = predictEffort(type, technologyNode, complexityLevel);
    res.json({ predictedHours });
  } catch (error) {
    res.status(500).json({ message: 'Prediction failed' });
  }
});

module.exports = router;
