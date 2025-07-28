const express = require('express');
const router = express.Router();
const { 
  getOrganizations, 
  getOrganization, 
  createOrganization, 
  updateOrganization, 
  deleteOrganization
} = require('../controllers/organization.controller');
const { protect, hasPermission } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET operations require management permission
router.get('/', hasPermission('access_organization_management'), getOrganizations);
router.get('/:id', hasPermission('access_organization_management'), getOrganization);

// POST requires management permission
router.post('/', hasPermission('access_organization_management'), createOrganization);

// PUT requires management permission
router.put('/:id', hasPermission('access_organization_management'), updateOrganization);

// DELETE requires management permission
router.delete('/:id', hasPermission('access_organization_management'), deleteOrganization);

module.exports = router; 