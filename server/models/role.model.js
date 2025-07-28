const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  role_id: {
    type: Number,
    required: true,
    unique: true
  },
  role_name: {
    type: String,
    required: [true, 'Please provide a role name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: {
    type: [String],
    default: []
  },
  
  // Page Access Permissions
  access_dashboard: { type: Boolean, default: false },
  access_user_profile: { type: Boolean, default: false },
  access_take_test: { type: Boolean, default: false },
  
  // Management Pages
  access_user_management: { type: Boolean, default: false },
  access_role_management: { type: Boolean, default: false },
  access_organization_management: { type: Boolean, default: false },
  access_institute_management: { type: Boolean, default: false },
  access_department_management: { type: Boolean, default: false },
  
  // Assessment Management
  access_test_management: { type: Boolean, default: false },
  access_category_management: { type: Boolean, default: false },
  access_test_assignment: { type: Boolean, default: false },
  access_domain_management: { type: Boolean, default: false },
  access_subdomain_management: { type: Boolean, default: false },
  access_question_management: { type: Boolean, default: false },
  
  // Candidate & HR Management
  access_candidate_management: { type: Boolean, default: false },
  access_evaluation_boards: { type: Boolean, default: false },
  access_probation_dashboard: { type: Boolean, default: false },
  access_job_management: { type: Boolean, default: false },
  
  // Results & Analytics
  access_results_dashboard: { type: Boolean, default: false },
  access_my_tests: { type: Boolean, default: false },
  access_results: { type: Boolean, default: false },
  
  // Support System
  access_support: { type: Boolean, default: false },
  access_admin_support: { type: Boolean, default: false },
  
  // Email Management
  access_email_dashboard: { type: Boolean, default: false },
  access_email_templates: { type: Boolean, default: false },
  access_email_logs: { type: Boolean, default: false },
  
  // Role-specific access
  access_supervisor_tests: { type: Boolean, default: false },
  access_candidate_tests: { type: Boolean, default: false },
  
  role_status: {
    type: Number,
    default: 1
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', RoleSchema); 