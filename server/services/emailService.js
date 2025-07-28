const nodemailer = require('nodemailer');
const config = require('../config/config');
const EmailTemplate = require('../models/email-template.model');
const EmailLog = require('../models/email-log.model');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  // Create nodemailer transporter
  createTransporter() {
    // Debug logging to see what config is being used
    console.log('📧 Email Configuration Debug:');
    console.log('EMAIL_SERVICE:', config.EMAIL_SERVICE);
    console.log('EMAIL_PORT:', config.EMAIL_PORT);
    console.log('EMAIL_USER:', config.EMAIL_USER ? '***' + config.EMAIL_USER.slice(-4) : 'undefined');
    console.log('EMAIL_PASS:', config.EMAIL_PASS ? '***' + config.EMAIL_PASS.slice(-4) : 'undefined');
    console.log('EMAIL_FROM:', config.EMAIL_FROM);
    
    const transportConfig = {
      host: config.EMAIL_SERVICE,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_PORT === 465,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 10000, // 10 seconds
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
      },
      debug: true, // Enable debug mode
      logger: true // Enable logging
    };
    
    console.log('📧 Transport Config:', {
      ...transportConfig,
      auth: {
        user: transportConfig.auth.user ? '***' + transportConfig.auth.user.slice(-4) : 'undefined',
        pass: transportConfig.auth.pass ? '***' + transportConfig.auth.pass.slice(-4) : 'undefined'
      }
    });
    
    return nodemailer.createTransport(transportConfig);
  }

  // Send email using template
  async sendEmailWithTemplate(templateType, recipientEmail, variables = {}, options = {}) {
    let emailLog = null;
    
    try {
      const {
        organizationId = null,
        customTemplate = null,
        attachments = [],
        priority = 'normal',
        sentBy = null,
        recipientId = null,
        recipientType = 'candidate',
        relatedEntity = null
      } = options;

      let template;
      
      // Use custom template if provided, otherwise get from database
      if (customTemplate) {
        template = customTemplate;
      } else {
        template = await EmailTemplate.getTemplateByType(templateType, organizationId);
        if (!template) {
          throw new Error(`Email template not found for type: ${templateType}`);
        }
      }

      // Render template with variables
      const renderedContent = template.renderTemplate(variables);

      // Create email log entry
      if (sentBy) {
        emailLog = await EmailLog.logEmail({
          template_type: templateType,
          template_id: template._id,
          recipient_email: recipientEmail,
          recipient_type: recipientType,
          recipient_id: recipientId,
          subject: renderedContent.subject,
          variables_used: variables,
          email_status: 'pending',
          sent_by: sentBy,
          organization_id: organizationId,
          related_entity: relatedEntity
        });
      }

      // Prepare email options
      const mailOptions = {
        from: config.EMAIL_FROM,
        to: recipientEmail,
        subject: renderedContent.subject,
        html: renderedContent.html,
        text: renderedContent.text || this.htmlToText(renderedContent.html),
        attachments: attachments
      };

      // Set priority
      if (priority === 'high') {
        mailOptions.priority = 'high';
        mailOptions.headers = { 'X-Priority': '1' };
      }

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Update email log as sent
      if (emailLog) {
        emailLog.email_status = 'sent';
        emailLog.message_id = info.messageId;
        await emailLog.save();
      }
      
      return {
        success: true,
        messageId: info.messageId,
        templateType: templateType,
        recipient: recipientEmail,
        logId: emailLog ? emailLog._id : null
      };

    } catch (error) {
      console.error('Error sending email with template:', error);
      
      // Update email log as failed
      if (emailLog) {
        await emailLog.markAsFailed(error.message);
      }
      
      throw error;
    }
  }

  // Send bulk emails using template
  async sendBulkEmailWithTemplate(templateType, recipients, variables = {}, options = {}) {
    const results = {
      sent: [],
      failed: []
    };

    for (const recipient of recipients) {
      try {
        // Merge recipient-specific variables
        const recipientVariables = {
          ...variables,
          ...(recipient.variables || {})
        };

        const result = await this.sendEmailWithTemplate(
          templateType,
          recipient.email,
          recipientVariables,
          options
        );

        results.sent.push({
          email: recipient.email,
          messageId: result.messageId
        });

      } catch (error) {
        results.failed.push({
          email: recipient.email,
          error: error.message
        });
      }
    }

    return results;
  }

  // Send simple email without template
  async sendSimpleEmail(to, subject, content, options = {}) {
    try {
      const {
        isHtml = true,
        attachments = [],
        priority = 'normal'
      } = options;

      const mailOptions = {
        from: config.EMAIL_FROM,
        to: to,
        subject: subject,
        [isHtml ? 'html' : 'text']: content,
        attachments: attachments
      };

      if (priority === 'high') {
        mailOptions.priority = 'high';
        mailOptions.headers = { 'X-Priority': '1' };
      }

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: to
      };

    } catch (error) {
      console.error('Error sending simple email:', error);
      throw error;
    }
  }

  // Send test assignment email
  async sendTestAssignmentEmail(candidateData, testData, assignmentData) {
    const variables = {
      candidate_name: candidateData.cand_name,
      test_name: testData.test_name,
      scheduled_date: this.formatDate(assignmentData.scheduled_date),
      expiry_date: this.formatDate(assignmentData.expiry_date),
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      organization_name: candidateData.organization?.org_name || 'NPI Portal',
      assignment_id: assignmentData.assignment_id
    };

    return await this.sendEmailWithTemplate(
      'test_assignment',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Send board assignment email
  async sendBoardAssignmentEmail(candidateData, boardData, assignmentData) {
    const variables = {
      candidate_name: candidateData.cand_name,
      board_name: boardData.board_name,
      scheduled_date: this.formatDate(assignmentData.scheduled_date),
      venue: assignmentData.venue || 'TBD',
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      organization_name: candidateData.organization?.org_name || 'NPI Portal',
      contact_info: boardData.contact_info || 'Contact HR for more information'
    };

    return await this.sendEmailWithTemplate(
      'board_assignment',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Send candidate registration confirmation
  async sendCandidateRegistrationEmail(candidateData, userCredentials = null) {
    const variables = {
      candidate_name: candidateData.cand_name,
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      organization_name: candidateData.organization?.org_name || 'NPI Portal',
      registration_date: this.formatDate(candidateData.added_on || new Date()),
      username: userCredentials?.username || '',
      password: userCredentials?.password || '',
      support_email: config.EMAIL_FROM
    };

    return await this.sendEmailWithTemplate(
      'candidate_registration',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Send result notification email
  async sendResultNotificationEmail(candidateData, resultData) {
    const variables = {
      candidate_name: candidateData.cand_name,
      test_name: resultData.test_name,
      score: resultData.score,
      max_score: resultData.max_score,
      percentage: resultData.percentage,
      result_status: resultData.status,
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      organization_name: candidateData.organization?.org_name || 'NPI Portal'
    };

    return await this.sendEmailWithTemplate(
      'result_notification',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Send hiring confirmation email
  async sendHiringConfirmationEmail(candidateData, jobData) {
    const variables = {
      candidate_name: candidateData.cand_name,
      job_title: jobData.job_title,
      organization_name: jobData.organization?.org_name || 'NPI Portal',
      start_date: this.formatDate(jobData.start_date),
      salary: jobData.salary || 'As per offer letter',
      reporting_manager: jobData.reporting_manager || 'HR Department',
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmailWithTemplate(
      'hiring_confirmation',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Send rejection notification email
  async sendRejectionNotificationEmail(candidateData, rejectionData) {
    const variables = {
      candidate_name: candidateData.cand_name,
      position: rejectionData.position || 'Applied Position',
      organization_name: candidateData.organization?.org_name || 'NPI Portal',
      feedback: rejectionData.feedback || 'Thank you for your interest in our organization.',
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmailWithTemplate(
      'rejection_notification',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Send reminder email
  async sendReminderEmail(candidateData, reminderData) {
    const variables = {
      candidate_name: candidateData.cand_name,
      reminder_type: reminderData.type,
      reminder_message: reminderData.message,
      due_date: this.formatDate(reminderData.due_date),
      portal_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      organization_name: candidateData.organization?.org_name || 'NPI Portal'
    };

    return await this.sendEmailWithTemplate(
      'reminder',
      candidateData.cand_email,
      variables,
      { organizationId: candidateData.org_id }
    );
  }

  // Test email configuration
  async testEmailConfiguration() {
    try {
      const testEmail = await this.sendSimpleEmail(
        config.EMAIL_FROM,
        'Email Configuration Test',
        '<h1>Email Configuration Test</h1><p>This is a test email to verify the email configuration.</p>',
        { isHtml: true }
      );
      return testEmail;
    } catch (error) {
      throw new Error(`Email configuration test failed: ${error.message}`);
    }
  }

  // Utility methods
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

module.exports = new EmailService(); 