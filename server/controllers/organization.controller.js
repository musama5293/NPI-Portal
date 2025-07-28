const Organization = require('../models/organization.model');

/**
 * Get all organizations
 * @route GET /api/organizations
 * @access Private
 */
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ org_name: 1 });
    
    return res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get single organization
 * @route GET /api/organizations/:id
 * @access Private
 */
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({ org_id: req.params.id });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Create a organization
 * @route POST /api/organizations
 * @access Private
 */
exports.createOrganization = async (req, res) => {
  try {
    // Auto-generate org_id
    const maxOrg = await Organization.findOne().sort({ org_id: -1 });
    const org_id = maxOrg ? maxOrg.org_id + 1 : 1;
    
    // Set the added_by field to the current user
    req.body.added_by = req.user.id;
    req.body.org_id = org_id;
    
    const organization = await Organization.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });
  } catch (error) {
    console.error(error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a organization
 * @route PUT /api/organizations/:id
 * @access Private
 */
exports.updateOrganization = async (req, res) => {
  try {
    // Check if organization exists
    let organization = await Organization.findOne({ org_id: req.params.id });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Set update metadata
    req.body.updated_by = req.user.id;
    req.body.updated_on = Date.now();
    
    // Update organization
    organization = await Organization.findOneAndUpdate(
      { org_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    console.error(error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete a organization
 * @route DELETE /api/organizations/:id
 * @access Private
 */
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({ org_id: req.params.id });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    await organization.remove();
    
    return res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 