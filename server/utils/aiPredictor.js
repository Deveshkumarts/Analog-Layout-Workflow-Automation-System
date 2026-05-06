// AI Prediction Utilities for FlowSync IC
// These simulate AI-based predictions using heuristic algorithms

const Block = require('../models/Block');
const User = require('../models/User');

// Complexity and tech node base hour mappings
const BASE_HOURS_MAP = {
  'Inverter': 8,
  'Current Mirror': 12,
  'Differential Pair': 20,
  'Bandgap': 32,
  'OTA': 40,
  'LDO': 35,
  'PLL': 60,
  'ADC': 55,
  'DAC': 50,
  'Comparator': 15,
};

const TECH_NODE_FACTOR = {
  '180nm': 0.8,
  '130nm': 0.9,
  '90nm': 1.0,
  '65nm': 1.1,
  '45nm': 1.3,
  '28nm': 1.5,
  '22nm': 1.7,
  '14nm': 2.0,
  '7nm': 2.5,
  '5nm': 3.0,
};

const COMPLEXITY_FACTOR = {
  'Low': 1.0,
  'Medium': 1.5,
  'High': 2.5,
  'Critical': 4.0,
};

// AI Effort Estimation
function predictEffort(blockType, technologyNode, complexityLevel) {
  const baseHours = BASE_HOURS_MAP[blockType] || 20;
  const techFactor = TECH_NODE_FACTOR[technologyNode] || 1.0;
  const complexFactor = COMPLEXITY_FACTOR[complexityLevel] || 1.0;
  const predicted = baseHours * techFactor * complexFactor;
  const variance = (Math.random() * 0.2 - 0.1) * predicted;
  return Math.round((predicted + variance) * 10) / 10;
}

// AI Delay Risk Prediction
function predictDelayRisk(block) {
  let riskScore = 0;
  
  // Factor 1: Hours ratio
  if (block.actualHours > 0 && block.estimatedHours > 0) {
    const hoursRatio = block.actualHours / block.estimatedHours;
    if (hoursRatio > 0.8) riskScore += 30;
    else if (hoursRatio > 0.6) riskScore += 15;
  }
  
  // Factor 2: Status progress vs time
  const statusProgress = {
    'Not Started': 0,
    'In Progress': 0.2,
    'DRC': 0.4,
    'LVS': 0.6,
    'Review': 0.8,
    'Completed': 1.0,
  };
  
  if (block.dueDate && block.startDate) {
    const totalTime = new Date(block.dueDate) - new Date(block.startDate);
    const elapsed = Date.now() - new Date(block.startDate);
    const timeProgress = Math.min(elapsed / totalTime, 1);
    const progress = statusProgress[block.status] || 0;
    
    if (timeProgress > progress + 0.3) riskScore += 35;
    else if (timeProgress > progress + 0.15) riskScore += 20;
  }
  
  // Factor 3: Complexity
  if (block.complexityLevel === 'Critical') riskScore += 20;
  else if (block.complexityLevel === 'High') riskScore += 10;
  
  // Factor 4: Rejection history
  const rejections = block.approvals?.filter(a => a.status === 'rejected').length || 0;
  riskScore += rejections * 15;
  
  if (riskScore >= 50) return 'High';
  if (riskScore >= 25) return 'Medium';
  return 'Low';
}

// Smart Resource Allocation
async function suggestBestEngineer(block) {
  const engineers = await User.find({ role: 'engineer', isActive: true });
  const existingBlocks = await Block.find({
    assignedTo: { $in: engineers.map(e => e._id) },
    status: { $nin: ['Completed'] }
  });
  
  const suggestions = engineers.map(engineer => {
    let matchScore = 0;
    
    // Skill match (40%)
    if (engineer.skills?.includes(block.type)) {
      matchScore += 40;
    } else {
      matchScore += 10;
    }
    
    // Availability (30%)
    const assignedCount = existingBlocks.filter(
      b => b.assignedTo?.toString() === engineer._id.toString()
    ).length;
    
    if (engineer.availability === 'available' && assignedCount < 2) {
      matchScore += 30;
    } else if (engineer.availability === 'partially_available' || assignedCount < 4) {
      matchScore += 15;
    } else {
      matchScore += 5;
    }
    
    // Experience / Rating (20%)
    matchScore += (engineer.rating / 5) * 20;
    
    // Past work (10%)
    const completionRate = engineer.completedBlocks > 0 ? 
      Math.min(engineer.completedBlocks / 10, 1) * 10 : 5;
    matchScore += completionRate;
    
    return {
      engineer: {
        _id: engineer._id,
        name: engineer.name,
        email: engineer.email,
        avatar: engineer.avatar,
        skills: engineer.skills,
        availability: engineer.availability,
        rating: engineer.rating,
        completedBlocks: engineer.completedBlocks,
      },
      matchPercentage: Math.min(Math.round(matchScore), 100),
      currentWorkload: assignedCount,
      skillMatch: engineer.skills?.includes(block.type) || false,
    };
  });
  
  return suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

module.exports = {
  predictEffort,
  predictDelayRisk,
  suggestBestEngineer,
  BASE_HOURS_MAP,
  TECH_NODE_FACTOR,
  COMPLEXITY_FACTOR,
};
