const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const config = require('../config/config');

/**
 * Protect routes middleware
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Get user from token with populated role
    req.user = await User.findById(decoded.id).select('-password');

    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Get user's role with permissions
    const role = await Role.findOne({ role_id: req.user.role_id });
    if (!role) {
      return res.status(401).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Attach role permissions to user object
    req.userRole = role;
    
    // Extract page permissions from role and add to user object as an array
    const userPermissions = [];
    
    // List of all possible page permissions
    const allPagePermissions = [
      'access_dashboard', 'access_user_profile', 'access_take_test',
      'access_user_management', 'access_role_management', 
      'access_organization_management', 'access_institute_management', 'access_department_management',
      'access_test_management', 'access_category_management', 'access_test_assignment',
      'access_domain_management', 'access_subdomain_management', 'access_question_management',
      'access_candidate_management', 'access_evaluation_boards', 'access_probation_dashboard',
      'access_job_management',
      'access_results_dashboard', 'access_my_tests', 'access_results',
      'access_support', 'access_admin_support',
      'access_email_dashboard', 'access_email_templates', 'access_email_logs',
      'access_supervisor_tests', 'access_candidate_tests'
    ];
    
    // Check each permission and add to user permissions array if granted
    allPagePermissions.forEach(permission => {
      if (role[permission] === true) {
        userPermissions.push(permission);
        }
    });
    
    // Add permissions array to user object
    req.user.permissions = userPermissions;
    
    // Add additional debug for candidate roles
    if (req.user.role_id === 4) {
      console.log(`Candidate user ${req.user.username} - candidate_id:`, req.user.candidate_id);
    }
    
    console.log(`User ${req.user.username} has role ${role.role_name} with permissions:`, userPermissions);

    // Check if user is active
    if (req.user.user_status !== 1) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Legacy role-based authorization middleware (kept for backward compatibility)
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Allow admin role (role_id 1) to access all routes
    if (req.user.role_id === 1) {
      return next();
    }
    
    // Special case for role routes - allow users to access their own role data
    if (req.baseUrl === '/api/roles' && req.method === 'GET') {
      const roleId = req.params.id;
      
      // If user is requesting their own role
      if (roleId && parseInt(roleId) === req.user.role_id) {
        return next();
      }
    }
    
    if (!roles.includes(req.user.role_id)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role_id} is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Permission-based authorization middleware
 */
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    // Allow admin role (role_id 1) to have all permissions
    if (req.user.role_id === 1) {
      return next();
    }
    
    // Special case for role routes - allow users to access their own role data
    if (req.baseUrl === '/api/roles' && req.method === 'GET') {
      const roleId = req.params.id;
      
      // If user is requesting their own role
      if (roleId && parseInt(roleId) === req.user.role_id) {
        return next();
      }
    }
    
    console.log(`Checking permission ${permission} for user ${req.user.username}`);
    console.log(`User has permission: ${req.userRole[permission]}`);
    
    if (!req.userRole || req.userRole[permission] !== true) {
      return res.status(403).json({
        success: false,
        message: `User doesn't have permission: ${permission}`
      });
    }
    next();
  };
};

/**
 * Page access authorization middleware
 */
exports.hasPageAccess = (pagePermission) => {
  return (req, res, next) => {
    // Allow admin role (role_id 1) to access all pages
    if (req.user.role_id === 1) {
      return next();
    }
    
    console.log(`Checking page access ${pagePermission} for user ${req.user.username}`);
    console.log(`User has page access: ${req.userRole[pagePermission]}`);
    
    if (!req.userRole || req.userRole[pagePermission] !== true) {
      return res.status(403).json({
        success: false,
        message: `User doesn't have access to this page: ${pagePermission}`
      });
    }
    next();
  };
};