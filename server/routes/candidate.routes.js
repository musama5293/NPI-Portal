const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  getCandidates, 
  getCandidate, 
  createCandidate, 
  updateCandidate, 
  deleteCandidate,
  exportCandidates,
  importCandidates,
  assignSupervisor
} = require('../controllers/candidate.controller');
const { protect, hasPermission } = require('../middleware/auth');

// Set up multer for file upload (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Protect all routes
router.use(protect);

// Basic CRUD routes with permission-based security
router.route('/')
  .get(hasPermission('access_candidate_management'), getCandidates)
  .post(hasPermission('access_candidate_management'), createCandidate);

router.route('/:id')
  .get(hasPermission('access_candidate_management'), getCandidate)
  .put(hasPermission('access_candidate_management'), updateCandidate)
  .delete(hasPermission('access_candidate_management'), deleteCandidate);

// Additional routes with permission-based security
router.get('/export', hasPermission('access_candidate_management'), exportCandidates);
router.post('/import', hasPermission('access_candidate_management'), upload.single('file'), importCandidates);
router.post('/assign-supervisor', hasPermission('access_candidate_management'), assignSupervisor);

module.exports = router; 