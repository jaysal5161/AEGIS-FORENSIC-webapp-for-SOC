const fs = require('fs');
const Event = require('../models/Event');
const IOC = require('../models/IOC');
const parserService = require('../services/parserService');
const normalizationService = require('../services/normalizationService');
const iocExtractionService = require('../services/iocExtractionService');
const threatIntelService = require('../services/threatIntelService');
const profilingService = require('../services/profilingService');
const detectionService = require('../services/detectionService');
const logger = require('../utils/logger');

async function uploadLog(req, res, next) {
  try {
    let content = '';
    let fileName = 'raw_log.txt';

    if (req.file) {
      fileName = req.file.originalname;
      content = fs.readFileSync(req.file.path, 'utf8');
      // Clean up temp file safely
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    } else if (req.body.content) {
      content = req.body.content;
      fileName = req.body.fileName || 'manual_entry.log';
    } else {
      return res.status(400).json({ error: 'BadRequest', message: 'No file or content uploaded' });
    }

    // 1. Parse raw content
    const rawRecords = parserService.parseFile(fileName, content);
    if (!rawRecords || rawRecords.length === 0) {
      return res.status(400).json({
        error: 'ParseError',
        message: 'No valid records could be parsed from the provided input'
      });
    }

    // 2. Normalize to Common Event Model
    const normalizedEvents = normalizationService.normalizeRecords(rawRecords, fileName);

    // 3. Insert events in chunks
    const CHUNK_SIZE = 250;
    const insertedEvents = [];
    for (let i = 0; i < normalizedEvents.length; i += CHUNK_SIZE) {
      const chunk = normalizedEvents.slice(i, i + CHUNK_SIZE);
      const inserted = await Event.insertMany(chunk, { ordered: false });
      insertedEvents.push(...inserted);
    }

    // 4. Post-processing pipeline
    // A. IOC extraction
    const iocsExtracted = await iocExtractionService.extractAndStoreIOCs(insertedEvents);

    // B. Threat intel enrichment
    const recentIOCs = await IOC.find().sort({ updatedAt: -1 }).limit(100);
    await threatIntelService.enrichIOCs(recentIOCs);

    // C. Asset & account profiling
    await profilingService.updateProfilesFromEvents(insertedEvents);

    // D. Detection engine
    const alertsGenerated = await detectionService.runDetectionEngine(insertedEvents);

    logger.info(`Log ingestion pipeline finished: ${insertedEvents.length} events, ${iocsExtracted} IOCs, ${alertsGenerated.length} alerts.`);

    res.status(201).json({
      message: 'Logs processed and normalized successfully',
      summary: {
        fileName,
        eventsInserted: insertedEvents.length,
        iocsExtracted,
        alertsGenerated: alertsGenerated.length,
        errors: 0
      }
    });
  } catch (err) {
    logger.error(`Error in log upload pipeline: ${err.message}`);
    next(err);
  }
}

async function parsePreview(req, res, next) {
  try {
    const { content, fileName } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'BadRequest', message: 'Content required for preview' });
    }
    const rawRecords = parserService.parseFile(fileName || 'sample.log', content).slice(0, 5);
    const normalized = normalizationService.normalizeRecords(rawRecords, fileName || 'sample.log');
    res.json({ count: normalized.length, preview: normalized });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadLog,
  parsePreview
};
