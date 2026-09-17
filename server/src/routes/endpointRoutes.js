const express = require('express');
const router = express.Router();
const endpointController = require('../controllers/endpointController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, endpointController.getEndpoints);
router.get('/:id', authenticate, endpointController.getEndpointById);
router.patch('/:id', authenticate, authorize('admin', 'analyst'), endpointController.updateEndpoint);

module.exports = router;
