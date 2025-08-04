import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config/config';

// Page access permission groups - Updated with new pages
const pagePermissionGroups = [
  {
    name: 'Dashboard & Profile',
    permissions: [
      { name: 'access_dashboard', label: 'Dashboard' },
      { name: 'access_user_profile', label: 'User Profile' },
      { name: 'access_take_test', label: 'Take Test' }
    ]
  },
  {
    name: 'Administration',
    permissions: [
      { name: 'access_user_management', label: 'User Management' },
      { name: 'access_role_management', label: 'Role Management' },
      { name: 'access_organization_management', label: 'Organization Management' },
      { name: 'access_institute_management', label: 'Institute Management' },
      { name: 'access_department_management', label: 'Department Management' }
    ]
  },
  {
    name: 'Assessment Management',
    permissions: [
      { name: 'access_test_management', label: 'Test Management' },
      { name: 'access_category_management', label: 'Category Management' },
      { name: 'access_test_assignment', label: 'Test Assignment' },
      { name: 'access_domain_management', label: 'Domain Management' },
      { name: 'access_subdomain_management', label: 'Subdomain Management' },
      { name: 'access_question_management', label: 'Question Management' }
    ]
  },
  {
    name: 'HR & Candidate Management',
    permissions: [
      { name: 'access_candidate_management', label: 'Candidate Management' },
      { name: 'access_evaluation_boards', label: 'Evaluation Boards' },
      { name: 'access_probation_dashboard', label: 'Probation Dashboard' },
      { name: 'access_job_management', label: 'Job Management' }
    ]
  },
  {
    name: 'Results & Analytics',
    permissions: [
      { name: 'access_results_dashboard', label: 'Results Dashboard' },
      { name: 'access_my_tests', label: 'My Assessments' },
      { name: 'access_results', label: 'Results' }
    ]
  },
  {
    name: 'Support System',
    permissions: [
      { name: 'access_support', label: 'Support' },
      { name: 'access_admin_support', label: 'Admin Support' }
    ]
  },
  {
    name: 'Email Management',
    permissions: [
      { name: 'access_email_dashboard', label: 'Email Dashboard' },
      { name: 'access_email_templates', label: 'Email Templates' },
      { name: 'access_email_logs', label: 'Email Logs' }
    ]
  },
  {
    name: 'Role-Specific Access',
    permissions: [
      { name: 'access_supervisor_tests', label: 'Supervisor Tests' },
      { name: 'access_candidate_tests', label: 'Candidate Tests' }
    ]
  }
];

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const auth = useAuth();
  
  const [formData, setFormData] = useState({
    role_id: '',
    role_name: '',
    description: '',
    permissions: [],
    role_status: 1,
    
    // Page access permissions only - no more entity CRUD permissions
    access_dashboard: false,
    access_user_profile: false,
    access_take_test: false,
    
    // Administration
    access_user_management: false,
    access_role_management: false,
    access_organization_management: false,
    access_institute_management: false,
    access_department_management: false,
    
    // Assessment
    access_test_management: false,
    access_category_management: false,
    access_test_assignment: false,
    access_domain_management: false,
    access_subdomain_management: false,
    access_question_management: false,
    
    // Candidates
    access_candidate_management: false,
    access_evaluation_boards: false,
    access_probation_dashboard: false,
    
    // Jobs
    access_job_management: false,
    
    // Results & Analytics
    access_results_dashboard: false,
    access_my_tests: false,
    access_results: false,
    
    // Support System
    access_support: false,
    access_admin_support: false,
    
    // Email Management
    access_email_dashboard: false,
    access_email_templates: false,
    access_email_logs: false,
    
    // Role-Specific
    access_supervisor_tests: false,
    access_candidate_tests: false
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchRole = async () => {
      if (isEditMode) {
        try {
          // Changed to use role_id instead of MongoDB _id
          console.log('Fetching role with id:', id);
          const res = await axios.get(`${API_URL}/api/roles/${id}`);
          
          if (res.data.success) {
            const role = res.data.data;
            console.log('Role data from server:', role);
            
            // Create a new object for the form data
            const roleData = {
              role_id: role.role_id,
              role_name: role.role_name,
              description: role.description || '',
              permissions: role.permissions || [],
              role_status: role.role_status,
            };
            
            // Add page access permission booleans only (no more entity permissions)
            pagePermissionGroups.forEach(group => {
              group.permissions.forEach(permission => {
                // Convert to boolean explicitly (true if permission field is true)
                roleData[permission.name] = Boolean(role[permission.name]);
              });
            });
            
            console.log('Transformed role data with page permissions:', roleData);
            setFormData(roleData);
          }
        } catch (error) {
          console.error('Failed to fetch role:', error);
          console.error('Error details:', error.response);
          toast.error('Failed to load role data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchRole();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Changing ${name} to ${type === 'checkbox' ? checked : value}`);
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleGroupSelectAll = (groupName) => {
    const group = pagePermissionGroups.find(g => g.name === groupName);
    if (!group) return;
    
    const allChecked = group.permissions.every(p => formData[p.name]);
    
    const updatedFormData = { ...formData };
    group.permissions.forEach(permission => {
      updatedFormData[permission.name] = !allChecked;
    });
    
    setFormData(updatedFormData);
  };
  
  const handleSelectAllPagePermissions = () => {
    // Check if all page permissions are checked
    const allPagePermissionsChecked = pagePermissionGroups.every(group => 
      group.permissions.every(p => formData[p.name])
    );
    
    // Update all page permissions
    const updatedFormData = { ...formData };
    pagePermissionGroups.forEach(group => {
      group.permissions.forEach(permission => {
        updatedFormData[permission.name] = !allPagePermissionsChecked;
      });
    });
    
    setFormData(updatedFormData);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let res;
      if (isEditMode) {
        // Use role_id for API requests
        console.log('Submitting role update with data:', formData);
        res = await axios.put(`${API_URL}/api/roles/${id}`, formData);
      } else {
        console.log('Submitting new role with data:', formData);
        res = await axios.post(`${API_URL}/api/roles`, formData);
      }
      
      if (res.data.success) {
        // Force all users to update their permissions by setting the timestamp
        const timestamp = Date.now().toString();
        localStorage.setItem('role_update_timestamp', timestamp);
        
        // Broadcast the change to other tabs/windows
        const channel = new BroadcastChannel('role_updates');
        channel.postMessage({ type: 'role_updated', timestamp });
        setTimeout(() => channel.close(), 1000);
        
        // Also refresh current user's permissions immediately
        if (auth.refreshUserPermissions) {
          await auth.refreshUserPermissions();
        }
        
        toast.success(`Role ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/roles');
      } else {
        toast.error(res.data.message || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error.response?.data?.message || 'An error occurred while saving the role');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Edit Role' : 'Create Role'}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          Loading role data...
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={isEditMode ? 'Edit Role' : 'Create Role'}>
      <div className="role-form-container">
        <div 
          className="form-card"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '30px'
          }}
        >
          <form onSubmit={handleSubmit}>
            <div 
              className="form-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}
            >
              {!isEditMode && (
                <div className="form-group">
                  <label 
                    htmlFor="role_id"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Role ID*
                  </label>
                  <input
                    type="number"
                    id="role_id"
                    name="role_id"
                    placeholder="Enter role ID"
                    value={formData.role_id}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <small style={{ color: '#7f8c8d', marginTop: '5px', display: 'block' }}>
                    Use a unique number for this role
                  </small>
                </div>
              )}
              
              <div className="form-group">
                <label 
                  htmlFor="role_name"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  Role Name*
                </label>
                <input
                  type="text"
                  id="role_name"
                  name="role_name"
                  placeholder="Enter role name"
                  value={formData.role_name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label 
                  htmlFor="description"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder="Enter role description"
                  value={formData.description}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label 
                  htmlFor="role_status"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  Status
                </label>
                <select
                  id="role_status"
                  name="role_status"
                  value={formData.role_status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
            
            {/* Page Access Permissions Section */}
            <div className="permission-section" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Page Access Permissions</h3>
                <button
                  type="button"
                  onClick={handleSelectAllPagePermissions}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isEditMode && [1, 3, 4].includes(parseInt(id))}
                >
                  Toggle All Page Permissions
                </button>
              </div>
              
              {pagePermissionGroups.map((group, index) => (
                <div 
                  key={index} 
                  className="permission-group"
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}
                >
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '15px' 
                    }}
                  >
                    <h4 style={{ margin: 0 }}>{group.name}</h4>
                    <button
                      type="button"
                      onClick={() => handleGroupSelectAll(group.name)}
                      style={{
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                      disabled={isEditMode && [1, 3, 4].includes(parseInt(id))}
                    >
                      Toggle Group
                    </button>
                  </div>
                  
                  <div 
                    className="permissions-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '10px'
                    }}
                  >
                    {group.permissions.map((permission, pIndex) => (
                      <div 
                        key={pIndex} 
                        className="permission-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <input
                          type="checkbox"
                          id={permission.name}
                          name={permission.name}
                          checked={formData[permission.name] || false}
                          onChange={handleChange}
                          style={{
                            marginRight: '10px',
                            width: '18px',
                            height: '18px'
                          }}
                          disabled={isEditMode && [1, 3, 4].includes(parseInt(id))}
                        />
                        <label 
                          htmlFor={permission.name}
                          style={{
                            cursor: isEditMode && [1, 3, 4].includes(parseInt(id)) ? 'not-allowed' : 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div 
              className="form-actions"
              style={{
                marginTop: '30px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <Link
                to="/roles"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default RoleForm; 