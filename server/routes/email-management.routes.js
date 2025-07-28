const express = require('express');
const router = express.Router();
const {
  getEmailLogs,
  getEmailStats,
  getEmailLogDetails,
  resendEmail,
  testEmailConfig,
  sendBulkEmail,
  getDeliveryReport
} = require('../controllers/email-management.controller');
const { protect, hasPermission } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Email logs and statistics
router.get('/logs', hasPermission('access_email_logs'), getEmailLogs);
router.get('/logs/:id', hasPermission('access_email_logs'), getEmailLogDetails);
router.get('/stats', hasPermission('access_email_dashboard'), getEmailStats);
router.get('/delivery-report', hasPermission('access_email_dashboard'), getDeliveryReport);

// Email actions
router.post('/logs/:id/resend', hasPermission('access_email_dashboard'), resendEmail);
router.post('/send-bulk', hasPermission('access_email_dashboard'), sendBulkEmail);

// Admin-only routes (Super admin only)
router.post('/test-config', hasPermission('access_email_dashboard'), testEmailConfig);

module.exports = router; 