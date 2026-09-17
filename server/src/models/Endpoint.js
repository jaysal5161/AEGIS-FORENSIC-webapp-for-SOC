const mongoose = require('mongoose');

const endpointSchema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  os: {
    type: String,
    default: 'Windows Server 2022'
  },
  ipAddresses: {
    type: [String],
    default: []
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  userCount: {
    type: Number,
    default: 0
  },
  users: {
    type: [String],
    default: []
  },
  openPorts: {
    type: [Number],
    default: []
  },
  realm: {
    type: String,
    enum: ['domain', 'workgroup'],
    default: 'domain'
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
    enum: ['clean', 'suspicious', 'compromised', 'unknown'],
    default: 'clean',
    index: true
  },
  domainJoined: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Endpoint', endpointSchema);
