const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['manager', 'engineer', 'admin'],
    default: 'engineer',
  },
  skills: [{
    type: String,
    enum: ['Inverter', 'Current Mirror', 'Differential Pair', 'Bandgap', 'OTA', 'LDO', 'PLL', 'ADC', 'DAC', 'Comparator'],
  }],
  availability: {
    type: String,
    enum: ['available', 'partially_available', 'busy'],
    default: 'available',
  },
  totalHoursLogged: {
    type: Number,
    default: 0,
  },
  completedBlocks: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
