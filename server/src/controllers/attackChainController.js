const AttackChain = require('../models/AttackChain');

async function getAttackChain(req, res, next) {
  try {
    let chain = await AttackChain.findOne({ caseId: req.params.caseId });
    if (!chain) {
      chain = await AttackChain.create({
        caseId: req.params.caseId,
        stages: [],
        confidence: 60,
        notes: 'Attack chain initialized. Awaiting event ingestion.'
      });
    }
    res.json(chain);
  } catch (err) {
    next(err);
  }
}

async function updateAttackChain(req, res, next) {
  try {
    const chain = await AttackChain.findOneAndUpdate(
      { caseId: req.params.caseId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(chain);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAttackChain,
  updateAttackChain
};
