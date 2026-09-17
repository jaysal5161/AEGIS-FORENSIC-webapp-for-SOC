const mongoose = require('mongoose');

const impactAssessmentSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    unique: true
  },
  affectedEndpoints: [{
    hostname: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
  }],
  affectedAccounts: [{
    username: { type: String, required: true },
    role: { type: String, default: 'standard' },
    sensitivity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
  }],
  affectedFiles: [{
    path: { type: String, required: true },
    sensitivity: { type: String, enum: ['public', 'internal', 'confidential', 'restricted'], default: 'confidential' }
  }],
  dataExposed: {
    type: Boolean,
    default: false
  },
  malwareDetected: {
    type: String,
    default: ''
  },
  businessImpact: {
    type: String,
    default: ''
  },
  // Clearly separate auto-detected evidence vs analyst-entered assessment
  autoDetectedIndicators: {
    type: [String],
    default: []
  },
  analystNotes: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 85
  },
  assessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ImpactAssessment', impactAssessmentSchema);
