const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  domain: {
    type: String,
    default: 'CORP.LOCAL'
  },
  privilege: {
    type: String,
    enum: ['standard', 'admin', 'domain_admin', 'service'],
    default: 'standard'
  },
  successLogins: {
    type: Number,
    default: 0
  },
  failedLogins: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  sourceIPs: {
    type: [String],
    default: []
  },
  endpoints: {
    type: [String],
    default: []
  },
  associatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  status: {
    type: String,
    enum: ['clean', 'suspicious', 'compromised'],
    default: 'clean',
    index: true
  },
  isServiceAccount: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Account', accountSchema);
