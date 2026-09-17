const Event = require('../models/Event');

async function getEvents(req, res, next) {
  try {
    const {
      source,
      eventType,
      status,
      severity,
      host,
      username,
      sourceIP,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (source) query.source = source;
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (host) query.host = new RegExp(host, 'i');
    if (username) query.username = new RegExp(username, 'i');
    if (sourceIP) query.sourceIP = new RegExp(sourceIP, 'i');

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) query.timestamp.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { description: new RegExp(search, 'i') },
        { techniqueId: new RegExp(search, 'i') },
        { host: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') },
        { sourceIP: new RegExp(search, 'i') }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      Event.countDocuments(query)
    ]);

    res.json({
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'NotFound', message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEvents,
  getEventById
};
