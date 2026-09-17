const mongoose = require('mongoose');

const threatIntelSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ip', 'domain', 'hash', 'url'],
    required: true,
    index: true
  },
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  verdict: {
    type: String,
    enum: ['benign', 'suspicious', 'malicious'],
    default: 'suspicious',
    index: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  source: {
    type: String,
    default: 'ThreatFeed'
  },
  tags: {
    type: [String],
    default: []
  },
  lastCheckedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ThreatIntel', threatIntelSchema);
