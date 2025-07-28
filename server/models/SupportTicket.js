const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticket_id: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'TICK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'],
    default: 'open'
  },
  category: {
    type: String,
    enum: ['technical', 'account', 'test_related', 'general', 'billing'],
    default: 'general'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assigned_to_name: {
    type: String,
    default: null
  },
  messages: [{
    message_id: {
      type: String,
      default: function() {
        return 'MSG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      }
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sender_name: {
      type: String,
      required: true
    },
    sender_role: {
      type: String,
      enum: ['candidate', 'admin', 'supervisor'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    message_type: {
      type: String,
      enum: ['text', 'file', 'system'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      original_name: String,
      file_size: Number,
      file_type: String,
      file_url: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    read_by: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      read_at: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  tags: [{
    type: String,
    maxlength: 50
  }],
  last_activity: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  resolved_at: {
    type: Date,
    default: null
  },
  resolution_notes: {
    type: String,
    maxlength: 500,
    default: null
  }
}, {
  timestamps: { updatedAt: 'updated_at' }
});

// Indexes for better performance
supportTicketSchema.index({ user_id: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ assigned_to: 1, status: 1 });
supportTicketSchema.index({ ticket_id: 1 });
supportTicketSchema.index({ created_at: -1 });

// Pre-save middleware to update last_activity
supportTicketSchema.pre('save', function(next) {
  this.last_activity = new Date();
  next();
});

// Virtual for unread messages count
supportTicketSchema.virtual('unread_count').get(function() {
  return this.messages.filter(msg => 
    msg.read_by.length === 0 || 
    !msg.read_by.some(read => read.user_id.toString() === this.user_id.toString())
  ).length;
});

// Virtual for latest message
supportTicketSchema.virtual('latest_message').get(function() {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Ensure virtuals are included in JSON output
supportTicketSchema.set('toJSON', { virtuals: true });
supportTicketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema); 