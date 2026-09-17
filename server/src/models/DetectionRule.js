const mongoose = require('mongoose');

const detectionRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  condition: {
    eventType: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      default: ''
    },
    threshold: {
      type: Number,
      default: 1
    },
    windowSeconds: {
      type: Number,
      default: 300
    },
    // Pattern identifier for advanced correlation (e.g. 'failed_then_success_login', 'powershell_obfuscation', 'mass_file_ops')
    patternType: {
      type: String,
      default: 'threshold'
    }
  },
  mitreTechniqueId: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DetectionRule', detectionRuleSchema);
