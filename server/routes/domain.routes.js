const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const {
  getAllDomains,
  getDomain,
  createDomain,
  updateDomain,
  deleteDomain
} = require('../controllers/domain.controller');

// Base route: /api/domains

// Get all domains
router.get('/', protect, hasPermission('access_domain_management'), getAllDomains);

// Get single domain with subdomains
router.get('/:id', protect, hasPermission('access_domain_management'), getDomain);

// Create domain
router.post('/', protect, hasPermission('access_domain_management'), createDomain);

// Update domain
router.put('/:id', protect, hasPermission('access_domain_management'), updateDomain);

// Delete domain
router.delete('/:id', protect, hasPermission('access_domain_management'), deleteDomain);

module.exports = router; 