const EmailLog = require('../models/email-log.model');
const EmailService = require('../services/emailService');
const asyncHandler = require('express-async-handler');

// @desc    Get email logs with filtering and pagination
// @route   GET /api/email-management/logs
// @access  Private/Admin
exports.getEmailLogs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    template_type, 
    email_status, 
    recipient_email,
    organization_id,
    date_from,
    date_to
  } = req.query;

  // Build filter object
  const filter = {};
  if (template_type) filter.template_type = template_type;
  if (email_status) filter.email_status = email_status;
  if (recipient_email) filter.recipient_email = { $regex: recipient_email, $options: 'i' };
  if (organization_id) filter.organization_id = organization_id;

  // Date range filter
  if (date_from || date_to) {
    filter.created_at = {};
    if (date_from) filter.created_at.$gte = new Date(date_from);
    if (date_to) filter.created_at.$lte = new Date(date_to);
  }

  // Only allow users to see logs for their organization unless they're super admin
  if (req.user.role_id !== 1) {
    filter.organization_id = req.user.org_id;
  }

  try {
    const logs = await EmailLog.find(filter)
      .populate('template_id', 'template_name template_type')
      .populate('sent_by', 'username email')
      .populate('recipient_id', 'username email')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await EmailLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email logs',
      error: error.message
    });
  }
});

// @desc    Get email statistics
// @route   GET /api/email-management/stats
// @access  Private/Admin
exports.getEmailStats = asyncHandler(async (req, res) => {
  try {
    const { 
      organization_id, 
      date_from, 
      date_to, 
      template_type 
    } = req.query;

    // Build filter object
    const filter = {};
    if (template_type) filter.template_type = template_type;
    if (organization_id) filter.organization_id = organization_id;

    // Date range filter
    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    // Only allow users to see stats for their organization unless they're super admin
    if (req.user.role_id !== 1) {
      filter.organization_id = req.user.org_id;
    }

    const stats = await EmailLog.getEmailStats(filter);

    // Get template type breakdown
    const templateStats = await EmailLog.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: '$template_type',
          count: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$email_status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$email_status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily email trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await EmailLog.aggregate([
      { 
        $match: {
          ...filter,
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$email_status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$email_status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats,
        templateBreakdown: templateStats,
        dailyTrends: dailyTrends
      }
    });
  } catch (error) {
    console.error('Error getting email statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting email statistics',
      error: error.message
    });
  }
});

// @desc    Get specific email log details
// @route   GET /api/email-management/logs/:id
// @access  Private/Admin
exports.getEmailLogDetails = asyncHandler(async (req, res) => {
  try {
    const emailLog = await EmailLog.findById(req.params.id)
      .populate('template_id', 'template_name template_type subject html_content')
      .populate('sent_by', 'username email profile')
      .populate('recipient_id', 'username email profile');

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        message: 'Email log not found'
      });
    }

    // Check if user can access this log
    if (req.user.role_id !== 1 && emailLog.organization_id !== req.user.org_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this email log'
      });
    }

    res.status(200).json({
      success: true,
      data: emailLog
    });
  } catch (error) {
    console.error('Error fetching email log details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email log details',
      error: error.message
    });
  }
});

// @desc    Resend failed email
// @route   POST /api/email-management/logs/:id/resend
// @access  Private/Admin
exports.resendEmail = asyncHandler(async (req, res) => {
  try {
    const emailLog = await EmailLog.findById(req.params.id)
      .populate('template_id');

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        message: 'Email log not found'
      });
    }

    // Check if user can access this log
    if (req.user.role_id !== 1 && emailLog.organization_id !== req.user.org_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this email log'
      });
    }

    // Only allow resending failed emails
    if (emailLog.email_status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Can only resend failed emails'
      });
    }

    // Resend email using EmailService
    const result = await EmailService.sendEmailWithTemplate(
      emailLog.template_type,
      emailLog.recipient_email,
      emailLog.variables_used,
      {
        customTemplate: emailLog.template_id,
        organizationId: emailLog.organization_id,
        sentBy: req.user._id,
        recipientId: emailLog.recipient_id,
        recipientType: emailLog.recipient_type,
        relatedEntity: emailLog.related_entity
      }
    );

    // Update the original log
    emailLog.delivery_attempts += 1;
    emailLog.last_attempt_at = new Date();
    await emailLog.save();

    res.status(200).json({
      success: true,
      message: 'Email resent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending email',
      error: error.message
    });
  }
});

// @desc    Test email configuration
// @route   POST /api/email-management/test-config
// @access  Private/Admin
exports.testEmailConfig = asyncHandler(async (req, res) => {
  try {
    // Only super admin can test email configuration
    if (req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { test_email } = req.body;
    const testEmailAddress = test_email || req.user.email;

    const result = await EmailService.testEmailConfiguration();

    res.status(200).json({
      success: true,
      message: 'Email configuration test completed',
      data: result
    });
  } catch (error) {
    console.error('Email configuration test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message
    });
  }
});

// @desc    Send bulk emails using template
// @route   POST /api/email-management/send-bulk
// @access  Private/Admin
exports.sendBulkEmail = asyncHandler(async (req, res) => {
  try {
    const {
      template_type,
      recipients, // Array of { email, variables }
      global_variables = {},
      organization_id
    } = req.body;

    if (!template_type || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Template type and recipients array are required'
      });
    }

    // Check if user can send emails for the organization
    const finalOrgId = req.user.role_id === 1 ? organization_id : req.user.org_id;

    const result = await EmailService.sendBulkEmailWithTemplate(
      template_type,
      recipients,
      global_variables,
      {
        organizationId: finalOrgId,
        sentBy: req.user._id,
        recipientType: 'candidate'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk email sending completed',
      data: result
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk email',
      error: error.message
    });
  }
});

// @desc    Get email delivery report
// @route   GET /api/email-management/delivery-report
// @access  Private/Admin
exports.getDeliveryReport = asyncHandler(async (req, res) => {
  try {
    const { 
      date_from, 
      date_to, 
      template_type,
      organization_id 
    } = req.query;

    // Build filter
    const filter = {};
    if (template_type) filter.template_type = template_type;
    if (organization_id) filter.organization_id = organization_id;

    // Date range filter
    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    // Only allow users to see reports for their organization unless they're super admin
    if (req.user.role_id !== 1) {
      filter.organization_id = req.user.org_id;
    }

    const report = await EmailLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            template_type: '$template_type',
            status: '$email_status'
          },
          count: { $sum: 1 },
          emails: { $push: '$recipient_email' }
        }
      },
      {
        $group: {
          _id: '$_id.template_type',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              emails: '$emails'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating delivery report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating delivery report',
      error: error.message
    });
  }
}); 