const express = require('express');
const router = express.Router();
const { 
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/role.controller');
const { protect, hasPermission } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Role management routes  
router.get('/', hasPermission('access_role_management'), getAllRoles);
router.get('/:id', hasPermission('access_role_management'), getRole);
router.post('/', hasPermission('access_role_management'), createRole);
router.put('/:id', hasPermission('access_role_management'), updateRole);
router.delete('/:id', hasPermission('access_role_management'), deleteRole);

module.exports = router; 