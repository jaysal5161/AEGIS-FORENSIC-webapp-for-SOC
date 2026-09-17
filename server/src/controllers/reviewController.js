const Case = require('../models/Case');

async function getCaseReview(req, res, next) {
  try {
    const c = await Case.findById(req.params.caseId)
      .populate('review.reviewedBy', 'fullName username email');

    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });
    res.json(c.review || {});
  } catch (err) {
    next(err);
  }
}

async function saveCaseReview(req, res, next) {
  try {
    const c = await Case.findById(req.params.caseId);
    if (!c) return res.status(404).json({ error: 'NotFound', message: 'Case not found' });

    const reviewData = {
      findings: req.body.findings || '',
      notes: req.body.notes || '',
      validatedFlags: {
        evidence: Boolean(req.body.validatedFlags?.evidence),
        timeline: Boolean(req.body.validatedFlags?.timeline),
        iocs: Boolean(req.body.validatedFlags?.iocs)
      },
      reviewedBy: req.user ? req.user._id : req.body.reviewedBy,
      reviewedAt: new Date()
    };

    c.review = reviewData;
    c.phase = 'review';
    await c.save();

    const populated = await Case.findById(c._id)
      .populate('review.reviewedBy', 'fullName username email');

    res.json({
      message: 'Forensic review saved successfully',
      review: populated.review
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCaseReview,
  saveCaseReview
};
