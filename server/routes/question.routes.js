const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  assignQuestionsToTest,
  unlinkQuestionsFromTest
} = require('../controllers/question.controller');

// Base route: /api/questions

// Get all questions (with various filter options in query)
router.get('/', protect, hasPermission('access_question_management'), getAllQuestions);

// Get single question
router.get('/:id', protect, hasPermission('access_question_management'), getQuestion);

// Create question
router.post('/', protect, hasPermission('access_question_management'), createQuestion);

// Update question
router.put('/:id', protect, hasPermission('access_question_management'), updateQuestion);

// Delete question
router.delete('/:id', protect, hasPermission('access_question_management'), deleteQuestion);

// Assign questions to test
router.post('/assign/:testId', protect, hasPermission('access_question_management'), assignQuestionsToTest);

// Unlink questions from test
router.post('/unlink/:testId', protect, hasPermission('access_question_management'), unlinkQuestionsFromTest);

module.exports = router; 