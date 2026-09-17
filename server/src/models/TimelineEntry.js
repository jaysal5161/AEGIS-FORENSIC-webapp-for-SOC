const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['authentication', 'network', 'process', 'file', 'dns', 'system'],
    default: 'system'
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  sourceIP: {
    type: String,
    default: ''
  },
  host: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: ''
  },
  attackStage: {
    type: String,
    default: ''
  },
  ref: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

timelineEntrySchema.index({ caseId: 1, timestamp: 1 });

module.exports = mongoose.model('TimelineEntry', timelineEntrySchema);
