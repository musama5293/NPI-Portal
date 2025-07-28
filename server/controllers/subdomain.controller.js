const SubDomain = require('../models/subdomain.model');
const Domain = require('../models/domain.model');
const Question = require('../models/question.model');

/**
 * Get all subdomains
 * @route GET /api/subdomains
 * @access Private (Admin)
 */
exports.getAllSubDomains = async (req, res) => {
  try {
    // Admin users can see all subdomains, others only their org's subdomains
    const filter = req.user.role_id === 1 ? {} : { org_id: req.user.org_id };
    if (req.query.domain_id) {
      filter.domain_id = req.query.domain_id;
    }

    const subdomains = await SubDomain.find(filter).sort({ domain_id: 1, subdomain_id: 1 });
    
    // Get domain information for each subdomain (admins can see all domains)
    const domainIds = [...new Set(subdomains.map(sub => sub.domain_id))];
    const domainFilter = req.user.role_id === 1 
      ? { domain_id: { $in: domainIds } }
      : { domain_id: { $in: domainIds }, org_id: req.user.org_id };
    
    const domains = await Domain.find(domainFilter);
    
    // Create a lookup map of domain_id to domain
    const domainMap = new Map(domains.map(domain => [domain.domain_id, domain]));
    
    // Add domain info to each subdomain
    const subdomainsWithDomains = subdomains.map(subdomain => {
      const subObj = subdomain.toObject();
      const domain = domainMap.get(subdomain.domain_id);
      
      if (domain) {
        subObj.domain = {
          domain_id: domain.domain_id,
          domain_name: domain.domain_name
        };
      }
      
      return subObj;
    });
    
    return res.status(200).json({
      success: true,
      count: subdomainsWithDomains.length,
      data: subdomainsWithDomains
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving subdomains',
      error: error.message
    });
  }
};

/**
 * Get single subdomain
 * @route GET /api/subdomains/:id
 * @access Private
 */
exports.getSubDomain = async (req, res) => {
  try {
    // Admin users can access any subdomain, others only their org's subdomains
    const subdomainFilter = req.user.role_id === 1
      ? { subdomain_id: req.params.id }
      : { subdomain_id: req.params.id, org_id: req.user.org_id };
    
    const subdomain = await SubDomain.findOne(subdomainFilter);
    
    if (!subdomain) {
      return res.status(404).json({
        success: false,
        message: 'SubDomain not found'
      });
    }
    
    // Get the domain this subdomain belongs to (admins can access any domain)
    const domainFilter = req.user.role_id === 1
      ? { domain_id: subdomain.domain_id }
      : { domain_id: subdomain.domain_id, org_id: req.user.org_id };
    
    const domain = await Domain.findOne(domainFilter);
    
    // Get questions for this subdomain
    const questions = await Question.find({ subdomain_id: subdomain.subdomain_id })
      .select('question_id question_text is_reversed');
    
    const subdomainObj = subdomain.toObject();
    
    if (domain) {
      subdomainObj.domain = {
        domain_id: domain.domain_id,
        domain_name: domain.domain_name
      };
    }
    
    subdomainObj.questions = questions;
    
    return res.status(200).json({
      success: true,
      data: subdomainObj
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving subdomain',
      error: error.message
    });
  }
};

/**
 * Create subdomain
 * @route POST /api/subdomains
 * @access Private (Admin)
 */
exports.createSubDomain = async (req, res) => {
  try {
    const { domain_id, subdomain_name, description } = req.body;
    
    // Validate required fields
    if (!domain_id || !subdomain_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Domain ID and subdomain name are required'
      });
    }
    
    // Check if domain exists and user has access (admins can access any domain)
    const domainFilter = req.user.role_id === 1 
      ? { domain_id }
      : { domain_id, org_id: req.user.org_id };
    
    const domain = await Domain.findOne(domainFilter);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found or access denied'
      });
    }
    
    // Check for duplicate subdomain name within the same domain and organization
    const existingSubDomain = await SubDomain.findOne({ 
      domain_id,
      subdomain_name: subdomain_name.trim(),
      org_id: domain.org_id, // Use domain's org_id for consistency
      subdomain_status: 1 
    });
    
    if (existingSubDomain) {
      return res.status(400).json({
        success: false,
        message: 'SubDomain name already exists in this domain'
      });
    }
    
    // Get the next subdomain_id
    const lastSubDomain = await SubDomain.findOne().sort({ subdomain_id: -1 });
    const nextSubDomainId = (lastSubDomain?.subdomain_id || 0) + 1;
    
    // Create subdomain with the same org_id as the domain
    const subdomain = await SubDomain.create({
      subdomain_id: nextSubDomainId,
      domain_id,
      subdomain_name: subdomain_name.trim(),
      description: description?.trim() || '',
      org_id: domain.org_id, // Inherit org_id from domain
      created_by: req.user._id,
      updated_by: req.user._id
    });
    
    return res.status(201).json({
      success: true,
      message: 'SubDomain created successfully',
      data: subdomain
    });
  } catch (error) {
    console.error('Error creating subdomain:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating subdomain',
      error: error.message
    });
  }
};

/**
 * Update subdomain
 * @route PUT /api/subdomains/:id
 * @access Private (Admin)
 */
exports.updateSubDomain = async (req, res) => {
  try {
    const { domain_id, subdomain_name, description, subdomain_status } = req.body;
    
    // Find subdomain (admin can update any, others only their org's subdomains)
    const subdomainFilter = req.user.role_id === 1
      ? { subdomain_id: req.params.id }
      : { subdomain_id: req.params.id, org_id: req.user.org_id };
    
    const subdomain = await SubDomain.findOne(subdomainFilter);
    
    if (!subdomain) {
      return res.status(404).json({
        success: false,
        message: 'SubDomain not found'
      });
    }
    
    // If domain_id is being changed, validate the new domain
    let targetDomainId = domain_id || subdomain.domain_id;
    
    if (domain_id && domain_id !== subdomain.domain_id) {
      const domainFilter = req.user.role_id === 1
        ? { domain_id }
        : { domain_id, org_id: req.user.org_id };
      
      const newDomain = await Domain.findOne(domainFilter);
      
      if (!newDomain) {
        return res.status(404).json({
          success: false,
          message: 'Target domain not found or access denied'
        });
      }
    }
    
    // Check for duplicate name if name is being changed (within domain and organization)
    if (subdomain_name && subdomain_name.trim() !== subdomain.subdomain_name) {
      const existingSubDomain = await SubDomain.findOne({ 
        domain_id: targetDomainId,
        subdomain_name: subdomain_name.trim(),
        org_id: subdomain.org_id, // Use existing subdomain's org_id
        subdomain_status: 1,
        subdomain_id: { $ne: subdomain.subdomain_id }
      });
      
      if (existingSubDomain) {
        return res.status(400).json({
          success: false,
          message: 'SubDomain name already exists in this domain'
        });
      }
    }
    
    // Update subdomain
    const updatedSubDomain = await SubDomain.findOneAndUpdate(
      subdomainFilter,
      {
        domain_id: targetDomainId,
        subdomain_name: subdomain_name?.trim() || subdomain.subdomain_name,
        description: description?.trim() || subdomain.description,
        subdomain_status: subdomain_status !== undefined ? subdomain_status : subdomain.subdomain_status,
        updated_by: req.user._id,
        updated_at: new Date()
      },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'SubDomain updated successfully',
      data: updatedSubDomain
    });
  } catch (error) {
    console.error('Error updating subdomain:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating subdomain',
      error: error.message
    });
  }
};

/**
 * Delete subdomain
 * @route DELETE /api/subdomains/:id
 * @access Private (Admin)
 */
exports.deleteSubDomain = async (req, res) => {
  try {
    // Admin users can delete any subdomain, others only their org's subdomains
    const subdomainFilter = req.user.role_id === 1
      ? { subdomain_id: req.params.id }
      : { subdomain_id: req.params.id, org_id: req.user.org_id };
    
    const subdomain = await SubDomain.findOne(subdomainFilter);
    
    if (!subdomain) {
      return res.status(404).json({
        success: false,
        message: 'SubDomain not found'
      });
    }
    
    // Check if subdomain has questions
    const questionsCount = await Question.countDocuments({ subdomain_id: subdomain.subdomain_id });
    
    if (questionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subdomain with associated questions'
      });
    }
    
    await SubDomain.findByIdAndDelete(subdomain._id);
    
    return res.status(200).json({
      success: true,
      message: 'SubDomain deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting subdomain',
      error: error.message
    });
  }
}; 