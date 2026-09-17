const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, reportController.getAllReports);
router.get('/case/:caseId', authenticate, reportController.getCaseReport);
router.post('/case/:caseId/generate', authenticate, authorize('admin', 'analyst'), reportController.generateCaseReport);
router.get('/case/:caseId/export', authenticate, reportController.exportCaseReport);

module.exports = router;
