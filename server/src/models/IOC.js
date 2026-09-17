const mongoose = require('mongoose');

const iocSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ip', 'domain', 'url', 'hash', 'username', 'hostname', 'email', 'mutex'],
    required: true,
    index: true
  },
  value: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  source: {
    type: String,
    enum: ['extracted', 'manual', 'threat_intel'],
    default: 'extracted'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  reputation: {
    type: String,
    enum: ['good', 'suspicious', 'malicious', 'unknown'],
    default: 'unknown',
    index: true
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  count: {
    type: Number,
    default: 1
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  relatedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }]
}, {
  timestamps: true
});

iocSchema.index({ type: 1, value: 1 });

module.exports = mongoose.model('IOC', iocSchema);
