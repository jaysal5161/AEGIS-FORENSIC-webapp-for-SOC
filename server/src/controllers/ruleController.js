const DetectionRule = require('../models/DetectionRule');
const Event = require('../models/Event');
const detectionService = require('../services/detectionService');

async function getRules(req, res, next) {
  try {
    const rules = await DetectionRule.find().sort({ createdAt: -1 });
    res.json(rules);
  } catch (err) {
    next(err);
  }
}

async function getRuleById(req, res, next) {
  try {
    const rule = await DetectionRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'NotFound', message: 'Detection rule not found' });
    res.json(rule);
  } catch (err) {
    next(err);
  }
}

async function createRule(req, res, next) {
  try {
    const rule = await DetectionRule.create(req.body);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
}

async function updateRule(req, res, next) {
  try {
    const rule = await DetectionRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ error: 'NotFound', message: 'Detection rule not found' });
    res.json(rule);
  } catch (err) {
    next(err);
  }
}

async function deleteRule(req, res, next) {
  try {
    const rule = await DetectionRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ error: 'NotFound', message: 'Detection rule not found' });
    res.json({ message: 'Rule deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function runAllRules(req, res, next) {
  try {
    const recentEvents = await Event.find().sort({ timestamp: -1 }).limit(500);
    const alerts = await detectionService.runDetectionEngine(recentEvents);
    res.json({
      message: `Detection engine executed over ${recentEvents.length} events`,
      alertsGenerated: alerts.length,
      alerts
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  runAllRules
};
