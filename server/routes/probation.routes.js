const express = require('express');
const router = express.Router();
const probationController = require('../controllers/probation.controller');
const { protect, hasPermission } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Get candidates whose probation is ending soon
router.get(
  '/ending', 
  hasPermission('access_probation_dashboard'), 
  probationController.getProbationEndingCandidates
);

// Get all potential supervisors
router.get(
  '/supervisors', 
  hasPermission('access_probation_dashboard'), 
  probationController.getSupervisors
);

// Update candidate status after evaluation
router.put(
  '/candidates/:id/status', 
  hasPermission('access_candidate_management'), 
  probationController.updateCandidateStatus
);

module.exports = router; 