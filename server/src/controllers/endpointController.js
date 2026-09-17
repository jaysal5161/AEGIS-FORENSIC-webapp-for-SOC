const Endpoint = require('../models/Endpoint');

async function getEndpoints(req, res, next) {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { hostname: new RegExp(search, 'i') },
        { os: new RegExp(search, 'i') },
        { ipAddresses: new RegExp(search, 'i') }
      ];
    }

    const endpoints = await Endpoint.find(query)
      .populate('associatedAlerts', 'alertId title severity status')
      .sort({ riskScore: -1 });

    res.json(endpoints);
  } catch (err) {
    next(err);
  }
}

async function getEndpointById(req, res, next) {
  try {
    const endpoint = await Endpoint.findById(req.params.id)
      .populate('associatedAlerts');
    if (!endpoint) return res.status(404).json({ error: 'NotFound', message: 'Endpoint not found' });
    res.json(endpoint);
  } catch (err) {
    next(err);
  }
}

async function updateEndpoint(req, res, next) {
  try {
    const endpoint = await Endpoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!endpoint) return res.status(404).json({ error: 'NotFound', message: 'Endpoint not found' });
    res.json(endpoint);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEndpoints,
  getEndpointById,
  updateEndpoint
};
