const express = require('express');
const User = require('../models/User');
const Block = require('../models/Block');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all engineers
router.get('/engineers', auth, async (req, res) => {
  try {
    const engineers = await User.find({ role: 'engineer', isActive: true })
      .select('name email avatar skills availability rating completedBlocks totalHoursLogged');
    
    // Add workload info
    const engineersWithWorkload = await Promise.all(engineers.map(async (eng) => {
      const activeBlocks = await Block.countDocuments({
        assignedTo: eng._id,
        status: { $nin: ['Completed'] }
      });
      return {
        ...eng.toObject(),
        activeBlocks,
      };
    }));
    
    res.json(engineersWithWorkload);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch engineers' });
  }
});

// Get all users (admin)
router.get('/', auth, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/:id/role', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
