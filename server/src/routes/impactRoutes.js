const express = require('express');
const router = express.Router();
const impactController = require('../controllers/impactController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/case/:caseId', authenticate, impactController.getImpactAssessment);
router.put('/case/:caseId', authenticate, authorize('admin', 'analyst'), impactController.updateImpactAssessment);

module.exports = router;
