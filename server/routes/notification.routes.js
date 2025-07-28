const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
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
} = require('../controllers/notification.controller');

// All routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications with pagination and filters
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/count
// @desc    Get unread notification count for user
// @access  Private
router.get('/count', getUnreadCount);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (Admin only)
// @access  Private/Admin
router.get('/stats', getNotificationStats);

// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
router.put('/:id/read', markAsRead);

// @route   PUT /api/notifications/read-multiple
// @desc    Mark multiple notifications as read
// @access  Private
router.put('/read-multiple', markMultipleAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
router.put('/read-all', markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', deleteNotification);

// @route   POST /api/notifications
// @desc    Create single notification (Admin only)
// @access  Private/Admin
router.post('/', createNotification);

// @route   POST /api/notifications/bulk
// @desc    Create bulk notifications (Admin only)
// @access  Private/Admin
router.post('/bulk', createBulkNotifications);

// @route   POST /api/notifications/test
// @desc    Create test notifications (Admin only)
// @access  Private/Admin
router.post('/test', createTestNotification);

module.exports = router; 