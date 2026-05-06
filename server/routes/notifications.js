const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.read = false;
    
    const notifications = await Notification.find(filter)
      .populate('sender', 'name avatar')
      .populate('blockId', 'name type status')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
