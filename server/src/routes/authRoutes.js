const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'TooManyRequests', message: 'Too many login attempts. Please try again later.' }
});

const registerSchema = {
  body: z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(6),
    fullName: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['admin', 'analyst', 'viewer']).optional()
  })
};

const loginSchema = {
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
};

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
