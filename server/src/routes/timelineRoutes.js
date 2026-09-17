const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/case/:caseId', authenticate, timelineController.getCaseTimeline);
router.post('/case/:caseId', authenticate, authorize('admin', 'analyst'), timelineController.addTimelineEntry);
router.delete('/:id', authenticate, authorize('admin', 'analyst'), timelineController.deleteTimelineEntry);

module.exports = router;
