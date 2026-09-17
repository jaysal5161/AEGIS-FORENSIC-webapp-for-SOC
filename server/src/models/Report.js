const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  reportNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  sections: {
    incidentSummary: { type: String, default: '' },
    affectedAssets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    affectedAccounts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
    iocs: { type: [mongoose.Schema.Types.Mixed], default: [] },
    attackChain: { type: [mongoose.Schema.Types.Mixed], default: [] },
    evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
    analystFindings: { type: String, default: '' },
    impactAssessment: { type: mongoose.Schema.Types.Mixed, default: {} },
    recommendations: { type: [String], default: [] }
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  format: {
    type: String,
    enum: ['pdf', 'md', 'html'],
    default: 'md'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
