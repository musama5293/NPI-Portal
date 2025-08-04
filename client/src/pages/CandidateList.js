import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
  Paper,
  Badge,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  ImportExport as ImportExportIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  SupervisorAccount as SupervisorAccountIcon,
  FilterList as FilterListIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const CandidateList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [supervisorModal, setSupervisorModal] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [assigningSupervisor, setAssigningSupervisor] = useState(false);
  const [supervisorMap, setSupervisorMap] = useState({});
  const [filters, setFilters] = useState({
    nationality: '',
    gender: '',
    status: '',
    mode: '',
    org_id: '',
    inst_id: '',
    dept_id: '',
    cat_id: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, candidateId: null });
  const fileInputRef = useRef(null);
  const searchTimeout = useRef(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const debouncedSearch = useCallback((term) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setPagination({ ...pagination, page: 1 });
      fetchCandidates(term);
    }, 500);
  }, [pagination]);

  useEffect(() => {
    fetchCandidates();
    fetchOrganizations();
    fetchAllSupervisors();
    fetchCategories();
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [pagination.page, filters]);

  const fetchAllSupervisors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users?role=supervisor`);
      if (res.data.success) {
        // Create a map of supervisor ID to supervisor name for quick lookup
        const map = {};
        res.data.data.forEach(supervisor => {
          map[supervisor._id] = supervisor.username;
        });
        setSupervisorMap(map);
      }
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/test/categories`);
      if (res.data.success) {
        setCategories(res.data.data.filter(cat => cat.cat_status === 1));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories.');
    }
  };

  const fetchCandidates = async (searchValue = searchTerm) => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const { nationality, gender, status, mode, org_id, inst_id, dept_id, cat_id } = filters;
      
      let url = `${API_URL}/api/candidates?page=${page}&limit=${limit}`;
      
      if (searchValue) {
        // Enhanced search to include CNIC and email fields
        url += `&search=${searchValue}&fields=cand_name,cand_cnic_no,cand_email`;
      }
      
      if (nationality) {
        url += `&nationality=${nationality}`;
      }
      
      if (gender) {
        url += `&gender=${gender}`;
      }
      
      if (status !== '') {
        url += `&status=${status}`;
      }
      
      if (mode) {
        url += `&mode=${mode}`;
      }
      
      if (org_id) {
        url += `&org_id=${org_id}`;
      }
      
      if (inst_id) {
        url += `&inst_id=${inst_id}`;
      }
      
      if (dept_id) {
        url += `&dept_id=${dept_id}`;
      }
      
      if (cat_id) {
        url += `&cat_id=${cat_id}`;
      }
      
      const res = await axios.get(url);
      
      if (res.data.success) {
        setCandidates(res.data.data);
        setPagination({
          ...pagination,
          total: res.data.total,
          totalPages: res.data.totalPages
        });
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      toast.error('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/organizations`);
      if (res.data.success) {
        setOrganizations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations.');
    }
  };
  
  const fetchInstitutes = async (orgId) => {
    try {
      const res = await axios.get(`${API_URL}/api/institutes?org_id=${orgId}`);
      if (res.data.success) {
        setInstitutes(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch institutes:', error);
      toast.error('Failed to load institutes.');
    }
  };
  
  const fetchDepartments = async (instId) => {
    try {
      const res = await axios.get(`${API_URL}/api/departments?inst_id=${instId}`);
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments.');
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'org_id') {
      setFilters({
        ...filters,
        [name]: value,
        inst_id: '',
        dept_id: ''
      });
      
      if (value) {
        fetchInstitutes(value);
        setDepartments([]);
      } else {
        setInstitutes([]);
        setDepartments([]);
      }
    } else if (name === 'inst_id') {
      setFilters({
        ...filters,
        [name]: value,
        dept_id: ''
      });
      
      if (value) {
        fetchDepartments(value);
      } else {
        setDepartments([]);
      }
    } else {
      setFilters({ ...filters, [name]: value });
    }
    
    setPagination({ ...pagination, page: 1 });
  };

  const handleDeleteClick = (candidate) => {
    setDeleteDialog({ open: true, candidateId: candidate._id });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, candidateId: null });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await axios.delete(`${API_URL}/api/candidates/${deleteDialog.candidateId}`);
        if (res.data.success) {
        setCandidates(candidates.filter(candidate => candidate._id !== deleteDialog.candidateId));
          toast.success('Candidate deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete candidate:', error);
        toast.error('Failed to delete candidate. Please try again.');
    } finally {
      setDeleteDialog({ open: false, candidateId: null });
    }
  };

  const handleStatusChange = async (candidate) => {
    try {
      const newStatus = candidate.cand_status === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/candidates/${candidate._id}`, {
        cand_status: newStatus
      });
      
      if (res.data.success) {
        setCandidates(candidates.map(c => 
          c._id === candidate._id ? { ...c, cand_status: newStatus } : c
        ));
        toast.success(`Candidate ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update candidate status:', error);
      toast.error('Failed to update candidate status. Please try again.');
    }
  };

  const handleExport = () => {
    const exportUrl = `${API_URL}/api/candidates/export`;
    
    // Download the file
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', 'candidates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export started. The file will download shortly.');
  };

  const handleImport = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
      const formData = new FormData();
      formData.append('file', file);
      
    try {
      const res = await axios.post(`${API_URL}/api/candidates/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success(`Import successful. ${res.data.importedCount} candidates imported.`);
        fetchCandidates();
      }
    } catch (error) {
      console.error('Failed to import candidates:', error);
      toast.error('Failed to import candidates. Please check your file and try again.');
    }
    
    // Reset the file input
    e.target.value = null;
  };

  const handleViewCandidate = (candidate) => {
    navigate(`/candidates/profile/${candidate._id}`);
  };

  const handleEditCandidate = (candidate) => {
    // Check if the candidate has a user_account field and navigate to the user edit page
    if (candidate.user_account) {
      navigate(`/users/edit/${candidate.user_account}`);
    } else {
      // Fallback to candidate edit page if user_account doesn't exist
      navigate(`/candidates/edit/${candidate._id}`);
    }
  };

  const handleAddCandidate = () => {
    navigate('/candidates/create');
  };

  const handleAssignTest = (candidate) => {
    navigate(`/test-assignments/create?candidateId=${candidate._id}`);
  };

  const getNationalityName = (nationality) => {
    switch (Number(nationality)) {
      case 1:
        return 'Pakistani';
      case 2:
        return 'Overseas Pakistani';
      case 3:
        return 'Foreign';
      default:
        return 'Unknown';
    }
  };

  const getGenderName = (gender) => {
    switch (gender) {
      case 'M':
        return 'Male';
      case 'F':
        return 'Female';
      case 'O':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const getModeName = (mode) => {
    switch (mode) {
      case 'R':
        return 'Regular';
      case 'C':
        return 'Contract';
      case 'T':
        return 'Temporary';
      case 'P':
        return 'Part-time';
      default:
        return 'Unknown';
    }
  };

  const getHiringStatusName = (status) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'screening':
        return 'Screening';
      case 'interview':
        return 'Interview';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Rejected';
      case 'hired':
        return 'Hired';
      default:
        return 'Unknown';
    }
  };

  const getHiringStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'info';
      case 'screening':
        return 'info';
      case 'interview':
        return 'warning';
      case 'selected':
        return 'success';
      case 'rejected':
        return 'error';
      case 'hired':
        return 'success';
      default:
        return 'default';
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users?role_id=3`);
      if (res.data.success) {
        setSupervisors(res.data.data.filter(user => user.user_status === 1));
      }
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
      toast.error('Failed to load supervisors.');
    }
  };

  const handleCandidateSelect = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
      } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
      }
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(candidate => candidate._id));
    }
  };

  const openSupervisorModal = () => {
    if (selectedCandidates.length === 0) {
      toast.error('Please select at least one candidate.');
      return;
    }
    
    fetchSupervisors();
    setSupervisorModal(true);
  };

  const assignSupervisor = async () => {
    if (!selectedSupervisor) {
      toast.error('Please select a supervisor.');
      return;
    }

    setAssigningSupervisor(true);
    
    try {
      const res = await axios.post(`${API_URL}/api/candidates/assign-supervisor`, {
        candidateIds: selectedCandidates,
        supervisorId: selectedSupervisor
      });

      if (res.data.success) {
        setCandidates(candidates.map(candidate => {
          if (selectedCandidates.includes(candidate._id)) {
            return { ...candidate, supervisor_id: selectedSupervisor };
          }
          return candidate;
        }));
        
        toast.success('Supervisor assigned successfully.');
        setSupervisorModal(false);
        setSelectedCandidates([]);
        setSelectedSupervisor('');
      }
    } catch (error) {
      console.error('Failed to assign supervisor:', error);
      toast.error('Failed to assign supervisor. Please try again.');
    } finally {
      setAssigningSupervisor(false);
    }
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Define columns for the DataTable
  const columns = [
    { 
      id: 'name', 
      label: 'Name', 
      accessor: 'cand_name',
      render: (value, row) => (
        <Box sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="medium">
            {value}
          </Typography>
          {row.supervisor_id && (
            <Tooltip title={`Supervisor: ${supervisorMap[row.supervisor_id] || 'Unknown'}`}>
              <Badge 
                color="info" 
                variant="dot" 
                sx={{ ml: 1 }}
              />
            </Tooltip>
          )}
        </Box>
      )
    },
    { 
      id: 'cnic', 
      label: 'CNIC', 
      accessor: 'cand_cnic_no' 
    },
    { 
      id: 'email', 
      label: 'Email', 
      accessor: 'cand_email' 
    },
    { 
      id: 'gender', 
      label: 'Gender', 
      accessor: row => getGenderName(row.cand_gender),
      render: (value) => (
        <Chip 
          label={value}
          size="small"
          variant="outlined"
          color={value === 'Male' ? 'primary' : value === 'Female' ? 'secondary' : 'default'}
        />
      )
    },
    { 
      id: 'type', 
      label: 'Type', 
      accessor: row => {
        const type = row.candidate_type;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
      render: (value, row) => {
        let color;
        switch (row.candidate_type) {
          case 'initial':
            color = 'info';
            break;
          case 'probation':
            color = 'warning';
            break;
          case 'hired':
            color = 'success';
            break;
          case 'resigned':
          case 'terminated':
            color = 'error';
            break;
          default:
            color = 'default';
        }
  return (
          <Chip 
            label={value}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      }
    }
  ];

  const bulkActions = selectedCandidates.length > 0 ? [
    {
      name: 'Assign Supervisor',
      icon: <SupervisorAccountIcon fontSize="small" />,
      onClick: openSupervisorModal,
      color: 'primary'
    }
  ] : [];

  const actions = [
    {
      name: 'Assign Test',
      icon: <AssignmentIcon fontSize="small" />,
      tooltip: 'Assign Test',
      color: 'info',
      onClick: handleAssignTest
    },
    {
      name: row => row.cand_status === 1 ? 'Deactivate' : 'Activate',
      icon: row => row.cand_status === 1 ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      tooltip: row => row.cand_status === 1 ? 'Deactivate Candidate' : 'Activate Candidate',
      color: row => row.cand_status === 1 ? 'warning' : 'success',
      onClick: handleStatusChange
    },
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Candidate',
      color: 'primary',
      onClick: handleEditCandidate
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Candidate',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Candidates"
          subtitle="View, add, and manage candidates in the system"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Candidates' }
          ]}
          actionLabel="Add New Candidate"
          actionIcon={<AddIcon />}
          onActionClick={handleAddCandidate}
          extraActions={[
            {
              label: 'Bulk Import',
              icon: <CloudUploadIcon />,
              onClick: handleImport
            }
          ]}
        />

        {/* Advanced Filters Section */}
        <Paper 
          elevation={2} 
          sx={{ 
            mb: 2, 
            overflow: 'hidden', 
            transition: 'max-height 0.3s ease-in-out',
            maxHeight: filtersVisible ? '500px' : '56px',
          }}
        >
          <Box 
            sx={{ 
              p: 2, 
            display: 'flex',
              justifyContent: 'space-between', 
            alignItems: 'center',
              borderBottom: filtersVisible ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.background.paper,
              cursor: 'pointer'
            }}
            onClick={toggleFilters}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Advanced Filters
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                {Object.values(filters).filter(Boolean).length} filters applied
              </Typography>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters({
                    nationality: '',
                    gender: '',
                    status: '',
                    mode: '',
                    org_id: '',
                    inst_id: '',
                    dept_id: '',
                    cat_id: ''
                  });
                  setPagination({ ...pagination, page: 1 });
                }}
                disabled={!Object.values(filters).some(Boolean)}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        
        {filtersVisible && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Nationality</InputLabel>
                    <Select
                      name="nationality"
                      value={filters.nationality}
                      onChange={handleFilterChange}
                      label="Nationality"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="1">Pakistani</MenuItem>
                      <MenuItem value="2">Overseas Pakistani</MenuItem>
                      <MenuItem value="3">Foreign</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={filters.gender}
                      onChange={handleFilterChange}
                      label="Gender"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="M">Male</MenuItem>
                      <MenuItem value="F">Female</MenuItem>
                      <MenuItem value="O">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      label="Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="1">Active</MenuItem>
                      <MenuItem value="0">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Mode</InputLabel>
                    <Select
                      name="mode"
                      value={filters.mode}
                      onChange={handleFilterChange}
                      label="Mode"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="R">Regular</MenuItem>
                      <MenuItem value="C">Contract</MenuItem>
                      <MenuItem value="T">Temporary</MenuItem>
                      <MenuItem value="P">Part-time</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Organization</InputLabel>
                    <Select
                name="org_id"
                value={filters.org_id}
                onChange={handleFilterChange}
                      label="Organization"
                    >
                      <MenuItem value="">All</MenuItem>
                {organizations.map(org => (
                        <MenuItem key={org.org_id} value={org.org_id}>
                    {org.org_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl 
                    fullWidth 
                    size="small"
                    disabled={!filters.org_id || institutes.length === 0}
                  >
                    <InputLabel>Institute</InputLabel>
                    <Select
                name="inst_id"
                value={filters.inst_id}
                onChange={handleFilterChange}
                      label="Institute"
                    >
                      <MenuItem value="">All</MenuItem>
                {institutes.map(inst => (
                        <MenuItem key={inst.inst_id} value={inst.inst_id}>
                    {inst.inst_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl 
                    fullWidth 
                    size="small"
                    disabled={!filters.inst_id || departments.length === 0}
                  >
                    <InputLabel>Department</InputLabel>
                    <Select
                name="dept_id"
                value={filters.dept_id}
                onChange={handleFilterChange}
                      label="Department"
                    >
                      <MenuItem value="">All</MenuItem>
                {departments.map(dept => (
                        <MenuItem key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                  name="cat_id"
                  value={filters.cat_id}
                  onChange={handleFilterChange}
                      label="Category"
                    >
                      <MenuItem value="">All</MenuItem>
                  {categories.map(cat => (
                        <MenuItem key={cat.cat_id} value={cat.cat_id}>
                      {cat.cat_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
        
        {/* Data Table with Export/Import Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={handleExport}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            {/* Keep the hidden file input for bulk import */}
            <input
              type="file"
              accept=".csv, .xlsx"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </Box>
        </Box>

        <DataTable
          columns={columns}
          data={candidates}
          isLoading={loading}
          title="Candidates"
          actions={actions}
          bulkActions={bulkActions}
          onRowClick={handleViewCandidate}
          searchPlaceholder="Search by name, CNIC, or email..."
          emptyMessage="No candidates found"
          containerProps={{ elevation: 2 }}
          selectable
          selectedItems={selectedCandidates}
          onSelectItem={handleCandidateSelect}
          onSelectAll={handleSelectAll}
          onSearch={handleSearchChange}
          initialSearchTerm={searchTerm}
          pagination={{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            onPageChange: (page) => setPagination({ ...pagination, page }),
            onLimitChange: (limit) => setPagination({ ...pagination, limit, page: 1 })
          }}
        />
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this candidate? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Supervisor Assignment Dialog */}
        <Dialog
          open={supervisorModal}
          onClose={() => setSupervisorModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign Supervisor</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Assign a supervisor to {selectedCandidates.length} selected candidate{selectedCandidates.length > 1 ? 's' : ''}.
            </DialogContentText>
            
            <TextField
              fullWidth
              label="Search supervisors"
              variant="outlined"
              value={supervisorSearchTerm}
              onChange={(e) => {
                setSupervisorSearchTerm(e.target.value);
                fetchSupervisors();
              }}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Box sx={{ maxHeight: 250, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 1 }}>
              {supervisors.length > 0 ? (
                supervisors.map(supervisor => (
                  <Box
                    key={supervisor._id}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
                      backgroundColor: selectedSupervisor === supervisor._id ? theme.palette.action.selected : 'transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      },
                      mb: 0.5
                    }}
                    onClick={() => setSelectedSupervisor(supervisor._id)}
                  >
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.primary.main, 
                        color: theme.palette.primary.contrastText,
                      display: 'flex',
                      alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1
                      }}
                    >
                      {supervisor.username.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={selectedSupervisor === supervisor._id ? 'bold' : 'normal'}>
                        {supervisor.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {supervisor.email}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                  No supervisors found
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSupervisorModal(false)}>
                Cancel
            </Button>
            <Button 
                onClick={assignSupervisor}
              color="primary" 
              variant="contained"
              disabled={!selectedSupervisor || assigningSupervisor}
            >
              {assigningSupervisor ? <CircularProgress size={24} /> : 'Assign'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default CandidateList; 