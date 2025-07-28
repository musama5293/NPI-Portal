const EmailTemplate = require('../models/email-template.model');
const EmailService = require('../services/emailService');
const { createDefaultEmailTemplates } = require('../utils/createDefaultTemplates');
const asyncHandler = require('express-async-handler');

// @desc    Get all email templates
// @route   GET /api/email-templates
// @access  Private/Admin
exports.getEmailTemplates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, template_type, organization_id, is_active } = req.query;

  // Build filter object
  const filter = {};
  if (template_type) filter.template_type = template_type;
  if (organization_id) filter.organization_id = organization_id;
  if (is_active !== undefined) filter.is_active = is_active === 'true';

  // Only allow users to see templates for their organization unless they're super admin
  if (req.user.role_id !== 1) {
    filter.organization_id = req.user.org_id;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'created_by', select: 'username email' },
      { path: 'updated_by', select: 'username email' }
    ]
  };

  try {
    const templates = await EmailTemplate.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .lean();

    const total = await EmailTemplate.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email templates',
      error: error.message
    });
  }
});

// @desc    Get email template by ID
// @route   GET /api/email-templates/:id
// @access  Private/Admin
exports.getEmailTemplate = asyncHandler(async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can access this template
    if (req.user.role_id !== 1 && template.organization_id !== req.user.org_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this template'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email template',
      error: error.message
    });
  }
});

// @desc    Update email template
// @route   PUT /api/email-templates/:id
// @access  Private/Admin
const ALLOWED_TEMPLATE_TYPES = [
  'test_assignment',
  'probation_feedback_assignment',
  'reminder',
  'probation_reassignment'
];

exports.updateEmailTemplate = asyncHandler(async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Only allow editing default templates of allowed types
    if (!template.is_default || !ALLOWED_TEMPLATE_TYPES.includes(template.template_type)) {
      return res.status(403).json({
        success: false,
        message: 'Only default templates of allowed types can be edited.'
      });
    }

    const { subject, html_content, text_content } = req.body;

    // Only update allowed fields
    template.subject = subject || template.subject;
    template.html_content = html_content || template.html_content;
    template.text_content = text_content !== undefined ? text_content : template.text_content;
    template.updated_by = req.user._id;
    template.updated_at = Date.now();

    await template.save();

    const updatedTemplate = await EmailTemplate.findById(template._id)
      .populate('created_by updated_by', 'username email');

    res.status(200).json({
      success: true,
      message: 'Email template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email template',
      error: error.message
    });
  }
});

// @desc    Preview email template
// @route   POST /api/email-templates/:id/preview
// @access  Private/Admin
exports.previewEmailTemplate = asyncHandler(async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can access this template
    if (req.user.role_id !== 1 && template.organization_id !== req.user.org_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this template'
      });
    }

    const { variables = {} } = req.body;

    // Render template with provided variables
    const renderedContent = template.renderTemplate(variables);

    res.status(200).json({
      success: true,
      data: {
        template_id: template._id,
        template_name: template.template_name,
        template_type: template.template_type,
        rendered: renderedContent,
        variables_used: template.variables
      }
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      message: 'Error previewing email template',
      error: error.message
    });
  }
});

// @desc    Send test email using template
// @route   POST /api/email-templates/:id/test-send
// @access  Private/Admin
exports.sendTestEmail = asyncHandler(async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if user can access this template
    if (req.user.role_id !== 1 && template.organization_id !== req.user.org_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this template'
      });
    }

    const { test_email, variables = {} } = req.body;

    if (!test_email) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    // Send test email using EmailService
    const result = await EmailService.sendEmailWithTemplate(
      template.template_type,
      test_email,
      variables,
      { customTemplate: template }
    );

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

// @desc    Get template types
// @route   GET /api/email-templates/types
// @access  Private/Admin
exports.getTemplateTypes = asyncHandler(async (req, res) => {
  const templateTypes = [
    { value: 'candidate_registration', label: 'Candidate Registration', description: 'Sent when a new candidate registers' },
    { value: 'test_assignment', label: 'Test Assignment', description: 'Sent when a test is assigned to a candidate' },
    { value: 'test_completion', label: 'Test Completion', description: 'Sent when a candidate completes a test' },
    { value: 'board_assignment', label: 'Board Assignment', description: 'Sent when a board interview is scheduled' },
    { value: 'board_completion', label: 'Board Completion', description: 'Sent after board interview completion' },
    { value: 'job_application', label: 'Job Application', description: 'Sent when candidate applies for a job' },
    { value: 'interview_scheduled', label: 'Interview Scheduled', description: 'Sent when interview is scheduled' },
    { value: 'result_notification', label: 'Result Notification', description: 'Sent when test/interview results are available' },
    { value: 'probation_start', label: 'Probation Start', description: 'Sent when probation period starts' },
    { value: 'probation_end', label: 'Probation End', description: 'Sent when probation period ends' },
    { value: 'hiring_confirmation', label: 'Hiring Confirmation', description: 'Sent when candidate is hired' },
    { value: 'rejection_notification', label: 'Rejection Notification', description: 'Sent when candidate is rejected' },
    { value: 'account_created', label: 'Account Created', description: 'Sent when user account is created' },
    { value: 'password_reset', label: 'Password Reset', description: 'Sent for password reset requests' },
    { value: 'system_notification', label: 'System Notification', description: 'General system notifications' },
    { value: 'reminder', label: 'Reminder', description: 'Reminder emails for pending actions' },
    { value: 'custom', label: 'Custom', description: 'Custom email templates' }
  ];

  res.status(200).json({
    success: true,
    data: templateTypes
  });
});

// @desc    Create default email templates
// @route   POST /api/email-templates/create-defaults
// @access  Private/Admin
exports.createDefaultTemplates = asyncHandler(async (req, res) => {
  try {
    // Only super admin can create default templates
    if (req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const result = await createDefaultEmailTemplates(req.user._id);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating default templates',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating default email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating default email templates',
      error: error.message
    });
  }
}); 