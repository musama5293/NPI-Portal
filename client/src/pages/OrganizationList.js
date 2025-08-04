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
  Business as BusinessIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const OrganizationList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, orgId: null });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/organizations`);
      
      if (res.data.success) {
        setOrganizations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (org) => {
    setDeleteDialog({ open: true, orgId: org.org_id });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, orgId: null });
  };

  const handleDeleteConfirm = async () => {
      try {
      const res = await axios.delete(`${API_URL}/api/organizations/${deleteDialog.orgId}`);
        if (res.data.success) {
        setOrganizations(organizations.filter(org => org.org_id !== deleteDialog.orgId));
          toast.success('Organization deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete organization:', error);
        toast.error('Failed to delete organization. It may have linked institutes or departments.');
    } finally {
      setDeleteDialog({ open: false, orgId: null });
    }
  };

  const handleEditOrg = (org) => {
    navigate(`/organizations/edit/${org.org_id}`);
  };

  const handleAddOrg = () => {
    navigate('/organizations/create');
  };

  const handleStatusChange = async (org) => {
    try {
      const newStatus = org.status === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/organizations/${org.org_id}`, {
        status: newStatus
      });
      
      if (res.data.success) {
        setOrganizations(organizations.map(o => 
          o.org_id === org.org_id ? { ...o, status: newStatus } : o
        ));
        toast.success(`Organization ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update organization status:', error);
      toast.error('Failed to update organization status. Please try again.');
    }
  };

  // Table columns definition
  const columns = [
    { 
      id: 'org_name', 
      label: 'Name', 
      accessor: 'org_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.status === 1 ? 'success' : 'error'}
          variant={row.status === 1 ? 'filled' : 'outlined'}
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Organization',
      color: 'primary',
      onClick: handleEditOrg
    },
    {
      name: row => row.status === 1 ? 'Deactivate' : 'Activate',
      icon: row => row.status === 1 ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      tooltip: row => row.status === 1 ? 'Deactivate Organization' : 'Activate Organization',
      color: row => row.status === 1 ? 'warning' : 'success',
      onClick: handleStatusChange
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Organization',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Organizations"
          subtitle={`Manage organization information (${organizations.length})`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Organizations' }
          ]}
          actionLabel="Add New Organization"
          actionIcon={<AddIcon />}
          onActionClick={handleAddOrg}
        />
        
        <DataTable
          columns={columns}
          data={organizations}
          isLoading={loading}
          title="Organizations"
          actions={actions}
          onRowClick={handleEditOrg}
          searchPlaceholder="Search organizations..."
          emptyMessage="No organizations found"
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
              Are you sure you want to delete this organization? This action cannot be undone and may affect linked institutes and departments.
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

export default OrganizationList; 