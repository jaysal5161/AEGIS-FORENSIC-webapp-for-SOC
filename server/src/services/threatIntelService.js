/**
 * threatIntelService.js
 * Enriches IOCs against seeded and configured Threat Intelligence feeds.
 */

const ThreatIntel = require('../models/ThreatIntel');
const IOC = require('../models/IOC');
const logger = require('../utils/logger');

async function enrichIOCs(iocs) {
  if (!iocs || iocs.length === 0) return 0;

  let enrichedCount = 0;
  for (const ioc of iocs) {
    try {
      const ti = await ThreatIntel.findOne({
        type: ioc.type,
        value: { $regex: new RegExp(`^${ioc.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (ti) {
        ioc.reputation = ti.verdict === 'malicious' ? 'malicious' : ti.verdict === 'suspicious' ? 'suspicious' : 'good';
        ioc.confidence = Math.max(ioc.confidence || 50, ti.score || 75);
        if (ti.tags && ti.tags.length > 0) {
          ioc.notes = (ioc.notes ? ioc.notes + ' | ' : '') + `TI Feed: ${ti.source} [${ti.tags.join(', ')}]`;
        }
        await ioc.save();
        enrichedCount++;
      }
    } catch (err) {
      logger.error(`Error enriching IOC ${ioc.value}: ${err.message}`);
    }
  }

  return enrichedCount;
}

async function checkThreatIntel(type, value) {
  return await ThreatIntel.findOne({
    type,
    value: { $regex: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
}

module.exports = {
  enrichIOCs,
  checkThreatIntel
};
