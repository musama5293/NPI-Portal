const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const jobSlotController = require('../controllers/job-slot.controller');
const auth = require('../middleware/auth');

// Job routes
router.get('/jobs', auth.protect, auth.hasPermission('access_job_management'), jobController.getAllJobs);
router.get('/jobs/:id', auth.protect, auth.hasPermission('access_job_management'), jobController.getJob);
router.post('/jobs', auth.protect, auth.hasPermission('access_job_management'), jobController.createJob);
router.put('/jobs/:id', auth.protect, auth.hasPermission('access_job_management'), jobController.updateJob);
router.delete('/jobs/:id', auth.protect, auth.hasPermission('access_job_management'), jobController.deleteJob);
router.get('/jobs/:id/candidates', auth.protect, auth.hasPermission('access_job_management'), jobController.getJobCandidates);

// Job Slot routes
router.get('/job-slots', auth.protect, auth.hasPermission('access_job_management'), jobSlotController.getAllJobSlots);
router.get('/job-slots/:id', auth.protect, auth.hasPermission('access_job_management'), jobSlotController.getJobSlot);
router.post('/job-slots', auth.protect, auth.hasPermission('access_job_management'), jobSlotController.createJobSlot);
router.put('/job-slots/:id', auth.protect, auth.hasPermission('access_job_management'), jobSlotController.updateJobSlot);
router.delete('/job-slots/:id', auth.protect, auth.hasPermission('access_job_management'), jobSlotController.deleteJobSlot);
router.get('/jobs/:id/slots', auth.protect, auth.hasPermission('access_job_management'), jobSlotController.getSlotsByJob);

module.exports = router; 