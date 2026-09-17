const Case = require('../models/Case');
const Event = require('../models/Event');
const IOC = require('../models/IOC');
const Endpoint = require('../models/Endpoint');
const Account = require('../models/Account');
const Evidence = require('../models/Evidence');
const AttackChain = require('../models/AttackChain');
const ImpactAssessment = require('../models/ImpactAssessment');
const timelineService = require('../services/timelineService');
const attackChainService = require('../services/attackChainService');
const logger = require('../utils/logger');

async function getCases(req, res, next) {
  try {
    const { status, priority, phase, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (phase) query.phase = phase;
    if (search) {
      query.$or = [
        { caseId: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const cases = await Case.find(query)
      .populate('assignedTo', 'fullName username email')
      .populate('alertId', 'title alertId severity')
      .sort({ updatedAt: -1 });

    res.json(cases);
  } catch (err) {
    next(err);
  }
}

async function getCaseById(req, res, next) {
  try {
    const c = await Case.findById(req.params.id)
      .populate('assignedTo', 'fullName username email role')
      .populate('alertId')
      .populate('relatedAlerts')
      .populate('relatedEvents')
      .populate('iocs')
      .populate('accounts')
      .populate('endpoints')
      .populate('evidence')
      .populate('attackChainId')
      .populate('impactAssessmentId')
      .populate('review.reviewedBy', 'fullName username email');

    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });
    res.json(c);
  } catch (err) {
    next(err);
  }
}

async function createCase(req, res, next) {
  try {
    const year = new Date().getFullYear();
    const count = await Case.countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    const caseId = req.body.caseId || `CASE-${year}-${seq}`;

    const newCase = await Case.create({
      ...req.body,
      caseId,
      assignedTo: req.body.assignedTo || (req.user ? req.user._id : null),
      status: req.body.status || 'open',
      phase: req.body.phase || 'ingestion'
    });

    // Create initial attack chain
    const chain = await attackChainService.generateAttackChainForCase(newCase._id, []);
    newCase.attackChainId = chain._id;

    // Create initial impact assessment
    const impact = await ImpactAssessment.create({
      caseId: newCase._id,
      dataExposed: false,
      confidence: 70,
      businessImpact: 'Awaiting initial forensic profiling.'
    });
    newCase.impactAssessmentId = impact._id;
    await newCase.save();

    res.status(201).json(newCase);
  } catch (err) {
    next(err);
  }
}

async function updateCase(req, res, next) {
  try {
    const existing = await Case.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });

    // Guard: closed requires review saved
    if (req.body.status === 'closed') {
      const hasReview = existing.review && existing.review.findings && existing.review.findings.trim().length > 0;
      if (!hasReview && (!req.body.review || !req.body.review.findings || req.body.review.findings.trim().length === 0)) {
        return res.status(400).json({
          error: 'ReviewRequired',
          message: 'Cannot close case without completing and saving analyst forensic review findings'
        });
      }
    }

    const updated = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'fullName username email role');

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteCase(req, res, next) {
  try {
    const c = await Case.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function addEventsToCase(req, res, next) {
  try {
    const { eventIds } = req.body;
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ error: 'BadRequest', message: 'eventIds array required' });
    }

    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });

    for (const eid of eventIds) {
      if (!c.relatedEvents.includes(eid)) {
        c.relatedEvents.push(eid);
      }
    }
    await c.save();

    const events = await Event.find({ _id: { $in: c.relatedEvents } });
    await timelineService.buildCaseTimeline(c._id, events);
    await attackChainService.generateAttackChainForCase(c._id, events);

    res.json({ message: 'Events added to case and timeline updated', case: c });
  } catch (err) {
    next(err);
  }
}

async function removeEventFromCase(req, res, next) {
  try {
    const { eventId } = req.params;
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });

    c.relatedEvents = c.relatedEvents.filter(e => e.toString() !== eventId);
    await c.save();

    res.json({ message: 'Event unlinked from case', case: c });
  } catch (err) {
    next(err);
  }
}

async function getCaseEvidence(req, res, next) {
  try {
    const evidence = await Evidence.find({ caseId: req.params.id }).sort({ collectedAt: -1 });
    res.json(evidence);
  } catch (err) {
    next(err);
  }
}

async function addCaseEvidence(req, res, next) {
  try {
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });

    let filePath = '';
    let title = req.body.title || 'Forensic Artifact';

    if (req.file) {
      filePath = req.file.path;
      title = req.body.title || req.file.originalname;
    }

    const evidence = await Evidence.create({
      caseId: c._id,
      title,
      type: req.body.type || 'log',
      description: req.body.description || '',
      filePath,
      hashType: req.body.hashType || 'SHA256',
      hashValue: req.body.hashValue || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      collectedBy: req.user ? req.user.username : 'analyst',
      url: req.body.url || '',
      validForCase: true,
      analystValidated: req.body.analystValidated === 'true' || req.body.analystValidated === true
    });

    c.evidence.push(evidence._id);
    await c.save();

    res.status(201).json(evidence);
  } catch (err) {
    next(err);
  }
}

async function validateCaseEvidence(req, res, next) {
  try {
    const evidence = await Evidence.findById(req.params.evidenceId);
    if (!evidence) return res.status(404).json({ error: 'NotFound', message: 'Evidence not found' });

    evidence.analystValidated = req.body.analystValidated !== undefined ? req.body.analystValidated : !evidence.analystValidated;
    await evidence.save();
    res.json(evidence);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  addEventsToCase,
  removeEventFromCase,
  getCaseEvidence,
  addCaseEvidence,
  validateCaseEvidence
};

