const Institute = require('../models/institute.model');

/**
 * Get all institutes
 * @route GET /api/institutes
 * @access Private
 */
exports.getInstitutes = async (req, res) => {
  try {
    const { org_id } = req.query;
    const query = {};
    
    // Filter by organization if provided
    if (org_id) {
      query.org_id = org_id;
    }
    
    const institutes = await Institute.find(query).sort({ inst_name: 1 });
    
    return res.status(200).json({
      success: true,
      count: institutes.length,
      data: institutes
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
 * Get single institute
 * @route GET /api/institutes/:id
 * @access Private
 */
exports.getInstitute = async (req, res) => {
  try {
    const institute = await Institute.findOne({ inst_id: req.params.id });
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: institute
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
 * Create an institute
 * @route POST /api/institutes
 * @access Private
 */
exports.createInstitute = async (req, res) => {
  try {
    // Auto-generate inst_id
    const maxInst = await Institute.findOne().sort({ inst_id: -1 });
    const inst_id = maxInst ? maxInst.inst_id + 1 : 1;
    
    // Set the added_by field to the current user
    req.body.added_by = req.user.id;
    req.body.inst_id = inst_id;
    
    const institute = await Institute.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Institute created successfully',
      data: institute
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
 * Update an institute
 * @route PUT /api/institutes/:id
 * @access Private
 */
exports.updateInstitute = async (req, res) => {
  try {
    // Check if institute exists
    let institute = await Institute.findOne({ inst_id: req.params.id });
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    // Set update metadata
    req.body.updated_by = req.user.id;
    req.body.updated_on = Date.now();
    
    // Update institute
    institute = await Institute.findOneAndUpdate(
      { inst_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Institute updated successfully',
      data: institute
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
 * Delete an institute
 * @route DELETE /api/institutes/:id
 * @access Private
 */
exports.deleteInstitute = async (req, res) => {
  try {
    const institute = await Institute.findOne({ inst_id: req.params.id });
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }
    
    await institute.remove();
    
    return res.status(200).json({
      success: true,
      message: 'Institute deleted successfully',
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