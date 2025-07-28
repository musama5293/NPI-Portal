/**
 * Migration Script: Update Role Permissions Structure
 * 
 * This script removes entity CRUD permissions and adds new page access permissions.
 * It also sets appropriate defaults for existing roles.
 * 
 * Run this with: node scripts/migrate-role-permissions.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');

const migrateRolePermissions = async () => {
  try {
    console.log('🚀 Starting role permissions migration...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const rolesCollection = db.collection('roles');
    
    // Check current data
    const rolesCount = await rolesCollection.countDocuments();
    console.log(`📊 Found ${rolesCount} roles to migrate`);
    
    if (rolesCount === 0) {
      console.log('✅ No roles found to migrate!');
      return;
    }
    
    // Get all roles
    const roles = await rolesCollection.find({}).toArray();
    
    console.log('🔧 Processing roles...');
    
    for (const role of roles) {
      console.log(`   Processing role: ${role.role_name} (ID: ${role.role_id})`);
      
      // Prepare update object - remove old CRUD permissions and add new page permissions
      const updateFields = {};
      const unsetFields = {};
      
      // Remove all old entity CRUD permissions
      const entityCrudPermissions = [
        'can_view_users', 'can_create_users', 'can_update_users', 'can_delete_users',
        'can_view_roles', 'can_create_roles', 'can_update_roles', 'can_delete_roles',
        'can_view_organizations', 'can_create_organizations', 'can_update_organizations', 'can_delete_organizations',
        'can_view_institutes', 'can_create_institutes', 'can_update_institutes', 'can_delete_institutes',
        'can_view_departments', 'can_create_departments', 'can_update_departments', 'can_delete_departments',
        'can_view_candidates', 'can_create_candidates', 'can_update_candidates', 'can_delete_candidates',
        'can_view_tests', 'can_create_tests', 'can_update_tests', 'can_delete_tests'
      ];
      
      entityCrudPermissions.forEach(permission => {
        unsetFields[permission] = '';
      });
      
      // Set default values for new page permissions based on role type
      if (role.role_id === 1) {
        // Admin role - grant all permissions
        updateFields.access_results_dashboard = true;
        updateFields.access_admin_support = true;
        updateFields.access_email_dashboard = true;
        updateFields.access_email_templates = true;
        updateFields.access_email_logs = true;
        updateFields.access_support = true;
        
        // Grant all entity management permissions to admin
        updateFields.access_domain_management = true;
        updateFields.access_subdomain_management = true;
        updateFields.access_question_management = true;
        updateFields.access_candidate_management = true;
        updateFields.access_organization_management = true;
        updateFields.access_institute_management = true;
        updateFields.access_department_management = true;
        updateFields.access_test_management = true;
        updateFields.access_category_management = true;
        updateFields.access_test_assignment = true;
        updateFields.access_evaluation_boards = true;
        updateFields.access_probation_dashboard = true;
        updateFields.access_job_management = true;
        updateFields.access_user_management = true;
        updateFields.access_role_management = true;
      } else if (role.role_id === 3) {
        // Supervisor role - grant basic permissions
        updateFields.access_results_dashboard = false;
        updateFields.access_admin_support = false;
        updateFields.access_email_dashboard = false;
        updateFields.access_email_templates = false;
        updateFields.access_email_logs = false;
        updateFields.access_support = true;
        
        // Grant limited entity management permissions to supervisor
        updateFields.access_domain_management = false;
        updateFields.access_subdomain_management = false;
        updateFields.access_question_management = false;
        updateFields.access_candidate_management = false;
        updateFields.access_organization_management = false;
        updateFields.access_institute_management = false;
        updateFields.access_department_management = false;
        updateFields.access_test_management = false;
        updateFields.access_category_management = false;
        updateFields.access_test_assignment = false;
        updateFields.access_evaluation_boards = false;
        updateFields.access_probation_dashboard = false;
        updateFields.access_job_management = false;
        updateFields.access_user_management = false;
        updateFields.access_role_management = false;
      } else if (role.role_id === 4) {
        // Candidate role - grant limited permissions
        updateFields.access_results_dashboard = false;
        updateFields.access_admin_support = false;
        updateFields.access_email_dashboard = false;
        updateFields.access_email_templates = false;
        updateFields.access_email_logs = false;
        updateFields.access_support = true;
        
        // Grant no entity management permissions to candidate
        updateFields.access_domain_management = false;
        updateFields.access_subdomain_management = false;
        updateFields.access_question_management = false;
        updateFields.access_candidate_management = false;
        updateFields.access_organization_management = false;
        updateFields.access_institute_management = false;
        updateFields.access_department_management = false;
        updateFields.access_test_management = false;
        updateFields.access_category_management = false;
        updateFields.access_test_assignment = false;
        updateFields.access_evaluation_boards = false;
        updateFields.access_probation_dashboard = false;
        updateFields.access_job_management = false;
        updateFields.access_user_management = false;
        updateFields.access_role_management = false;
      } else {
        // Custom roles - grant no new permissions by default
        updateFields.access_results_dashboard = false;
        updateFields.access_admin_support = false;
        updateFields.access_email_dashboard = false;
        updateFields.access_email_templates = false;
        updateFields.access_email_logs = false;
        updateFields.access_support = false;
        
        // Grant no entity management permissions to custom roles by default
        updateFields.access_domain_management = false;
        updateFields.access_subdomain_management = false;
        updateFields.access_question_management = false;
        updateFields.access_candidate_management = false;
        updateFields.access_organization_management = false;
        updateFields.access_institute_management = false;
        updateFields.access_department_management = false;
        updateFields.access_test_management = false;
        updateFields.access_category_management = false;
        updateFields.access_test_assignment = false;
        updateFields.access_evaluation_boards = false;
        updateFields.access_probation_dashboard = false;
        updateFields.access_job_management = false;
        updateFields.access_user_management = false;
        updateFields.access_role_management = false;
      }
      
      // Update timestamp
      updateFields.updated_at = new Date();
      
      // Perform the update
      await rolesCollection.updateOne(
        { _id: role._id },
        { 
          $set: updateFields,
          $unset: unsetFields
        }
      );
    }
    
    console.log(`✅ Updated ${roles.length} roles with new permission structure`);
    
    // Verify migration results
    console.log('🔍 Verifying migration results...');
    
    const updatedRoles = await rolesCollection.find({}).toArray();
    const rolesWithNewPermissions = updatedRoles.filter(role => 
      role.hasOwnProperty('access_results_dashboard') &&
      role.hasOwnProperty('access_admin_support') &&
      role.hasOwnProperty('access_email_dashboard')
    );
    
    const rolesWithOldPermissions = updatedRoles.filter(role => 
      role.hasOwnProperty('can_view_users') || 
      role.hasOwnProperty('can_create_users')
    );
    
    console.log(`📊 Final counts:`);
    console.log(`   - Roles with new permissions: ${rolesWithNewPermissions.length}/${rolesCount}`);
    console.log(`   - Roles with old permissions: ${rolesWithOldPermissions.length}`);
    
    if (rolesWithOldPermissions.length === 0 && rolesWithNewPermissions.length === rolesCount) {
      console.log('✅ Migration completed successfully!');
      console.log('🎉 All roles now use the new permission structure!');
    } else {
      console.log('⚠️  Some roles may not have been updated properly.');
    }
    
    // Show sample data
    console.log('\n📋 Sample migrated roles:');
    const sampleRoles = updatedRoles.slice(0, 3);
    
    sampleRoles.forEach((role, index) => {
      console.log(`Sample Role ${index + 1}:`, {
        role_id: role.role_id,
        role_name: role.role_name,
        access_results_dashboard: role.access_results_dashboard,
        access_admin_support: role.access_admin_support,
        access_email_dashboard: role.access_email_dashboard,
        access_support: role.access_support
      });
    });
    
    console.log('\n🎯 Role management now simplified to page-based permissions only!');
    console.log('   - Removed complex entity CRUD permissions');
    console.log('   - Added intuitive page access permissions');
    console.log('   - Results Dashboard, Support, and Email permissions available');
    console.log('   - Admin roles have access to all new features');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the migration
migrateRolePermissions()
  .then(() => {
    console.log('🎯 Role permissions migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 