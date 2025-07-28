const Role = require('../models/role.model');

/**
 * Get all roles
 * @route GET /api/roles
 * @access Private (Admin)
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ role_id: 1 });
    
    return res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving roles',
      error: error.message
    });
  }
};

/**
 * Get single role
 * @route GET /api/roles/:id
 * @access Private (Admin)
 */
exports.getRole = async (req, res) => {
  try {
    // Using role_id for lookups instead of _id
    const roleId = req.params.id;
    const role = await Role.findOne({ role_id: roleId });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving role',
      error: error.message
    });
  }
};

/**
 * Create role
 * @route POST /api/roles
 * @access Private (Admin)
 */
exports.createRole = async (req, res) => {
  try {
    // Extract all fields from the request body
    const {
      role_id,
      role_name,
      description,
      permissions,
      role_status,
      // Permission fields
      can_view_users,
      can_create_users,
      can_update_users,
      can_delete_users,
      
      can_view_roles,
      can_create_roles,
      can_update_roles,
      can_delete_roles,
      
      can_view_organizations,
      can_create_organizations,
      can_update_organizations,
      can_delete_organizations,
      
      can_view_institutes,
      can_create_institutes,
      can_update_institutes,
      can_delete_institutes,
      
      can_view_departments,
      can_create_departments,
      can_update_departments,
      can_delete_departments,
      
      can_view_candidates,
      can_create_candidates,
      can_update_candidates,
      can_delete_candidates,
      
      can_view_tests,
      can_create_tests,
      can_update_tests,
      can_delete_tests,
      
      // Page access permissions
      access_dashboard,
      access_user_profile,
      
      // Administration
      access_user_management,
      access_role_management,
      access_organization_management,
      access_institute_management,
      access_department_management,
      
      // Assessment
      access_test_management,
      access_category_management,
      access_test_assignment,
      access_domain_management,
      access_subdomain_management,
      access_question_management,
      
      // Candidates
      access_candidate_management,
      access_evaluation_boards,
      access_probation_dashboard,
      
      // Jobs
      access_job_management,
      
      // Supervisor specific
      access_supervisor_tests,
      
      // Candidate specific
      access_candidate_tests,
      access_my_tests,
      access_results,
      
      // Common permissions
      access_take_test,
    } = req.body;
    
    // Check if role already exists
    const roleExists = await Role.findOne({ 
      $or: [{ role_id }, { role_name }]
    });

    if (roleExists) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }
    
    // Prevent creation of roles with IDs 1, 3, or 4 which are reserved
    if ([1, 3, 4].includes(parseInt(role_id))) {
      return res.status(400).json({
        success: false,
        message: 'Role IDs 1, 3, and 4 are reserved for core system roles (Admin, Supervisor, Candidate)'
      });
    }
    
    // Create role with all provided fields
    const role = await Role.create({
      role_id,
      role_name,
      description,
      permissions,
      role_status: role_status || 1,
      // Permission fields
      can_view_users,
      can_create_users,
      can_update_users,
      can_delete_users,
      
      can_view_roles,
      can_create_roles,
      can_update_roles,
      can_delete_roles,
      
      can_view_organizations,
      can_create_organizations,
      can_update_organizations,
      can_delete_organizations,
      
      can_view_institutes,
      can_create_institutes,
      can_update_institutes,
      can_delete_institutes,
      
      can_view_departments,
      can_create_departments,
      can_update_departments,
      can_delete_departments,
      
      can_view_candidates,
      can_create_candidates,
      can_update_candidates,
      can_delete_candidates,
      
      can_view_tests,
      can_create_tests,
      can_update_tests,
      can_delete_tests,
      
      // Page access permissions
      access_dashboard,
      access_user_profile,
      
      // Administration
      access_user_management,
      access_role_management,
      access_organization_management,
      access_institute_management,
      access_department_management,
      
      // Assessment
      access_test_management,
      access_category_management,
      access_test_assignment,
      access_domain_management,
      access_subdomain_management,
      access_question_management,
      
      // Candidates
      access_candidate_management,
      access_evaluation_boards,
      access_probation_dashboard,
      
      // Jobs
      access_job_management,
      
      // Supervisor specific
      access_supervisor_tests,
      
      // Candidate specific
      access_candidate_tests,
      access_my_tests,
      access_results,
      
      // Common permissions
      access_take_test,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message
    });
  }
};

/**
 * Update role
 * @route PUT /api/roles/:id
 * @access Private (Admin)
 */
exports.updateRole = async (req, res) => {
  try {
    // Using role_id for lookups instead of _id
    const roleId = req.params.id;
    
    // Get all fields from the request body
    const {
      role_name,
      description,
      permissions,
      role_status,
      // Permission fields
      can_view_users,
      can_create_users,
      can_update_users,
      can_delete_users,
      
      can_view_roles,
      can_create_roles,
      can_update_roles,
      can_delete_roles,
      
      can_view_organizations,
      can_create_organizations,
      can_update_organizations,
      can_delete_organizations,
      
      can_view_institutes,
      can_create_institutes,
      can_update_institutes,
      can_delete_institutes,
      
      can_view_departments,
      can_create_departments,
      can_update_departments,
      can_delete_departments,
      
      can_view_candidates,
      can_create_candidates,
      can_update_candidates,
      can_delete_candidates,
      
      can_view_tests,
      can_create_tests,
      can_update_tests,
      can_delete_tests,
      
      // Page access permissions
      access_dashboard,
      access_user_profile,
      
      // Administration
      access_user_management,
      access_role_management,
      access_organization_management,
      access_institute_management,
      access_department_management,
      
      // Assessment
      access_test_management,
      access_category_management,
      access_test_assignment,
      access_domain_management,
      access_subdomain_management,
      access_question_management,
      
      // Candidates
      access_candidate_management,
      access_evaluation_boards,
      access_probation_dashboard,
      
      // Jobs
      access_job_management,
      
      // Supervisor specific
      access_supervisor_tests,
      
      // Candidate specific
      access_candidate_tests,
      access_my_tests,
      access_results,
      
      // Common permissions
      access_take_test,
    } = req.body;
    
    // First find the role
    let role = await Role.findOne({ role_id: roleId });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    console.log(`Updating role ${roleId}, name: ${role.role_name}`);
    
    // Log page access permissions before update
    console.log('Current page access permissions for role:', {
      dashboard: role.access_dashboard,
      user_profile: role.access_user_profile,
      test_management: role.access_test_management,
      supervisor_tests: role.access_supervisor_tests,
      candidate_tests: role.access_candidate_tests
    });
    
    // Log page access permissions in the request
    console.log('Requested page access permissions:', {
      dashboard: access_dashboard,
      user_profile: access_user_profile,
      test_management: access_test_management,
      supervisor_tests: access_supervisor_tests,
      candidate_tests: access_candidate_tests
    });
    
    // Core roles (1, 3, 4) cannot be edited except for description
    if ([1, 3, 4].includes(parseInt(roleId))) {
      // For core roles, only allow description to be updated
      role = await Role.findOneAndUpdate(
        { role_id: roleId },
        {
          description,
          updated_at: Date.now()
        },
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Role description updated successfully. Core roles cannot be modified further.',
        data: role
      });
    }
    
    // Cannot update role_id 1 (Admin) to inactive
    if (role.role_id === 1 && role_status === 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin role cannot be deactivated'
      });
    }
    
    // Update with all fields for non-core roles
    role = await Role.findOneAndUpdate(
      { role_id: roleId },
      {
        role_name,
        description,
        permissions,
        role_status,
        // Permission fields
        can_view_users,
        can_create_users,
        can_update_users,
        can_delete_users,
        
        can_view_roles,
        can_create_roles,
        can_update_roles,
        can_delete_roles,
        
        can_view_organizations,
        can_create_organizations,
        can_update_organizations,
        can_delete_organizations,
        
        can_view_institutes,
        can_create_institutes,
        can_update_institutes,
        can_delete_institutes,
        
        can_view_departments,
        can_create_departments,
        can_update_departments,
        can_delete_departments,
        
        can_view_candidates,
        can_create_candidates,
        can_update_candidates,
        can_delete_candidates,
        
        can_view_tests,
        can_create_tests,
        can_update_tests,
        can_delete_tests,
        
        // Page access permissions
        access_dashboard,
        access_user_profile,
        
        // Administration
        access_user_management,
        access_role_management,
        access_organization_management,
        access_institute_management,
        access_department_management,
        
        // Assessment
        access_test_management,
        access_category_management,
        access_test_assignment,
        access_domain_management,
        access_subdomain_management,
        access_question_management,
        
        // Candidates
        access_candidate_management,
        access_evaluation_boards,
        access_probation_dashboard,
        
        // Jobs
        access_job_management,
        
        // Supervisor specific
        access_supervisor_tests,
        
        // Candidate specific
        access_candidate_tests,
        access_my_tests,
        access_results,
        
        // Common permissions
        access_take_test,
        
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message
    });
  }
};

/**
 * Delete role
 * @route DELETE /api/roles/:id
 * @access Private (Admin)
 */
exports.deleteRole = async (req, res) => {
  try {
    // Using role_id for lookups instead of _id
    const roleId = req.params.id;
    const role = await Role.findOne({ role_id: roleId });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Cannot delete core roles (1, 3, 4)
    if ([1, 3, 4].includes(parseInt(roleId))) {
      return res.status(400).json({
        success: false,
        message: 'Core roles (Admin, Supervisor, Candidate) cannot be deleted'
      });
    }
    
    await Role.deleteOne({ role_id: roleId });
    
    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message
    });
  }
}; 