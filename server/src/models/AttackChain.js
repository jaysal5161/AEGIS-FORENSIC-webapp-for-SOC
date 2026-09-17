const mongoose = require('mongoose');

const attackStageSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: [
      'InitialAccess',
      'Execution',
      'Persistence',
      'PrivilegeEscalation',
      'DefenseEvasion',
      'CredentialAccess',
      'Discovery',
      'LateralMovement',
      'Collection',
      'Exfiltration'
    ],
    required: true
  },
  techniqueId: {
    type: String,
    default: ''
  },
  techniqueName: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    default: ''
  },
  eventHints: {
    type: String,
    default: ''
  }
}, { _id: true });

const attackChainSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    unique: true
  },
  stages: {
    type: [attackStageSchema],
    default: []
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AttackChain', attackChainSchema);
