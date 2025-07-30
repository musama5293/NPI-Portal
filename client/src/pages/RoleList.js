import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as RoleIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const RoleList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, roleId: null });
  
  useEffect(() => {
    fetchRoles();
  }, []);
  
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/roles`);
      
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteClick = (role) => {
    if (role.role_id === 1 || role.role_id === 2) {
      toast.error('Cannot delete system roles');
      return;
    }
    setDeleteDialog({ open: true, roleId: role.role_id });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, roleId: null });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await axios.delete(`${API_URL}/api/roles/${deleteDialog.roleId}`);
        if (res.data.success) {
        setRoles(roles.filter(role => role.role_id !== deleteDialog.roleId));
          toast.success('Role deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete role:', error);
        toast.error(error.response?.data?.message || 'Failed to delete role. Please try again.');
    } finally {
      setDeleteDialog({ open: false, roleId: null });
    }
  };
  
  const handleStatusChange = async (role) => {
    if (role.role_id === 1) {
      toast.error('Cannot change status of admin role');
      return;
    }
    
    try {
      const newStatus = role.role_status === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/roles/${role.role_id}`, {
        role_status: newStatus
      });
      
      if (res.data.success) {
        setRoles(roles.map(r => 
          r.role_id === role.role_id ? { ...r, role_status: newStatus } : r
        ));
        toast.success(`Role ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update role status:', error);
      toast.error(error.response?.data?.message || 'Failed to update role status. Please try again.');
    }
  };
  
  const handleEditRole = (role) => {
    navigate(`/roles/edit/${role.role_id}`);
  };
  
  const handleAddRole = () => {
    navigate('/roles/create');
  };
  
  // Format permissions for display
  const formatPermissions = (role) => {
    // Count the number of entity permissions enabled
    let entityCount = 0;
    
    permissionGroups.forEach(group => {
      group.permissions.forEach(permission => {
        if (role[permission.name]) {
          entityCount++;
        }
      });
    });
    
    // Count the number of page permissions enabled
    let pageCount = 0;
    pagePermissionGroups && pagePermissionGroups.forEach(group => {
      group.permissions.forEach(permission => {
        if (role[permission.name]) {
          pageCount++;
        }
      });
    });
    
    const totalEntityPermissions = 28; // Total number of entity permissions
    const totalPagePermissions = 22; // Total number of page permissions
    
    if (entityCount === 0 && pageCount === 0) return 'None';
    
    // If it's the admin role (role_id 1), or all permissions are enabled
    if (role.role_id === 1) {
      return 'All Permissions';
    }
    
    // For supervisor (role_id 3) and candidate (role_id 4), show restricted permissions
    if (role.role_id === 3) {
      return 'Supervisor Permissions';
    }
    
    if (role.role_id === 4) {
      return 'Candidate Permissions';
    }
    
    // Otherwise, show a count
    return `${entityCount}/${totalEntityPermissions} entity, ${pageCount}/${totalPagePermissions} page permissions`;
  };

  // Table columns definition
  const columns = [
    { 
      id: 'role_name', 
      label: 'Role Name', 
      accessor: 'role_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'description', 
      label: 'Description', 
      accessor: 'description',
      render: (value) => value || 'No description'
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      accessor: formatPermissions
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.role_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.role_status === 1 ? 'success' : 'error'}
          variant={row.role_status === 1 ? 'filled' : 'outlined'}
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Role',
      color: 'primary',
      onClick: handleEditRole,
      hide: row => false // Allow viewing all roles, even core roles
    },
    {
      name: 'Toggle Status',
      label: row => row.role_status === 1 ? 'Deactivate' : 'Activate',
      icon: row => row.role_status === 1 ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      tooltip: row => row.role_status === 1 ? 'Deactivate Role' : 'Activate Role',
      color: row => row.role_status === 1 ? 'warning' : 'success',
      onClick: handleStatusChange,
      hide: row => [1, 3, 4].includes(row.role_id) // Don't allow status change for core roles
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Role',
      color: 'error',
      onClick: handleDeleteClick,
      hide: row => [1, 3, 4].includes(row.role_id) // Don't allow deletion for core roles
    }
  ];
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Role Management"
          subtitle={`Manage user roles and permissions (${roles.length})`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Role Management' }
          ]}
          actionLabel="Add New Role"
          actionIcon={<AddIcon />}
          onActionClick={handleAddRole}
        />
        
        <DataTable
          columns={columns}
          data={roles}
          isLoading={loading}
          title="Roles"
          actions={actions}
          onRowClick={handleEditRole}
          searchPlaceholder="Search roles..."
          emptyMessage="No roles found"
          containerProps={{ elevation: 2 }}
        />
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this role? This action cannot be undone and may affect users assigned to this role.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error">
                                Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

// Define permission groups just for display purposes
const permissionGroups = [
  {
    name: 'Users',
    permissions: [
      { name: 'can_view_users', label: 'View Users' },
      { name: 'can_create_users', label: 'Create Users' },
      { name: 'can_update_users', label: 'Update Users' },
      { name: 'can_delete_users', label: 'Delete Users' }
    ]
  },
  {
    name: 'Roles',
    permissions: [
      { name: 'can_view_roles', label: 'View Roles' },
      { name: 'can_create_roles', label: 'Create Roles' },
      { name: 'can_update_roles', label: 'Update Roles' },
      { name: 'can_delete_roles', label: 'Delete Roles' }
    ]
  },
  {
    name: 'Organizations',
    permissions: [
      { name: 'can_view_organizations', label: 'View Organizations' },
      { name: 'can_create_organizations', label: 'Create Organizations' },
      { name: 'can_update_organizations', label: 'Update Organizations' },
      { name: 'can_delete_organizations', label: 'Delete Organizations' }
    ]
  },
  {
    name: 'Institutes',
    permissions: [
      { name: 'can_view_institutes', label: 'View Institutes' },
      { name: 'can_create_institutes', label: 'Create Institutes' },
      { name: 'can_update_institutes', label: 'Update Institutes' },
      { name: 'can_delete_institutes', label: 'Delete Institutes' }
    ]
  },
  {
    name: 'Departments',
    permissions: [
      { name: 'can_view_departments', label: 'View Departments' },
      { name: 'can_create_departments', label: 'Create Departments' },
      { name: 'can_update_departments', label: 'Update Departments' },
      { name: 'can_delete_departments', label: 'Delete Departments' }
    ]
  },
  {
    name: 'Candidates',
    permissions: [
      { name: 'can_view_candidates', label: 'View Candidates' },
      { name: 'can_create_candidates', label: 'Create Candidates' },
      { name: 'can_update_candidates', label: 'Update Candidates' },
      { name: 'can_delete_candidates', label: 'Delete Candidates' }
    ]
  },
  {
    name: 'Tests',
    permissions: [
      { name: 'can_view_tests', label: 'View Tests' },
      { name: 'can_create_tests', label: 'Create Tests' },
      { name: 'can_update_tests', label: 'Update Tests' },
      { name: 'can_delete_tests', label: 'Delete Tests' }
    ]
  }
];

// Page permission groups for display purposes
const pagePermissionGroups = [
  {
    name: 'Common Pages',
    permissions: [
      { name: 'access_dashboard', label: 'Access Dashboard' },
      { name: 'access_user_profile', label: 'Access User Profile' },
      { name: 'access_take_test', label: 'Access Test Taking Interface' },
    ]
  },
  {
    name: 'Administration Pages',
    permissions: [
      { name: 'access_user_management', label: 'Access User Management' },
      { name: 'access_role_management', label: 'Access Role Management' },
      { name: 'access_organization_management', label: 'Access Organization Management' },
      { name: 'access_institute_management', label: 'Access Institute Management' },
      { name: 'access_department_management', label: 'Access Department Management' },
    ]
  },
  {
    name: 'Assessment Pages',
    permissions: [
      { name: 'access_test_management', label: 'Access Test Management' },
      { name: 'access_category_management', label: 'Access Category Management' },
      { name: 'access_test_assignment', label: 'Access Test Assignment' },
      { name: 'access_domain_management', label: 'Access Domain Management' },
      { name: 'access_subdomain_management', label: 'Access Subdomain Management' },
      { name: 'access_question_management', label: 'Access Question Management' },
    ]
  },
  {
    name: 'Candidate Pages',
    permissions: [
      { name: 'access_candidate_management', label: 'Access Candidate Management' },
      { name: 'access_evaluation_boards', label: 'Access Evaluation Boards' },
      { name: 'access_probation_dashboard', label: 'Access Probation Dashboard' },
    ]
  },
  {
    name: 'Job Pages',
    permissions: [
      { name: 'access_job_management', label: 'Access Job Management' },
    ]
  },
  {
    name: 'Role-Specific Pages',
    permissions: [
      { name: 'access_supervisor_tests', label: 'Access Supervisor Feedback Forms' },
      { name: 'access_my_tests', label: 'Access My Assessments' },
      { name: 'access_results', label: 'Access Results' },
    ]
  }
];

export default RoleList; 