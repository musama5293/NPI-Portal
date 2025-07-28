/**
 * Script to update role permissions in the database
 * Run this with: node scripts/update-roles.js
 */

const mongoose = require('mongoose');
const Role = require('../models/role.model');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Handle connection events
mongoose.connection.on('connected', async () => {
  console.log('MongoDB Connected: ' + mongoose.connection.host);
  
  try {
    await updateDefaultRoles();
    console.log('Role updates completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating roles:', error);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

/**
 * Update the default roles with proper permissions
 */
async function updateDefaultRoles() {
  console.log('Updating default roles...');

  // Admin role (ID: 1)
  await updateRole(1, {
    role_name: 'Admin',
    description: 'Administrator with full access',
    // Give admins all permissions
    can_view_users: true,
    can_create_users: true,
    can_update_users: true,
    can_delete_users: true,
    
    can_view_roles: true,
    can_create_roles: true,
    can_update_roles: true,
    can_delete_roles: true,
    
    can_view_organizations: true,
    can_create_organizations: true,
    can_update_organizations: true,
    can_delete_organizations: true,
    
    can_view_institutes: true,
    can_create_institutes: true,
    can_update_institutes: true,
    can_delete_institutes: true,
    
    can_view_departments: true,
    can_create_departments: true,
    can_update_departments: true,
    can_delete_departments: true,
    
    can_view_candidates: true,
    can_create_candidates: true,
    can_update_candidates: true,
    can_delete_candidates: true,
    
    can_view_tests: true,
    can_create_tests: true,
    can_update_tests: true,
    can_delete_tests: true,
    
    // Page access permissions - all true for admin
    access_dashboard: true,
    access_user_profile: true,
    access_user_management: true,
    access_role_management: true,
    access_organization_management: true,
    access_institute_management: true,
    access_department_management: true,
    access_test_management: true,
    access_category_management: true,
    access_test_assignment: true,
    access_domain_management: true,
    access_subdomain_management: true,
    access_question_management: true,
    access_candidate_management: true,
    access_evaluation_boards: true,
    access_probation_dashboard: true,
    access_job_management: true,
    access_supervisor_tests: true,
    access_candidate_tests: true,
    access_my_tests: true,
    access_results: true,
    access_take_test: true,
  });

  // Supervisor role (ID: 3)
  await updateRole(3, {
    role_name: 'Supervisor',
    description: 'Supervisor with access to feedback tests',
    // Basic entity permissions for supervisors
    can_view_tests: true,
    
    // Page access permissions for supervisors
    access_dashboard: true,
    access_user_profile: true,
    access_supervisor_tests: true,
  });

  // Candidate role (ID: 4)
  await updateRole(4, {
    role_name: 'Candidate',
    description: 'Candidate with access to assigned tests',
    // Basic permissions for candidates
    
    // Page access permissions for candidates
    access_dashboard: true,
    access_user_profile: true,
    access_candidate_tests: true,
    access_my_tests: true,
    access_results: true,
    access_take_test: true,
  });

  // Testing role (ID: 5)
  await updateRole(5, {
    role_name: 'Testing',
    description: 'Testing role with access to test management',
    // Test management permissions
    can_view_tests: true,
    can_create_tests: true,
    can_update_tests: true,
    can_delete_tests: true,
    
    // Page access permissions
    access_dashboard: true,
    access_user_profile: true,
    access_test_management: true,
    access_category_management: true,
    access_test_assignment: true,
  });

  console.log('Default roles updated');
}

/**
 * Update a role by role_id
 */
async function updateRole(roleId, data) {
  try {
    // Find the role
    const role = await Role.findOne({ role_id: roleId });
    
    if (!role) {
      console.log(`Role with ID ${roleId} not found. Creating now...`);
      await Role.create({
        role_id: roleId,
        ...data
      });
      return;
    }
    
    // Update the role
    Object.keys(data).forEach(key => {
      role[key] = data[key];
    });
    
    await role.save();
    console.log(`Updated role: ${role.role_name} (ID: ${roleId})`);
  } catch (error) {
    console.error(`Error updating role ${roleId}:`, error);
    throw error;
  }
} 