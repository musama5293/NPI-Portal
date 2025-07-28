const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const {
  getAllBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardCandidates,
  assignCandidatesToBoard,
  removeCandidateFromBoard,
  getAssessment,
  saveAssessment
} = require('../controllers/board.controller');

// Base route: /api/boards
// All routes require authentication
router.use(protect);

// Board CRUD operations
router.get('/', hasPermission('access_evaluation_boards'), getAllBoards);
router.get('/:id', hasPermission('access_evaluation_boards'), getBoard);
router.post('/', hasPermission('can_create_candidates'), createBoard);
router.put('/:id', hasPermission('can_update_candidates'), updateBoard);
router.delete('/:id', hasPermission('can_delete_candidates'), deleteBoard);

// Board candidate management
router.get('/:boardId/candidates', hasPermission('access_evaluation_boards'), getBoardCandidates);
router.post('/:boardId/candidates', hasPermission('can_update_candidates'), assignCandidatesToBoard);
router.delete('/:boardId/candidates/:candidateId', hasPermission('can_update_candidates'), removeCandidateFromBoard);

// Assessment routes
router.get('/:boardId/candidates/:candidateId/assessment', hasPermission('access_evaluation_boards'), getAssessment);
router.post('/:boardId/candidates/:candidateId/assessment', hasPermission('access_evaluation_boards'), saveAssessment);

module.exports = router; 