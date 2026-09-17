const express = require('express');
const router = express.Router();
const attackChainController = require('../controllers/attackChainController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/case/:caseId', authenticate, attackChainController.getAttackChain);
router.patch('/case/:caseId', authenticate, authorize('admin', 'analyst'), attackChainController.updateAttackChain);

module.exports = router;
