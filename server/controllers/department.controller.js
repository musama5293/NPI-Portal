const Department = require('../models/department.model');

/**
 * Get all departments
 * @route GET /api/departments
 * @access Private
 */
exports.getDepartments = async (req, res) => {
  try {
    const { inst_id } = req.query;
    const query = {};
    
    // Filter by institute if provided
    if (inst_id) {
      query.inst_id = inst_id;
    }
    
    const departments = await Department.find(query).sort({ dept_name: 1 });
    
    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
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
 * Get single department
 * @route GET /api/departments/:id
 * @access Private
 */
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findOne({ dept_id: req.params.id });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: department
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
 * Create a department
 * @route POST /api/departments
 * @access Private
 */
exports.createDepartment = async (req, res) => {
  try {
    // Auto-generate dept_id
    const maxDept = await Department.findOne().sort({ dept_id: -1 });
    const dept_id = maxDept ? maxDept.dept_id + 1 : 1;
    
    // Set the added_by field to the current user
    req.body.added_by = req.user.id;
    req.body.dept_id = dept_id;
    
    const department = await Department.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
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
 * Update a department
 * @route PUT /api/departments/:id
 * @access Private
 */
exports.updateDepartment = async (req, res) => {
  try {
    // Check if department exists
    let department = await Department.findOne({ dept_id: req.params.id });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Set update metadata
    req.body.updated_by = req.user.id;
    req.body.updated_on = Date.now();
    
    // Update department
    department = await Department.findOneAndUpdate(
      { dept_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
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
 * Delete a department
 * @route DELETE /api/departments/:id
 * @access Private
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findOne({ dept_id: req.params.id });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    await department.remove();
    
    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
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