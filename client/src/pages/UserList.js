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
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const UserList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
  
  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);
  
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/roles`);
      if (res.data.success) {
        const roleMap = {};
        res.data.data.forEach(role => {
          roleMap[role.role_id] = role.role_name;
        });
        setRoles(roleMap);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };
  
    const fetchUsers = async () => {
      try {
      setLoading(true);
        const res = await axios.get(`${API_URL}/api/users`);
      
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
  const handleDeleteClick = (user) => {
    setDeleteDialog({ open: true, userId: user._id });
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, userId: null });
  };

  const handleDeleteConfirm = async () => {
      try {
      const res = await axios.delete(`${API_URL}/api/users/${deleteDialog.userId}`);
        if (res.data.success) {
        setUsers(users.filter(user => user._id !== deleteDialog.userId));
          toast.success('User deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Failed to delete user. Please try again.');
    } finally {
      setDeleteDialog({ open: false, userId: null });
    }
  };
  
  const handleStatusChange = async (user) => {
    try {
      const newStatus = user.user_status === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/users/${user._id}`, {
        user_status: newStatus
      });
      
      if (res.data.success) {
        setUsers(users.map(u => 
          u._id === user._id ? { ...u, user_status: newStatus } : u
        ));
        toast.success(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status. Please try again.');
    }
  };
  
  const handleEditUser = (user) => {
    navigate(`/users/edit/${user._id}`);
  };

  const handleAddUser = () => {
    navigate('/users/create');
  };
  
  const handleBulkImport = () => {
    navigate('/users/import');
  };
  
  // Role helpers
  const getRoleName = (roleId) => {
    return roles[roleId] || 'Unknown';
  };

  const getRoleColor = (roleId) => {
    switch (parseInt(roleId)) {
      case 1:
        return 'error';
      case 2:
        return 'info';
      case 3:
        return 'warning';
      case 4:
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Table columns definition
  const columns = [
    { 
      id: 'username', 
      label: 'Username', 
      accessor: 'username',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'email', 
      label: 'Email', 
      accessor: 'email' 
    },
    { 
      id: 'mobile', 
      label: 'Mobile', 
      accessor: 'mobile_no' 
    },
    { 
      id: 'role', 
      label: 'Role', 
      accessor: row => row.role_name || getRoleName(row.role_id),
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={getRoleColor(row.role_id)}
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.user_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.user_status === 1 ? 'success' : 'error'}
          variant="outlined"
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit User',
      color: 'primary',
      onClick: handleEditUser
    },
    {
      name: 'Status',
      label: row => row.user_status === 1 ? 'Deactivate' : 'Activate', 
      icon: row => row.user_status === 1 ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      tooltip: row => row.user_status === 1 ? 'Deactivate User' : 'Activate User',
      color: row => row.user_status === 1 ? 'warning' : 'success',
      onClick: handleStatusChange
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete User',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="User Management"
          subtitle="View, add, edit, and manage user accounts"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'User Management' }
          ]}
          actionLabel="Add New User"
          actionIcon={<AddIcon />}
          onActionClick={handleAddUser}
          extraActions={[
            {
              label: 'Bulk Import',
              icon: <CloudUploadIcon />,
              onClick: handleBulkImport
            }
          ]}
        />
        
        <DataTable
          columns={columns}
          data={users}
          isLoading={loading}
          title="Users"
          actions={actions}
          onRowClick={handleEditUser}
          searchPlaceholder="Search users..."
          emptyMessage="No users found"
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
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                          Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default UserList; 