const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const {
  getAllSubDomains,
  getSubDomain,
  createSubDomain,
  updateSubDomain,
  deleteSubDomain
} = require('../controllers/subdomain.controller');

// Base route: /api/subdomains

// Get all subdomains (can be filtered by domain_id in query)
router.get('/', protect, hasPermission('access_subdomain_management'), getAllSubDomains);

// Get single subdomain
router.get('/:id', protect, hasPermission('access_subdomain_management'), getSubDomain);

// Create subdomain
router.post('/', protect, hasPermission('access_subdomain_management'), createSubDomain);

// Update subdomain
router.put('/:id', protect, hasPermission('access_subdomain_management'), updateSubDomain);

// Delete subdomain
router.delete('/:id', protect, hasPermission('access_subdomain_management'), deleteSubDomain);

module.exports = router; 