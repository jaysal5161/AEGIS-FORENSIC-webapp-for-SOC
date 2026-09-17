const TimelineEntry = require('../models/TimelineEntry');

async function getCaseTimeline(req, res, next) {
  try {
    const { category, severity } = req.query;
    const query = { caseId: req.params.caseId };

    if (category) query.category = category;
    if (severity) query.severity = severity;

    const timeline = await TimelineEntry.find(query).sort({ timestamp: 1 });
    res.json(timeline);
  } catch (err) {
    next(err);
  }
}

async function addTimelineEntry(req, res, next) {
  try {
    const entry = await TimelineEntry.create({
      ...req.body,
      caseId: req.params.caseId,
      timestamp: req.body.timestamp || new Date()
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

async function deleteTimelineEntry(req, res, next) {
  try {
    const entry = await TimelineEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'NotFound', message: 'Timeline entry not found' });
    res.json({ message: 'Timeline entry deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCaseTimeline,
  addTimelineEntry,
  deleteTimelineEntry
};
