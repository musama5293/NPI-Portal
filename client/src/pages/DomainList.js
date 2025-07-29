import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import { getDomains, deleteDomain } from '../utils/api';

const DomainList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, domain: null });
  
  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const response = await getDomains();
      setDomains(response.data.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
      toast.error('Failed to load domains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (domain) => {
    navigate(`/domains/edit/${domain.domain_id}`);
  };

  const handleAdd = () => {
    navigate('/domains/create');
  };

  const handleDeleteClick = (domain) => {
    setDeleteDialog({ open: true, domain });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, domain: null });
  };

  const handleDeleteConfirm = async () => {
    const { domain } = deleteDialog;
    if (!domain) return;
    
    try {
      await deleteDomain(domain.domain_id);
      toast.success(`Domain "${domain.domain_name}" deleted successfully`);
      loadDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      toast.error(
        err.response?.data?.message || 
        'Failed to delete domain. It might be in use by subdomains or questions.'
      );
    } finally {
      setDeleteDialog({ open: false, domain: null });
    }
  };

  // Table columns definition
  const columns = [
    { 
      id: 'domain_id', 
      label: 'ID', 
      accessor: 'domain_id' 
    },
    { 
      id: 'domain_name', 
      label: 'Domain Name', 
      accessor: 'domain_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'description', 
      label: 'Description', 
      accessor: 'description',
      render: (value) => value || '-'
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.domain_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.domain_status === 1 ? 'success' : 'error'}
          variant="outlined"
          icon={row.domain_status === 1 ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Domain',
      color: 'primary',
      onClick: handleEdit
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Domain',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Domain Management"
          subtitle="View, add and manage personality assessment domains"
          breadcrumbs={[
            { label: 'Personality Assessment' },
            { label: 'Domains' }
          ]}
          actionLabel="Add New Domain"
          actionIcon={<AddIcon />}
          onActionClick={handleAdd}
        />
        
        <DataTable
          columns={columns}
          data={domains}
          isLoading={loading}
          title="Domains"
          actions={actions}
          onRowClick={handleEdit}
          searchPlaceholder="Search domains..."
          emptyMessage="No domains found. Create your first domain!"
          getRowId={(row) => row.domain_id}
          defaultSortColumn="domain_id"
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
              Are you sure you want to delete the domain "{deleteDialog.domain?.domain_name}"?
              This action cannot be undone, and will also delete all associated data.
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

export default DomainList;