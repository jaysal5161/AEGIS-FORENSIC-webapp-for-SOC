const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/case/:caseId', authenticate, reviewController.getCaseReview);
router.post('/case/:caseId', authenticate, authorize('admin', 'analyst'), reviewController.saveCaseReview);

module.exports = router;
