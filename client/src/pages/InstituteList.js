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
  School as SchoolIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const InstituteList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, instituteId: null });

  useEffect(() => {
    fetchOrganizations();
    fetchInstitutes();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/organizations`);
      if (res.data.success) {
        setOrganizations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations. Please try again.');
    }
  };

  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/institutes`);
      
      if (res.data.success) {
        setInstitutes(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch institutes:', error);
      toast.error('Failed to load institutes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (institute) => {
    setDeleteDialog({ open: true, instituteId: institute.inst_id });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, instituteId: null });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await axios.delete(`${API_URL}/api/institutes/${deleteDialog.instituteId}`);
        if (res.data.success) {
        setInstitutes(institutes.filter(institute => institute.inst_id !== deleteDialog.instituteId));
          toast.success('Institute deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete institute:', error);
        toast.error('Failed to delete institute. It may have linked departments.');
    } finally {
      setDeleteDialog({ open: false, instituteId: null });
    }
  };
  
  const handleEditInstitute = (institute) => {
    navigate(`/institutes/edit/${institute.inst_id}`);
  };
  
  const handleAddInstitute = () => {
    navigate('/institutes/create');
  };
  
  const handleStatusChange = async (institute) => {
    try {
      const newStatus = institute.inst_status === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/institutes/${institute.inst_id}`, {
        inst_status: newStatus
      });
      
      if (res.data.success) {
        setInstitutes(institutes.map(i => 
          i.inst_id === institute.inst_id ? { ...i, inst_status: newStatus } : i
        ));
        toast.success(`Institute ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update institute status:', error);
      toast.error('Failed to update institute status. Please try again.');
    }
  };

  // Table columns definition
  const columns = [
    { 
      id: 'inst_name', 
      label: 'Name', 
      accessor: 'inst_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'organization_name', 
      label: 'Organization', 
      accessor: row => {
        const org = organizations.find(o => o.org_id === row.org_id);
        return org ? org.org_name : 'N/A';
      },
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.inst_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.inst_status === 1 ? 'success' : 'error'}
          variant={row.inst_status === 1 ? 'filled' : 'outlined'}
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Institute',
      color: 'primary',
      onClick: handleEditInstitute
    },
    {
      name: row => row.inst_status === 1 ? 'Deactivate' : 'Activate',
      icon: row => row.inst_status === 1 ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      tooltip: row => row.inst_status === 1 ? 'Deactivate Institute' : 'Activate Institute',
      color: row => row.inst_status === 1 ? 'warning' : 'success',
      onClick: handleStatusChange
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Institute',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Institutes"
          subtitle={`Manage institute information (${institutes.length})`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Institutes' }
          ]}
          actionLabel="Add New Institute"
          actionIcon={<AddIcon />}
          onActionClick={handleAddInstitute}
        />
        
        <DataTable
          columns={columns}
          data={institutes}
          isLoading={loading}
          title="Institutes"
          actions={actions}
          onRowClick={handleEditInstitute}
          searchPlaceholder="Search institutes..."
          emptyMessage="No institutes found"
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
              Are you sure you want to delete this institute? This action cannot be undone and may affect linked departments.
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

export default InstituteList; 