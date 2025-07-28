const express = require('express');
const router = express.Router();
const { 
  getInstitutes, 
  getInstitute, 
  createInstitute, 
  updateInstitute, 
  deleteInstitute
} = require('../controllers/institute.controller');
const { protect, hasPermission } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET operations require management permission
router.get('/', hasPermission('access_institute_management'), getInstitutes);
router.get('/:id', hasPermission('access_institute_management'), getInstitute);

// POST requires management permission
router.post('/', hasPermission('access_institute_management'), createInstitute);

// PUT requires management permission
router.put('/:id', hasPermission('access_institute_management'), updateInstitute);

// DELETE requires management permission
router.delete('/:id', hasPermission('access_institute_management'), deleteInstitute);

module.exports = router; 