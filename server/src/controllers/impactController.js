const ImpactAssessment = require('../models/ImpactAssessment');

async function getImpactAssessment(req, res, next) {
  try {
    let impact = await ImpactAssessment.findOne({ caseId: req.params.caseId })
      .populate('assessedBy', 'fullName username email');

    if (!impact) {
      impact = await ImpactAssessment.create({
        caseId: req.params.caseId,
        affectedEndpoints: [],
        affectedAccounts: [],
        affectedFiles: [],
        dataExposed: false,
        malwareDetected: 'None identified',
        businessImpact: 'Operational status normal',
        autoDetectedIndicators: [],
        analystNotes: 'Initial triage in progress.',
        confidence: 70
      });
    }
    res.json(impact);
  } catch (err) {
    next(err);
  }
}

async function updateImpactAssessment(req, res, next) {
  try {
    const updateData = {
      ...req.body,
      assessedBy: req.user ? req.user._id : req.body.assessedBy
    };

    const impact = await ImpactAssessment.findOneAndUpdate(
      { caseId: req.params.caseId },
      { $set: updateData },
      { new: true, upsert: true }
    ).populate('assessedBy', 'fullName username email');

    res.json(impact);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getImpactAssessment,
  updateImpactAssessment
};
