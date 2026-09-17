const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, alertController.getAlerts);
router.get('/:id', authenticate, alertController.getAlertById);
router.patch('/:id', authenticate, authorize('admin', 'analyst'), alertController.updateAlert);
router.post('/:id/assign-endpoint-profiles', authenticate, authorize('admin', 'analyst'), alertController.assignEndpointProfiles);
router.post('/:id/create-case', authenticate, authorize('admin', 'analyst'), alertController.createCaseFromAlert);

module.exports = router;
