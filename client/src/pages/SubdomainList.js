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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import { getSubdomains, deleteSubdomain, getDomains } from '../utils/api';

const SubdomainList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [subdomains, setSubdomains] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subdomain: null });

  useEffect(() => {
    loadDomains();
    loadSubdomains();
  }, []);

  useEffect(() => {
    loadSubdomains(selectedDomain);
  }, [selectedDomain]);

  const loadDomains = async () => {
    try {
      const response = await getDomains();
      setDomains(response.data.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
      toast.error('Failed to load domains');
    }
  };

  const loadSubdomains = async (domainId = null) => {
    try {
      setLoading(true);
      const response = await getSubdomains(domainId);
      setSubdomains(response.data.data);
    } catch (err) {
      console.error('Error fetching subdomains:', err);
      toast.error('Failed to load subdomains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value);
  };

  const handleEdit = (subdomain) => {
    navigate(`/subdomains/edit/${subdomain.subdomain_id}`);
  };

  const handleAdd = () => {
    navigate('/subdomains/create');
  };

  const handleDeleteClick = (subdomain) => {
    setDeleteDialog({ open: true, subdomain });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, subdomain: null });
  };

  const handleDeleteConfirm = async () => {
    const { subdomain } = deleteDialog;
    if (!subdomain) return;
    
    try {
      await deleteSubdomain(subdomain.subdomain_id);
      toast.success(`Subdomain "${subdomain.subdomain_name}" deleted successfully`);
      loadSubdomains(selectedDomain);
    } catch (err) {
      console.error('Error deleting subdomain:', err);
      toast.error(
        err.response?.data?.message || 
        'Failed to delete subdomain. It might be in use by questions.'
      );
    } finally {
      setDeleteDialog({ open: false, subdomain: null });
    }
  };

  const handleClearFilter = () => {
    setSelectedDomain('');
  };

  // Table columns definition
  const columns = [
    { 
      id: 'subdomain_id', 
      label: 'ID', 
      accessor: 'subdomain_id' 
    },
    { 
      id: 'subdomain_name', 
      label: 'Subdomain Name', 
      accessor: 'subdomain_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500 }}>{value}</Box>
      )
    },
    { 
      id: 'domain', 
      label: 'Domain', 
      accessor: row => row.domain?.domain_name || '-',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
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
      accessor: row => row.subdomain_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          size="small"
          color={row.subdomain_status === 1 ? 'success' : 'error'}
          variant="outlined"
          icon={row.subdomain_status === 1 ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
        />
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Subdomain',
      color: 'primary',
      onClick: handleEdit
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Subdomain',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Subdomain Management"
          subtitle="View, add and manage personality assessment subdomains"
          breadcrumbs={[
            { label: 'Personality Assessment' },
            { label: 'Subdomains' }
          ]}
          actionLabel="Add New Subdomain"
          actionIcon={<AddIcon />}
          onActionClick={handleAdd}
        />
        
        {/* Filter Panel */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FilterIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
            <InputLabel id="domain-filter-label">Filter by Domain</InputLabel>
            <Select
              labelId="domain-filter-label"
              value={selectedDomain}
              onChange={handleDomainChange}
              label="Filter by Domain"
            >
              <MenuItem value="">
                <em>All Domains</em>
              </MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.domain_id} value={domain.domain_id}>
                  {domain.domain_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
            </Grid>
            <Grid item>
            <Button 
              variant="outlined" 
                size="small"
                onClick={handleClearFilter}
                disabled={!selectedDomain}
              >
                Clear Filter
            </Button>
            </Grid>
          </Grid>
          </Paper>
        
        <DataTable
          columns={columns}
          data={subdomains}
          isLoading={loading}
          title="Subdomains"
          actions={actions}
          onRowClick={handleEdit}
          searchPlaceholder="Search subdomains..."
          emptyMessage={selectedDomain 
            ? "No subdomains found for this domain. Try a different domain filter or create a new subdomain."
            : "No subdomains found. Create your first subdomain!"}
          getRowId={(row) => row.subdomain_id}
          defaultSortColumn="subdomain_id"
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
              Are you sure you want to delete the subdomain "{deleteDialog.subdomain?.subdomain_name}"?
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

export default SubdomainList; 