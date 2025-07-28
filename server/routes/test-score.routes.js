const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  calculateTestScore,
  getAllTestScores,
  getTestScore,
  getTestScoreByAssignment,
  deleteTestScore
} = require('../controllers/test-score.controller');

// Base route: /api/scores

// Calculate and store scores for a test assignment
router.post('/calculate/:testAssignmentId', protect, authorize([1]), calculateTestScore);

// Get all test scores (admin only)
router.get('/', protect, authorize([1]), getAllTestScores);

// Get test score by test assignment ID
router.get('/assignment/:testAssignmentId', protect, getTestScoreByAssignment);

// Get single test score
router.get('/:id', protect, getTestScore);

// Delete test score (admin only)
router.delete('/:id', protect, authorize([1]), deleteTestScore);

module.exports = router; 