const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  findings: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  validatedFlags: {
    evidence: { type: Boolean, default: false },
    timeline: { type: Boolean, default: false },
    iocs: { type: Boolean, default: false }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'pending_review', 'closed'],
    default: 'open',
    index: true
  },
  phase: {
    type: String,
    enum: ['ingestion', 'analysis', 'investigation', 'forensics', 'impact', 'review', 'closed'],
    default: 'ingestion'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    default: null
  },
  relatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  relatedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  iocs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IOC'
  }],
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],
  endpoints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Endpoint'
  }],
  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence'
  }],
  attackChainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttackChain',
    default: null
  },
  impactAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImpactAssessment',
    default: null
  },
  review: {
    type: reviewSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);
