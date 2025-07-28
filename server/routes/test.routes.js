const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const testController = require('../controllers/test.controller');
const categoryController = require('../controllers/category.controller');
const testAssignmentController = require('../controllers/test-assignment.controller');
const auth = require('../middleware/auth');

/**
 * Create a test user
 * @route GET /api/test/create-user
 * @access Public
 */
router.get('/create-user', async (req, res) => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'Test user already exists',
        user: {
          username: existingUser.username,
          email: existingUser.email,
          role_id: existingUser.role_id
        }
      });
    }

    // Generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      mobile_no: '1234567890',
      org_id: 1000,
      role_id: 2,
      user_status: 1,
      pass_flag: 0,
      test_mode: 1
    });

    return res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      user: {
        username: user.username,
        email: user.email,
        role_id: user.role_id
      }
    });
  } catch (error) {
    console.error('Create test user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test user',
      error: error.message
    });
  }
});

// Test routes
router.get('/tests', auth.protect, auth.hasPermission('access_test_management'), testController.getAllTests);
router.get('/tests/:id', auth.protect, auth.hasPermission('access_test_management'), testController.getTest);
router.post('/tests', auth.protect, auth.hasPermission('access_test_management'), testController.createTest);
router.put('/tests/:id', auth.protect, auth.hasPermission('access_test_management'), testController.updateTest);
router.delete('/tests/:id', auth.protect, auth.hasPermission('access_test_management'), testController.deleteTest);

// Category routes
router.get('/categories', auth.protect, auth.hasPermission('access_category_management'), categoryController.getAllCategories);
router.get('/categories/:id', auth.protect, auth.hasPermission('access_category_management'), categoryController.getCategory);
router.post('/categories', auth.protect, auth.hasPermission('access_category_management'), categoryController.createCategory);
router.put('/categories/:id', auth.protect, auth.hasPermission('access_category_management'), categoryController.updateCategory);
router.delete('/categories/:id', auth.protect, auth.hasPermission('access_category_management'), categoryController.deleteCategory);

// Test Assignment routes
router.get('/test-assignments', auth.protect, auth.hasPermission('access_test_assignment'), testAssignmentController.getAllTestAssignments);
// Special route for candidates to get their own tests - now permission protected
router.get('/test-assignments/candidate/:id', auth.protect, auth.hasPermission('access_my_tests'), testAssignmentController.getCandidateAssignments);
// New routes for supervisor assignments
router.get('/test-assignments/supervisor', auth.protect, testAssignmentController.getSupervisorAssignments);
router.get('/test-assignments/linked/:id', auth.protect, testAssignmentController.getLinkedAssignments);
router.get('/test-assignments/:id', auth.protect, auth.hasPermission('access_test_assignment'), testAssignmentController.getTestAssignment);
router.post('/test-assignments', auth.protect, auth.hasPermission('access_test_assignment'), testAssignmentController.createTestAssignment);
router.post('/test-assignments/batch', auth.protect, auth.hasPermission('access_test_assignment'), testAssignmentController.createBatchTestAssignments);
router.put('/test-assignments/:id/start', auth.protect, testAssignmentController.startTest);
router.put('/test-assignments/:id/complete', auth.protect, testAssignmentController.markTestComplete);
router.delete('/test-assignments/:id', auth.protect, auth.hasPermission('access_test_assignment'), testAssignmentController.deleteTestAssignment);

// Route to check candidates with approaching probation end dates (without creating assignments)
router.get('/check-probation-tests', auth.protect, auth.hasPermission('access_test_assignment'), testAssignmentController.checkProbationTests);

// Special route for checking candidate status
router.get('/candidate-status', auth.protect, async (req, res) => {
  try {
    // Only for candidate users
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: 'Only candidate users can access this endpoint'
      });
    }
    
    console.log('Candidate status check for user:', req.user.username);
    
    // Check if user has candidate_id
    if (!req.user.candidate_id) {
      console.log('Candidate ID missing for user:', req.user.username);
      return res.status(200).json({
        success: false,
        message: 'No candidate profile associated with this user account',
        data: {
          hasCandidate: false,
          testCount: 0
        }
      });
    }
    
    // Check for test assignments
    const TestAssignment = require('../models/test-assignment.model');
    const assignments = await TestAssignment.find({ 
      candidate_id: req.user.candidate_id,
      assignment_status: 1
    });
    
    return res.status(200).json({
      success: true,
      data: {
        hasCandidate: true,
        candidateId: req.user.candidate_id,
        testCount: assignments.length,
        tests: assignments.map(a => ({
          id: a._id,
          status: a.completion_status,
          scheduled: a.scheduled_date
        }))
      }
    });
  } catch (error) {
    console.error('Error checking candidate status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking candidate status',
      error: error.message
    });
  }
});

// Routes for test questions and answers
router.get('/test-assignments/:id/questions', auth.protect, testAssignmentController.getTestQuestions);
router.post('/test-assignments/:id/submit-answer', auth.protect, testAssignmentController.submitAnswer);
router.put('/test-assignments/:id/complete-test', auth.protect, testAssignmentController.completeTest);
router.get('/test-assignments/:id/scores', auth.protect, testAssignmentController.getDetailedScores);

// Routes for enhanced test taking experience
router.post('/test-assignments/:id/log-activity', auth.protect, testAssignmentController.logActivity);
router.put('/test-assignments/:id/save-progress', auth.protect, testAssignmentController.saveProgress);
router.get('/test-assignments/:id/detailed-scores', auth.protect, testAssignmentController.getDetailedScores);

// Psychometric analysis routes
router.post('/test-assignments/:id/psychometric-analysis', auth.protect, testAssignmentController.generatePsychometricAnalysis);
router.get('/test-assignments/:id/psychometric-analysis', auth.protect, testAssignmentController.getPsychometricAnalysis);

// New route for results dashboard
router.get('/results', auth.protect, auth.hasPermission('access_results_dashboard'), testAssignmentController.getAllResultsWithScores);

module.exports = router; 