const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  template_id: {
    type: Number,
    required: true,
    unique: true
  },
  template_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  template_type: {
    type: String,
    enum: [
      'candidate_registration',
      'test_assignment',
      'test_completion',
      'board_assignment',
      'board_completion',
      'job_application',
      'interview_scheduled',
      'result_notification',
      'probation_start',
      'probation_end',
      'hiring_confirmation',
      'rejection_notification',
      'account_created',
      'password_reset',
      'system_notification',
      'reminder',
      'custom',
      'probation_feedback_assignment',
      'probation_reassignment'
    ],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  html_content: {
    type: String,
    required: true
  },
  text_content: {
    type: String,
    default: ''
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['string', 'number', 'date', 'boolean'],
      default: 'string'
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  is_default: {
    type: Boolean,
    default: false
  },
  organization_id: {
    type: Number,
    ref: 'Organization',
    default: null // null means global template
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
EmailTemplateSchema.index({ template_type: 1, is_active: 1 });
EmailTemplateSchema.index({ organization_id: 1, is_active: 1 });
EmailTemplateSchema.index({ template_name: 1, organization_id: 1 }, { unique: true });

// Pre-save middleware to update timestamp
EmailTemplateSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Method to replace variables in template
EmailTemplateSchema.methods.renderTemplate = function(variables = {}) {
  let renderedSubject = this.subject;
  let renderedHtml = this.html_content;
  let renderedText = this.text_content;

  // Replace variables in subject, html and text content
  Object.keys(variables).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    renderedSubject = renderedSubject.replace(placeholder, variables[key] || '');
    renderedHtml = renderedHtml.replace(placeholder, variables[key] || '');
    renderedText = renderedText.replace(placeholder, variables[key] || '');
  });

  return {
    subject: renderedSubject,
    html: renderedHtml,
    text: renderedText
  };
};

// Static method to get template by type and organization
EmailTemplateSchema.statics.getTemplateByType = async function(templateType, orgId = null) {
  try {
    // First try to find organization-specific template
    if (orgId) {
      const orgTemplate = await this.findOne({
        template_type: templateType,
        organization_id: orgId,
        is_active: true
      });
      if (orgTemplate) return orgTemplate;
    }
    
    // Fall back to global template
    const globalTemplate = await this.findOne({
      template_type: templateType,
      organization_id: null,
      is_active: true,
      is_default: true
    });
    
    return globalTemplate;
  } catch (error) {
    console.error('Error getting email template:', error);
    return null;
  }
};

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema); 