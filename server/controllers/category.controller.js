const Category = require('../models/category.model');

/**
 * Get all categories
 * @route GET /api/categories
 * @access Private
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ cat_id: 1 });
    
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error.message
    });
  }
};

/**
 * Get single category
 * @route GET /api/categories/:id
 * @access Private
 */
exports.getCategory = async (req, res) => {
  try {
    const catId = req.params.id;
    const category = await Category.findOne({ cat_id: catId });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving category',
      error: error.message
    });
  }
};

/**
 * Create category
 * @route POST /api/categories
 * @access Private
 */
exports.createCategory = async (req, res) => {
  try {
    const { cat_name, description, cat_status, probation_period_months } = req.body;
    
    // Auto-generate cat_id like other controllers
    const maxCategory = await Category.findOne().sort({ cat_id: -1 });
    const cat_id = maxCategory ? maxCategory.cat_id + 1 : 1;
    
    // Check if category name already exists
    const categoryExists = await Category.findOne({ cat_name: cat_name.trim() });

    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    // Create category
    const category = await Category.create({
      cat_id,
      cat_name: cat_name.trim(),
      description: description?.trim(),
      probation_period_months,
      cat_status: cat_status || 1,
      created_by: req.user._id
    });
    
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Private
 */
exports.updateCategory = async (req, res) => {
  try {
    const catId = req.params.id;
    const { cat_name, description, cat_status, probation_period_months } = req.body;
    
    // Find the category
    let category = await Category.findOne({ cat_id: catId });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Update category
    category = await Category.findOneAndUpdate(
      { cat_id: catId },
      {
        cat_name,
        description,
        cat_status,
        probation_period_months,
        updated_by: req.user._id,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Private
 */
exports.deleteCategory = async (req, res) => {
  try {
    const catId = req.params.id;
    
    // Find the category
    const category = await Category.findOne({ cat_id: catId });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await Category.deleteOne({ cat_id: catId });
    
    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
}; 