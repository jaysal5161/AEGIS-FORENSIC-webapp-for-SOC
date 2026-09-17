const IOC = require('../models/IOC');
const ThreatIntel = require('../models/ThreatIntel');

async function getIOCs(req, res, next) {
  try {
    const { type, reputation, caseId, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (reputation) query.reputation = reputation;
    if (caseId) query.caseId = caseId;
    if (search) {
      query.$or = [
        { value: new RegExp(search, 'i') },
        { notes: new RegExp(search, 'i') }
      ];
    }

    const iocs = await IOC.find(query).sort({ lastSeen: -1 }).limit(200);
    res.json(iocs);
  } catch (err) {
    next(err);
  }
}

async function createIOC(req, res, next) {
  try {
    const ioc = await IOC.create({
      ...req.body,
      source: req.body.source || 'manual'
    });
    res.status(201).json(ioc);
  } catch (err) {
    next(err);
  }
}

async function updateIOC(req, res, next) {
  try {
    const ioc = await IOC.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ioc) return res.status(404).json({ error: 'NotFound', message: 'IOC not found' });
    res.json(ioc);
  } catch (err) {
    next(err);
  }
}

async function deleteIOC(req, res, next) {
  try {
    const ioc = await IOC.findByIdAndDelete(req.params.id);
    if (!ioc) return res.status(404).json({ error: 'NotFound', message: 'IOC not found' });
    res.json({ message: 'IOC deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function lookupIOC(req, res, next) {
  try {
    const { type, value } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'BadRequest', message: 'type and value are required' });
    }

    const ti = await ThreatIntel.findOne({
      type,
      value: { $regex: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    const localIOC = await IOC.findOne({
      type,
      value: { $regex: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).populate('relatedEvents');

    res.json({
      query: { type, value },
      threatIntel: ti || null,
      localHistory: localIOC || null
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIOCs,
  createIOC,
  updateIOC,
  deleteIOC,
  lookupIOC
};
