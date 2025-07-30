const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyOtp, 
  resendOtp,
  testEmail,
  resetPassword, 
  getMe,
  logout,
  getUserRole
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/test-email', testEmail);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.get('/role-data', protect, getUserRole);
router.post('/logout', protect, logout);

module.exports = router; 