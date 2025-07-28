const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 1000
  },
  type: {
    type: String,
    enum: [
      'system',
      'candidate_registration', 
      'test_completion',
      'test_assignment',
      'test_slot',
      'board_creation',
      'user_action',
      'reminder',
      'alert',
      'info'
    ],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: [
      'candidates',
      'tests', 
      'boards',
      'users',
      'system',
      'reports',
      'general'
    ],
    default: 'general'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date,
    default: null
  },
  action_url: {
    type: String,
    default: null
  },
  action_text: {
    type: String,
    default: null
  },
  expires_at: {
    type: Date,
    default: null
  },
  sent_via: [{
    type: String,
    enum: ['websocket', 'email', 'sms', 'whatsapp'],
    default: 'websocket'
  }]
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, read: 1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.read_at = new Date();
  return this.save();
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(notificationData, io) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    
    // Send via WebSocket if io is provided
    if (io) {
      io.to(`user:${notification.user_id}`).emit('notification:new', {
        ...notification.toObject(),
        timeAgo: notification.timeAgo
      });
      
      // Send to admin channels for high priority notifications
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        io.to('admin:notifications').emit('notification:priority', {
          ...notification.toObject(),
          timeAgo: notification.timeAgo
        });
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null,
    priority = null
  } = options;
  
  const filter = { user_id: userId };
  
  if (unreadOnly) filter.read = false;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  
  const notifications = await this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
    
  const total = await this.countDocuments(filter);
  const unreadCount = await this.countDocuments({ 
    user_id: userId, 
    read: false 
  });
  
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

module.exports = mongoose.model('Notification', notificationSchema); 