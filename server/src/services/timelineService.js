/**
 * timelineService.js
 * Builds, synchronizes, and annotates chronological forensic timeline for cases.
 */

const TimelineEntry = require('../models/TimelineEntry');
const Event = require('../models/Event');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

async function buildCaseTimeline(caseId, events = [], alert = null) {
  try {
    const entries = [];

    // 1. Initial Alert timeline entry
    if (alert) {
      entries.push({
        caseId,
        timestamp: alert.createdAt || new Date(),
        title: `Initial Alert: ${alert.title}`,
        category: alert.eventType === 'authentication' ? 'authentication' : 'system',
        description: alert.description,
        severity: alert.severity,
        sourceIP: alert.sourceIP,
        host: alert.host,
        username: alert.username,
        attackStage: 'InitialAccess',
        ref: alert.alertId
      });
    }

    // 2. Event entries
    for (const ev of events) {
      let category = 'system';
      if (['authentication', 'network', 'process', 'file', 'dns'].includes(ev.eventType)) {
        category = ev.eventType;
      }

      entries.push({
        caseId,
        timestamp: ev.timestamp,
        title: `${ev.action ? ev.action.toUpperCase() : 'EVENT'}: ${ev.description.substring(0, 60)}...`,
        category,
        description: ev.description,
        severity: ev.severity,
        eventId: ev._id,
        sourceIP: ev.sourceIP,
        host: ev.host,
        username: ev.username,
        attackStage: ev.techniqueId || '',
        ref: ev.techniqueId ? `MITRE ${ev.techniqueId}` : ''
      });
    }

    // Bulk write or upsert
    if (entries.length > 0) {
      // Avoid inserting duplicates if eventId already on timeline
      for (const entry of entries) {
        const query = entry.eventId
          ? { caseId, eventId: entry.eventId }
          : { caseId, title: entry.title, timestamp: entry.timestamp };

        await TimelineEntry.findOneAndUpdate(
          query,
          { $set: entry },
          { upsert: true, new: true }
        );
      }
    }

    return await TimelineEntry.find({ caseId }).sort({ timestamp: 1 });
  } catch (err) {
    logger.error(`Error building case timeline: ${err.message}`);
    return [];
  }
}

module.exports = {
  buildCaseTimeline
};
