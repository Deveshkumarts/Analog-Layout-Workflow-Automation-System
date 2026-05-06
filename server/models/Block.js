const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'DRC', 'LVS', 'Review', 'Completed'],
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  comment: String,
});

const approvalSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  comments: String,
});

const blockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Inverter', 'Current Mirror', 'Differential Pair', 'Bandgap', 'OTA', 'LDO', 'PLL', 'ADC', 'DAC', 'Comparator'],
  },
  description: {
    type: String,
    default: '',
  },
  estimatedArea: {
    type: Number,
    required: true,
    min: 0,
  },
  technologyNode: {
    type: String,
    required: true,
    enum: ['180nm', '130nm', '90nm', '65nm', '45nm', '28nm', '22nm', '14nm', '7nm', '5nm'],
  },
  complexityLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical'],
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'DRC', 'LVS', 'Review', 'Completed'],
    default: 'Not Started',
  },
  estimatedHours: {
    type: Number,
    default: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
  },
  baseHours: {
    type: Number,
    default: 0,
  },
  complexityFactor: {
    type: Number,
    default: 1,
  },
  managerOverrideHours: {
    type: Number,
    default: null,
  },
  aiPredictedHours: {
    type: Number,
    default: null,
  },
  delayRisk: {
    type: String,
    enum: ['Low', 'Medium', 'High', null],
    default: null,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  statusHistory: [statusHistorySchema],
  approvals: [approvalSchema],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  tags: [String],
  dueDate: {
    type: Date,
    default: null,
  },
  startDate: {
    type: Date,
    default: null,
  },
  completedDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

blockSchema.pre('save', function(next) {
  const complexityFactors = {
    'Low': 1,
    'Medium': 1.5,
    'High': 2.5,
    'Critical': 4,
  };
  this.complexityFactor = complexityFactors[this.complexityLevel] || 1;
  if (!this.managerOverrideHours) {
    this.estimatedHours = this.baseHours * this.complexityFactor;
  } else {
    this.estimatedHours = this.managerOverrideHours;
  }
  next();
});

module.exports = mongoose.model('Block', blockSchema);
