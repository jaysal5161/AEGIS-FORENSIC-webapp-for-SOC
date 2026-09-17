const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['log', 'file', 'screenshot', 'note', 'pcap', 'artifact'],
    default: 'log'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  filePath: {
    type: String,
    default: ''
  },
  hashType: {
    type: String,
    enum: ['MD5', 'SHA1', 'SHA256', 'NONE'],
    default: 'SHA256'
  },
  hashValue: {
    type: String,
    default: ''
  },
  collectedBy: {
    type: String,
    default: 'analyst'
  },
  collectedAt: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    default: ''
  },
  validForCase: {
    type: Boolean,
    default: true
  },
  analystValidated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evidence', evidenceSchema);
