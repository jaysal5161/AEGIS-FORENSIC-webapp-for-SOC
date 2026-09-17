const express = require('express');
const router = express.Router();
const iocController = require('../controllers/iocController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, iocController.getIOCs);
router.post('/', authenticate, authorize('admin', 'analyst'), iocController.createIOC);
router.post('/lookup', authenticate, iocController.lookupIOC);
router.patch('/:id', authenticate, authorize('admin', 'analyst'), iocController.updateIOC);
router.delete('/:id', authenticate, authorize('admin'), iocController.deleteIOC);

module.exports = router;
