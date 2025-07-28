const express = require('express');
const router = express.Router();
const {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  sendTestEmail,
  getTemplateTypes,
  duplicateEmailTemplate,
  createDefaultTemplates
} = require('../controllers/email-template.controller');
const { protect, hasPermission } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Get template types (available to all authenticated users)
router.get('/types', getTemplateTypes);

// CRUD routes
router.route('/')
  .get(hasPermission('access_email_templates'), getEmailTemplates);

router.route('/:id')
  .get(hasPermission('access_email_templates'), getEmailTemplate)
  .put(hasPermission('access_email_templates'), updateEmailTemplate);

// Template management routes
router.post('/:id/preview', hasPermission('access_email_templates'), previewEmailTemplate);
router.post('/:id/test-send', hasPermission('access_email_templates'), sendTestEmail);
// Removed duplicate and create endpoints
// Removed delete endpoint
// Admin-only routes (Super admin only)
router.post('/create-defaults', hasPermission('access_email_templates'), createDefaultTemplates);

module.exports = router; 