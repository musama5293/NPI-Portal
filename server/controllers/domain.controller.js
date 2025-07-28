const Domain = require('../models/domain.model');
const SubDomain = require('../models/subdomain.model');
const Question = require('../models/question.model');

/**
 * Get all domains
 * @route GET /api/domains
 * @access Private (Admin)
 */
exports.getAllDomains = async (req, res) => {
  try {
    // Admin users (role_id = 1) can see all domains, others only see their org's domains
    const filter = req.user.role_id === 1 ? {} : { org_id: req.user.org_id };
    
    const domains = await Domain.find(filter).sort({ domain_id: 1 });
    
    return res.status(200).json({
      success: true,
      count: domains.length,
      data: domains
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving domains',
      error: error.message
    });
  }
};

/**
 * Get single domain with subdomains
 * @route GET /api/domains/:id
 * @access Private
 */
exports.getDomain = async (req, res) => {
  try {
    // Admin users can access any domain, others only their org's domains
    const domainFilter = req.user.role_id === 1 
      ? { domain_id: req.params.id }
      : { domain_id: req.params.id, org_id: req.user.org_id };
    
    const domain = await Domain.findOne(domainFilter);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }
    
    // Get subdomains for this domain (admins can see all, others filtered by org_id)
    const subdomainFilter = req.user.role_id === 1
      ? { domain_id: domain.domain_id }
      : { domain_id: domain.domain_id, org_id: req.user.org_id };
    
    const subdomains = await SubDomain.find(subdomainFilter);
    
    return res.status(200).json({
      success: true,
      data: {
        domain,
        subdomains
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving domain',
      error: error.message
    });
  }
};

/**
 * Create domain
 * @route POST /api/domains
 * @access Private (Admin)
 */
exports.createDomain = async (req, res) => {
  try {
    const { domain_name, description } = req.body;
    
    // Validate required fields
    if (!domain_name || !domain_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required'
      });
    }
    
    // Check for duplicate domain name within the same organization
    const existingDomain = await Domain.findOne({ 
      domain_name: domain_name.trim(),
      org_id: req.user.org_id,
      domain_status: 1 
    });
    
    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'Domain name already exists in your organization'
      });
    }
    
    // Get the next domain_id
    const lastDomain = await Domain.findOne().sort({ domain_id: -1 });
    const nextDomainId = (lastDomain?.domain_id || 0) + 1;
    
    // Create domain with user's organization
    const domain = await Domain.create({
      domain_id: nextDomainId,
      domain_name: domain_name.trim(),
      description: description?.trim() || '',
      org_id: req.user.org_id,
      created_by: req.user._id,
      updated_by: req.user._id
    });
    
    return res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      data: domain
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating domain',
      error: error.message
    });
  }
};

/**
 * Update domain
 * @route PUT /api/domains/:id
 * @access Private (Admin)
 */
exports.updateDomain = async (req, res) => {
  try {
    const { domain_name, description, domain_status } = req.body;
    
    // Find domain (admin can update any, others only their org's domains)
    const domainFilter = req.user.role_id === 1 
      ? { domain_id: req.params.id }
      : { domain_id: req.params.id, org_id: req.user.org_id };
    
    const domain = await Domain.findOne(domainFilter);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }
    
    // Check for duplicate name if name is being changed (within organization)
    if (domain_name && domain_name.trim() !== domain.domain_name) {
      const existingDomain = await Domain.findOne({ 
        domain_name: domain_name.trim(),
        org_id: domain.org_id, // Use domain's org_id for consistency
        domain_status: 1,
        domain_id: { $ne: domain.domain_id }
      });
      
      if (existingDomain) {
        return res.status(400).json({
          success: false,
          message: 'Domain name already exists in this organization'
        });
      }
    }
    
    // Update domain
    const updatedDomain = await Domain.findOneAndUpdate(
      domainFilter,
      {
        domain_name: domain_name?.trim() || domain.domain_name,
        description: description?.trim() || domain.description,
        domain_status: domain_status !== undefined ? domain_status : domain.domain_status,
        updated_by: req.user._id,
        updated_at: new Date()
      },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Domain updated successfully',
      data: updatedDomain
    });
  } catch (error) {
    console.error('Error updating domain:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating domain',
      error: error.message
    });
  }
};

/**
 * Delete domain
 * @route DELETE /api/domains/:id
 * @access Private (Admin)
 */
exports.deleteDomain = async (req, res) => {
  try {
    // Admin users can delete any domain, others only their org's domains
    const domainFilter = req.user.role_id === 1
      ? { domain_id: req.params.id }
      : { domain_id: req.params.id, org_id: req.user.org_id };
    
    const domain = await Domain.findOne(domainFilter);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }
    
    // Check if domain has subdomains (admins check all subdomains, others check within org)
    const subdomainFilter = req.user.role_id === 1
      ? { domain_id: domain.domain_id }
      : { domain_id: domain.domain_id, org_id: req.user.org_id };
    
    const subdomainsCount = await SubDomain.countDocuments(subdomainFilter);
    
    if (subdomainsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete domain with associated subdomains'
      });
    }
    
    // Check if domain has questions
    const questionsCount = await Question.countDocuments({ domain_id: domain.domain_id });
    
    if (questionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete domain with associated questions'
      });
    }
    
    await Domain.findByIdAndDelete(domain._id);
    
    return res.status(200).json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting domain',
      error: error.message
    });
  }
}; 