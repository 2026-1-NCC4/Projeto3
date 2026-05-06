const express = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: 'Muitas solicitações de recuperação. Tente novamente em alguns minutos.'
  }
});

router.post('/register/company', authController.registerCompany);

router.post('/register/staff-invite', authController.registerStaffByInvite);

router.post('/login', loginLimiter, authController.login);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  authController.requestPasswordReset
);

router.post('/reset-password', authController.resetPassword);

router.get('/me', authMiddleware, authController.me);

router.put('/me', authMiddleware, authController.updateMe);

module.exports = router;