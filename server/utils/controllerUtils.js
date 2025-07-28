/**
 * Utility functions for controllers to reduce code duplication
 */

/**
 * Standard response formatter for successful operations
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send in response
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
exports.sendSuccessResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Standard response formatter for paginated results
 * @param {Object} res - Express response object
 * @param {Array} data - Data array to send in response
 * @param {Number} total - Total count of records
 * @param {Number} page - Current page number
 * @param {Number} limit - Records per page
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
exports.sendPaginatedResponse = (res, data, total, page, limit, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    count: data.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data
  });
};

/**
 * Standard response formatter for error handling
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} error - Error object
 * @param {Number} statusCode - HTTP status code (default: 500)
 */
exports.sendErrorResponse = (res, message, error, statusCode = 500) => {
  console.error(`Error: ${message}`, error);
  return res.status(statusCode).json({
    success: false,
    message,
    error: error.message
  });
};

/**
 * Helper function to build query filters from request query parameters
 * @param {Object} queryParams - Request query parameters
 * @param {Object} fieldMappings - Mapping of query params to database fields
 * @returns {Object} - MongoDB query object
 */
exports.buildQueryFilters = (queryParams, fieldMappings = {}) => {
  const filter = {};
  
  // Process each query parameter
  Object.entries(queryParams).forEach(([key, value]) => {
    // Skip pagination parameters
    if (['page', 'limit'].includes(key)) return;
    
    // Get the database field name (use the key if no mapping exists)
    const fieldName = fieldMappings[key] || key;
    
    // Handle different filter types
    if (value) {
      // Handle date ranges
      if (key.endsWith('_from')) {
        const baseField = fieldName.replace('_from', '');
        filter[baseField] = filter[baseField] || {};
        filter[baseField].$gte = new Date(value);
      } 
      else if (key.endsWith('_to')) {
        const baseField = fieldName.replace('_to', '');
        filter[baseField] = filter[baseField] || {};
        filter[baseField].$lte = new Date(value);
      }
      // Handle search fields (case insensitive regex)
      else if (key.endsWith('_search')) {
        const baseField = fieldName.replace('_search', '');
        filter[baseField] = { $regex: value, $options: 'i' };
      }
      // Handle numeric fields
      else if (key.endsWith('_id') || key.endsWith('_status')) {
        filter[fieldName] = Number(value);
      }
      // Default handling
      else {
        filter[fieldName] = value;
      }
    }
  });
  
  return filter;
};

/**
 * Helper function to format aggregation results into a key-value object
 * @param {Array} aggregationResult - Result from MongoDB aggregation
 * @returns {Object} - Formatted key-value object
 */
exports.formatAggregationResult = (aggregationResult) => {
  return aggregationResult.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

/**
 * Helper function to calculate percentage change
 * @param {Number} current - Current value
 * @param {Number} previous - Previous value
 * @returns {Number} - Percentage change
 */
exports.calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};