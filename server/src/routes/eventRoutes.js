const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, eventController.getEvents);
router.get('/:id', authenticate, eventController.getEventById);

module.exports = router;
