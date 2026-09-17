const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, accountController.getAccounts);
router.get('/:id', authenticate, accountController.getAccountById);
router.patch('/:id', authenticate, authorize('admin', 'analyst'), accountController.updateAccount);

module.exports = router;
