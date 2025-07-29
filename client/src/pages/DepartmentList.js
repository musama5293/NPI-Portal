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
  Apartment as DepartmentIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const DepartmentList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, deptId: null });

  useEffect(() => {
    fetchOrganizations();
    fetchAllInstitutes();
    fetchDepartments();
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

  const fetchAllInstitutes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/institutes`);
      if (res.data.success) {
        setInstitutes(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch all institutes:', error);
      toast.error('Failed to load institutes. Please try again.');
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/departments`);
      
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (dept) => {
    setDeleteDialog({ open: true, deptId: dept.dept_id });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, deptId: null });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await axios.delete(`${API_URL}/api/departments/${deleteDialog.deptId}`);
        if (res.data.success) {
        setDepartments(departments.filter(dept => dept.dept_id !== deleteDialog.deptId));
          toast.success('Department deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete department:', error);
      toast.error(error.response?.data?.message || 'Failed to delete department. Please try again.');
    } finally {
      setDeleteDialog({ open: false, deptId: null });
    }
  };
  
  const handleEditDepartment = (dept) => {
    navigate(`/departments/edit/${dept.dept_id}`);
  };
  
  const handleAddDepartment = () => {
    navigate('/departments/create');
  };
  
  const handleStatusChange = async (dept) => {
    try {
      const newStatus = dept.dept_status === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/departments/${dept.dept_id}`, {
        dept_status: newStatus
      });
      
      if (res.data.success) {
        setDepartments(departments.map(d => 
          d.dept_id === dept.dept_id ? { ...d, dept_status: newStatus } : d
        ));
        toast.success(`Department ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update department status:', error);
      toast.error('Failed to update department status. Please try again.');
    }
  };

  const getInstName = (instId) => {
    const inst = institutes.find(i => i.inst_id === Number(instId));
    return inst ? inst.inst_name : 'N/A';
  };

  const getInstOrg = (instId) => {
    const inst = institutes.find(i => i.inst_id === Number(instId));
    return inst ? inst.org_id : null;
  };
  
  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.org_id === Number(orgId));
    return org ? org.org_name : 'N/A';
  };

  // Table columns definition
  const columns = [
    { 
      id: 'dept_name', 
      label: 'Name', 
      accessor: 'dept_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'institute_name', 
      label: 'Institute', 
      accessor: row => getInstName(row.inst_id),
    },
    { 
      id: 'organization_name', 
      label: 'Organization', 
      accessor: row => getOrgName(getInstOrg(row.inst_id)),
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.dept_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.dept_status === 1 ? 'success' : 'error'}
          variant={row.dept_status === 1 ? 'filled' : 'outlined'}
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Department',
      color: 'primary',
      onClick: handleEditDepartment
    },
    {
      name: row => row.dept_status === 1 ? 'Deactivate' : 'Activate',
      icon: row => row.dept_status === 1 ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      tooltip: row => row.dept_status === 1 ? 'Deactivate Department' : 'Activate Department',
      color: row => row.dept_status === 1 ? 'warning' : 'success',
      onClick: handleStatusChange
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Department',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Departments"
          subtitle={`Manage department information (${departments.length})`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Departments' }
          ]}
          actionLabel="Add New Department"
          actionIcon={<AddIcon />}
          onActionClick={handleAddDepartment}
        />
        
        <DataTable
          columns={columns}
          data={departments}
          isLoading={loading}
          title="Departments"
          actions={actions}
          onRowClick={handleEditDepartment}
          searchPlaceholder="Search departments..."
          emptyMessage="No departments found"
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
              Are you sure you want to delete this department? This action cannot be undone.
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

export default DepartmentList; 