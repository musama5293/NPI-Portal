const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type,
    priority,
    category
  } = req.query;

  const userId = req.user.id;

  try {
    const result = await Notification.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type,
      priority,
      category
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const count = await Notification.countDocuments({
      user_id: userId,
      read: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const notification = await Notification.findOne({
      _id: id,
      user_id: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (!notification.read) {
      await notification.markAsRead();
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/read-multiple
// @access  Private
const markMultipleAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;
  const userId = req.user.id;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid notification IDs provided'
    });
  }

  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        user_id: userId,
        read: false
      },
      {
        $set: {
          read: true,
          read_at: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await Notification.updateMany(
      {
        user_id: userId,
        read: false
      },
      {
        $set: {
          read: true,
          read_at: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user_id: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// @desc    Create notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
  const {
    user_id,
    title,
    message,
    type = 'info',
    priority = 'medium',
    category = 'general',
    data = {},
    action_url,
    action_text,
    expires_at
  } = req.body;

  // Check if user has admin privileges (1=admin, 3=supervisor)
  if (req.user.role_id !== 1 && req.user.role_id !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  try {
    const notificationData = {
      user_id,
      title,
      message,
      type,
      priority,
      category,
      data,
      action_url,
      action_text,
      expires_at
    };

    // Get io instance from app
    const io = req.app.get('io');
    const notification = await Notification.createAndSend(notificationData, io);

    res.status(201).json({
      success: true,
      message: 'Notification created and sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// @desc    Create bulk notifications (Admin only)
// @route   POST /api/notifications/bulk
// @access  Private/Admin
const createBulkNotifications = asyncHandler(async (req, res) => {
  const {
    user_ids,
    title,
    message,
    type = 'info',
    priority = 'medium',
    category = 'general',
    data = {},
    action_url,
    action_text,
    expires_at
  } = req.body;

  // Check if user has admin privileges (1=admin, 3=supervisor)
  if (req.user.role_id !== 1 && req.user.role_id !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid user IDs array is required'
    });
  }

  try {
    // Validate users exist
    const users = await User.find({ _id: { $in: user_ids } });
    if (users.length !== user_ids.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more users not found'
      });
    }

    const io = req.app.get('io');
    const notifications = [];

    // Create notifications for each user
    for (const userId of user_ids) {
      const notificationData = {
        user_id: userId,
        title,
        message,
        type,
        priority,
        category,
        data,
        action_url,
        action_text,
        expires_at
      };

      const notification = await Notification.createAndSend(notificationData, io);
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      message: `${notifications.length} notifications created and sent successfully`,
      data: notifications
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk notifications'
    });
  }
});

// @desc    Get notification statistics (Admin only)
// @route   GET /api/notifications/stats
// @access  Private/Admin
const getNotificationStats = asyncHandler(async (req, res) => {
  // Check if user has admin privileges (1=admin, 3=supervisor)
  if (req.user.role_id !== 1 && req.user.role_id !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  try {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentActivity
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ read: false }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user_id', 'name email')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: totalNotifications - unreadNotifications
        },
        byType: notificationsByType,
        byPriority: notificationsByPriority,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

// @desc    Create test notification (for testing purposes)
// @route   POST /api/notifications/test
// @access  Private/Admin
const createTestNotification = asyncHandler(async (req, res) => {
  // Check if user has admin privileges (1=admin, 3=supervisor)
  if (req.user.role_id !== 1 && req.user.role_id !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  try {
    const { target_user_id } = req.body;
    const targetUserId = target_user_id || req.user.id; // Default to current user

    const testNotifications = [
      {
        user_id: targetUserId,
        title: 'New Candidate Registered',
        message: 'John Doe has registered and is awaiting approval.',
        type: 'candidate_registration',
        priority: 'medium',
        category: 'candidates',
        data: {
          candidate_name: 'John Doe',
          candidate_email: 'john.doe@example.com'
        },
        action_url: '/candidates',
        action_text: 'View Candidates'
      },
      {
        user_id: targetUserId,
        title: 'Test Completed',
        message: 'Alice Smith has completed the Personality Assessment test with a score of 85%.',
        type: 'test_completion',
        priority: 'high',
        category: 'tests',
        data: {
          candidate_name: 'Alice Smith',
          test_name: 'Personality Assessment',
          score: 85
        },
        action_url: '/results',
        action_text: 'View Results'
      },
      {
        user_id: targetUserId,
        title: 'System Maintenance',
        message: 'The system will undergo maintenance tonight from 2:00 AM to 4:00 AM.',
        type: 'system',
        priority: 'low',
        category: 'system',
        data: {
          maintenance_time: '2:00 AM - 4:00 AM'
        }
      }
    ];

    const io = req.app.get('io');
    const createdNotifications = [];

    for (const notifData of testNotifications) {
      const notification = await Notification.createAndSend(notifData, io);
      createdNotifications.push(notification);
    }

    res.status(201).json({
      success: true,
      message: `${createdNotifications.length} test notifications created successfully`,
      data: createdNotifications
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notifications'
    });
  }
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createBulkNotifications,
  getNotificationStats,
  createTestNotification
}; 