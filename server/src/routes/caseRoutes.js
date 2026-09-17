const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const caseController = require('../controllers/caseController');
const { authenticate, authorize } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(8).toString('hex');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `evidence-${Date.now()}-${hash}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.get('/', authenticate, caseController.getCases);
router.post('/', authenticate, authorize('admin', 'analyst'), caseController.createCase);
router.get('/:id', authenticate, caseController.getCaseById);
router.patch('/:id', authenticate, authorize('admin', 'analyst'), caseController.updateCase);
router.delete('/:id', authenticate, authorize('admin'), caseController.deleteCase);

// Case events management
router.post('/:id/add-events', authenticate, authorize('admin', 'analyst'), caseController.addEventsToCase);
router.delete('/:id/events/:eventId', authenticate, authorize('admin', 'analyst'), caseController.removeEventFromCase);

// Case evidence management
router.get('/:id/evidence', authenticate, caseController.getCaseEvidence);
router.post('/:id/evidence', authenticate, authorize('admin', 'analyst'), upload.single('file'), caseController.addCaseEvidence);
router.patch('/:id/evidence/:evidenceId/validate', authenticate, authorize('admin', 'analyst'), caseController.validateCaseEvidence);

module.exports = router;
