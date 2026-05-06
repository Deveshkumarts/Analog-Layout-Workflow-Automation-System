const express = require('express');
const Block = require('../models/Block');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';
    const filter = isManager ? {} : { assignedTo: req.user._id };
    
    const blocks = await Block.find(filter).populate('assignedTo', 'name email avatar');
    
    const totalBlocks = blocks.length;
    const blocksByStage = {
      'Not Started': blocks.filter(b => b.status === 'Not Started').length,
      'In Progress': blocks.filter(b => b.status === 'In Progress').length,
      'DRC': blocks.filter(b => b.status === 'DRC').length,
      'LVS': blocks.filter(b => b.status === 'LVS').length,
      'Review': blocks.filter(b => b.status === 'Review').length,
      'Completed': blocks.filter(b => b.status === 'Completed').length,
    };
    
    const pendingApprovals = blocks.filter(b => 
      b.approvals.some(a => a.status === 'pending')
    ).length;
    
    const totalEstimated = blocks.reduce((sum, b) => sum + (b.estimatedHours || 0), 0);
    const totalActual = blocks.reduce((sum, b) => sum + (b.actualHours || 0), 0);
    
    const delayRisks = {
      high: blocks.filter(b => b.delayRisk === 'High').length,
      medium: blocks.filter(b => b.delayRisk === 'Medium').length,
      low: blocks.filter(b => b.delayRisk === 'Low').length,
    };
    
    const blocksByType = {};
    blocks.forEach(b => {
      blocksByType[b.type] = (blocksByType[b.type] || 0) + 1;
    });
    
    const blocksByPriority = {};
    blocks.forEach(b => {
      blocksByPriority[b.priority] = (blocksByPriority[b.priority] || 0) + 1;
    });
    
    const completionRate = totalBlocks > 0 
      ? Math.round((blocksByStage['Completed'] / totalBlocks) * 100) 
      : 0;
    
    const engineers = isManager ? await User.find({ role: 'engineer' }).select('name email avatar availability completedBlocks') : [];
    
    const recentBlocks = blocks
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
    
    res.json({
      totalBlocks,
      blocksByStage,
      pendingApprovals,
      totalEstimated: Math.round(totalEstimated),
      totalActual: Math.round(totalActual),
      delayRisks,
      blocksByType,
      blocksByPriority,
      completionRate,
      engineers,
      recentBlocks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get analytics data
router.get('/analytics', auth, async (req, res) => {
  try {
    const blocks = await Block.find().populate('assignedTo', 'name email avatar');
    
    // Weekly progress data (last 8 weeks)
    const weeklyData = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const completed = blocks.filter(b => 
        b.completedDate && new Date(b.completedDate) >= weekStart && new Date(b.completedDate) < weekEnd
      ).length;
      
      const created = blocks.filter(b => 
        new Date(b.createdAt) >= weekStart && new Date(b.createdAt) < weekEnd
      ).length;
      
      weeklyData.push({
        week: `W${8 - i}`,
        completed,
        created,
        date: weekStart.toLocaleDateString(),
      });
    }
    
    // Engineer performance
    const engineers = await User.find({ role: 'engineer' }).select('name completedBlocks totalHoursLogged rating');
    const engineerPerformance = engineers.map(eng => ({
      name: eng.name,
      completedBlocks: eng.completedBlocks,
      hoursLogged: eng.totalHoursLogged,
      rating: eng.rating,
      activeBlocks: blocks.filter(b => 
        b.assignedTo?._id?.toString() === eng._id.toString() && b.status !== 'Completed'
      ).length,
    }));
    
    // Efficiency data
    const efficiencyData = blocks
      .filter(b => b.estimatedHours > 0 && b.actualHours > 0)
      .map(b => ({
        name: b.name,
        estimated: b.estimatedHours,
        actual: b.actualHours,
        efficiency: Math.round((b.estimatedHours / b.actualHours) * 100),
      }));
    
    res.json({ weeklyData, engineerPerformance, efficiencyData });
  } catch (error) {
    res.status(500).json({ message: 'Analytics failed', error: error.message });
  }
});

module.exports = router;
