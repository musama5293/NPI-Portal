const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getRecruitmentPipeline, 
  getRecentActivities, 
  getSystemAlerts 
} = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

// Protect all dashboard routes
router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics based on user role
// @access  Private
router.get('/stats', getDashboardStats);

// @route   GET /api/dashboard/recruitment
// @desc    Get recruitment pipeline analytics
// @access  Private
router.get('/recruitment', getRecruitmentPipeline);

// @route   GET /api/dashboard/activities
// @desc    Get recent activities
// @access  Private
router.get('/activities', getRecentActivities);

// @route   GET /api/dashboard/alerts
// @desc    Get system alerts and notifications
// @access  Private
router.get('/alerts', getSystemAlerts);

module.exports = router; 