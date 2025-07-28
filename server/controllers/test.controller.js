const Test = require('../models/test.model');
const Category = require('../models/category.model');

/**
 * Get all tests
 * @route GET /api/tests
 * @access Private
 */
exports.getAllTests = async (req, res) => {
  try {
    // Get query parameters
    const { type } = req.query;
    
    console.log('Test query params:', req.query, 'Route path:', req.path);
    
    // Build query
    let query = {};
    
    // Filter by test type if provided
    if (type) {
      if (type === 'feedback') {
        // Support multiple ways feedback forms might be labeled
        query.$or = [
          { test_type: 'supervisor_feedback' },
          { test_type: 'Supervisor Feedback' },
          { test_type: { $regex: 'supervisor', $options: 'i' } },
          { test_type: 3 }, // Assuming 3 might be used for supervisor feedback forms
          { test_type: '3' } // String representation of the number
        ];
      } else if (type === 'regular') {
        // Exclude supervisor feedback forms
        query.$nor = [
          { test_type: 'supervisor_feedback' },
          { test_type: 'Supervisor Feedback' },
          { test_type: { $regex: 'supervisor', $options: 'i' } },
          { test_type: 3 },
          { test_type: '3' }
        ];
      }
    }
    
    console.log('MongoDB query:', JSON.stringify(query));
    
    const tests = await Test.find(query)
      .populate('categories', 'cat_name')
      .sort({ test_id: 1 });
    
    // Get question counts for each test
    const Question = require('../models/question.model');
    const testIds = tests.map(test => test.test_id);
    
    // Use aggregation to get question counts by test_id
    const questionCounts = await Question.aggregate([
      { $match: { test_ids: { $in: testIds } } },
      { $unwind: "$test_ids" },
      { $match: { test_ids: { $in: testIds } } },
      { $group: { _id: "$test_ids", count: { $sum: 1 } } }
    ]);
    
    // Create a map of test_id -> question count
    const testQuestionCountMap = questionCounts.reduce((map, item) => {
      map[item._id] = item.count;
      return map;
    }, {});
    
    // Add question counts to each test
    const testsWithQuestionCounts = tests.map(test => {
      const testObj = test.toObject();
      testObj.question_count = testQuestionCountMap[test.test_id] || 0;
      return testObj;
    });
    
    console.log(`Found ${tests.length} tests for type=${type}`);
    
    return res.status(200).json({
      success: true,
      count: tests.length,
      data: testsWithQuestionCounts
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving tests',
      error: error.message
    });
  }
};

/**
 * Get single test
 * @route GET /api/tests/:id
 * @access Private
 */
exports.getTest = async (req, res) => {
  try {
    // Using test_id for lookups instead of _id
    const testId = req.params.id;
    const test = await Test.findOne({ test_id: testId })
      .populate('categories', 'cat_name');
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving test',
      error: error.message
    });
  }
};

/**
 * Create test
 * @route POST /api/tests
 * @access Private
 */
exports.createTest = async (req, res) => {
  try {
    // Extract fields from request body
    const {
      test_name,
      test_type,
      description,
      instruction,
      closing_remarks,
      test_duration,
      categories,
      test_status
    } = req.body;
    
    // Auto-generate test_id
    let nextTestId = 1;
    const latestTest = await Test.findOne().sort({ test_id: -1 });
    if (latestTest) {
      nextTestId = latestTest.test_id + 1;
    }

    // Check if test name already exists
    const testExists = await Test.findOne({ test_name });

    if (testExists) {
      return res.status(400).json({
        success: false,
        message: 'A test with this name already exists'
      });
    }
    
    // Create test
    const test = await Test.create({
      test_id: nextTestId,
      test_name,
      test_type,
      description,
      instruction,
      closing_remarks,
      test_duration,
      categories,
      test_status: test_status || 1,
      created_by: req.user._id
    });
    
    return res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: test
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating test',
      error: error.message
    });
  }
};

/**
 * Update test
 * @route PUT /api/tests/:id
 * @access Private
 */
exports.updateTest = async (req, res) => {
  try {
    // Using test_id for lookups instead of _id
    const testId = req.params.id;
    
    // Extract fields from request body
    const {
      test_name,
      test_type,
      description,
      instruction,
      closing_remarks,
      test_duration,
      categories,
      test_status
    } = req.body;
    
    // First find the test
    let test = await Test.findOne({ test_id: testId });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Check if another test with the same name exists (exclude current test)
    if (test_name && test_name !== test.test_name) {
      const existingTest = await Test.findOne({ 
        test_name, 
        test_id: { $ne: testId } 
      });
      
      if (existingTest) {
        return res.status(400).json({
          success: false,
          message: 'A test with this name already exists'
        });
      }
    }
    
    // Update test
    test = await Test.findOneAndUpdate(
      { test_id: testId },
      {
        test_name,
        test_type,
        description,
        instruction,
        closing_remarks,
        test_duration,
        categories,
        test_status,
        updated_by: req.user._id,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      data: test
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating test',
      error: error.message
    });
  }
};

/**
 * Delete test
 * @route DELETE /api/tests/:id
 * @access Private
 */
exports.deleteTest = async (req, res) => {
  try {
    // Using test_id for lookups instead of _id
    const testId = req.params.id;
    const test = await Test.findOne({ test_id: testId });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    await Test.deleteOne({ test_id: testId });
    
    return res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting test',
      error: error.message
    });
  }
}; 