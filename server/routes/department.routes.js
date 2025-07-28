const express = require('express');
const router = express.Router();
const { 
  getDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment
} = require('../controllers/department.controller');
const { protect, hasPermission } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET operations require management permission
router.get('/', hasPermission('access_department_management'), getDepartments);
router.get('/:id', hasPermission('access_department_management'), getDepartment);

// POST requires management permission
router.post('/', hasPermission('access_department_management'), createDepartment);

// PUT requires management permission
router.put('/:id', hasPermission('access_department_management'), updateDepartment);

// DELETE requires management permission
router.delete('/:id', hasPermission('access_department_management'), deleteDepartment);

module.exports = router; 