const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  log_id: {
    type: Number,
    required: false, // Make it optional initially
    unique: true
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
      'otp_verification',
      'otp_resend',
      'custom'
    ],
    required: true
  },
  template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    default: null
  },
  recipient_email: {
    type: String,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  recipient_type: {
    type: String,
    enum: ['candidate', 'admin', 'supervisor', 'hr', 'system'],
    default: 'candidate'
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipient_model'
  },
  recipient_model: {
    type: String,
    enum: ['User', 'Candidate'],
    default: 'User'
  },
  subject: {
    type: String,
    required: true
  },
  variables_used: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  email_status: {
    type: String,
    enum: ['sent', 'failed', 'pending', 'delivered', 'bounced', 'opened'],
    default: 'pending'
  },
  message_id: {
    type: String,
    default: null
  },
  error_message: {
    type: String,
    default: null
  },
  sent_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization_id: {
    type: Number,
    ref: 'Organization',
    default: null
  },
  related_entity: {
    entity_type: {
      type: String,
      enum: ['test_assignment', 'board', 'job', 'candidate', 'test', 'notification'],
      default: null
    },
    entity_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  delivery_attempts: {
    type: Number,
    default: 1
  },
  last_attempt_at: {
    type: Date,
    default: Date.now
  },
  delivered_at: {
    type: Date,
    default: null
  },
  opened_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
EmailLogSchema.index({ recipient_email: 1, created_at: -1 });
EmailLogSchema.index({ email_status: 1, created_at: -1 });
EmailLogSchema.index({ template_type: 1, created_at: -1 });
EmailLogSchema.index({ organization_id: 1, created_at: -1 });
EmailLogSchema.index({ sent_by: 1, created_at: -1 });

// Pre-save middleware to generate log_id
EmailLogSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.log_id) {
      const lastLog = await this.constructor.findOne({}, {}, { sort: { log_id: -1 } });
      this.log_id = lastLog ? lastLog.log_id + 1 : 1;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to mark email as delivered
EmailLogSchema.methods.markAsDelivered = function() {
  this.email_status = 'delivered';
  this.delivered_at = new Date();
  return this.save();
};

// Method to mark email as failed
EmailLogSchema.methods.markAsFailed = function(errorMessage) {
  this.email_status = 'failed';
  this.error_message = errorMessage;
  this.last_attempt_at = new Date();
  return this.save();
};

// Method to mark email as opened
EmailLogSchema.methods.markAsOpened = function() {
  this.email_status = 'opened';
  this.opened_at = new Date();
  return this.save();
};

// Static method to log email sending
EmailLogSchema.statics.logEmail = async function(emailData) {
  try {
    const emailLog = new this(emailData);
    await emailLog.save();
    return emailLog;
  } catch (error) {
    console.error('Error logging email:', error);
    throw error;
  }
};

// Static method to get email statistics
EmailLogSchema.statics.getEmailStats = async function(filters = {}) {
  try {
    const pipeline = [];
    
    // Match filters
    if (Object.keys(filters).length > 0) {
      pipeline.push({ $match: filters });
    }
    
    // Group by status and count
    pipeline.push({
      $group: {
        _id: '$email_status',
        count: { $sum: 1 },
        last_sent: { $max: '$created_at' }
      }
    });
    
    const stats = await this.aggregate(pipeline);
    
    // Format response
    const formattedStats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      delivered: 0,
      bounced: 0,
      opened: 0
    };
    
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });
    
    return formattedStats;
  } catch (error) {
    console.error('Error getting email stats:', error);
    throw error;
  }
};

module.exports = mongoose.model('EmailLog', EmailLogSchema); 