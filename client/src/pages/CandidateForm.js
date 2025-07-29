import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import FormLayout from '../components/common/FormLayout';
import { 
  FormTextField, 
  FormSelectField, 
  FormDatePicker,
  FormSection 
} from '../components/common/FormFields';
import { 
  Box, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography, 
  Grid, 
  Paper, 
  CircularProgress, 
  Chip,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  Alert,
  TextField,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import { 
  Person as PersonIcon,
  Save as SaveIcon,
  Work as WorkIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { 
  getCandidate, 
  createCandidate, 
  updateCandidate, 
  getJobs, 
  getOrganizations, 
  getInstitutes, 
  getDepartments,
  getCategories
} from '../utils/api';
import CandidateStatusModal from '../components/CandidateStatusModal';

const API_URL = 'http://localhost:5000';

// Component to display credentials in a modal
const CredentialsModal = ({ credentials, onClose }) => {
  const theme = useTheme();
  
  if (!credentials) return null;
  const { username, password, email } = credentials;
  
  return (
    <Dialog 
      open={Boolean(credentials)} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: theme.palette.success.main }}>
        Candidate Account Created!
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontWeight: 'bold', mb: 2 }}>
          The candidate's login credentials are:
        </DialogContentText>
        
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'background.default', 
            p: 2, 
            mb: 2, 
            border: 1, 
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Username:</Grid>
            <Grid item xs={8} sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{username}</Grid>
            
            <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Password:</Grid>
            <Grid item xs={8} sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{password}</Grid>
            
            <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Email:</Grid>
            <Grid item xs={8} sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{email}</Grid>
          </Grid>
        </Paper>
        
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            IMPORTANT: Please note down these credentials. They will not be shown again.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button 
          variant="contained" 
          color="primary" 
            onClick={onClose}
          >
            I've Saved These Credentials
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CandidateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    cand_name: '',
    cand_cnic_no: '',
    temp_cand_cnic_no: '',
    cand_mobile_no: '',
    cand_whatsapp_no: '',
    cand_email: '',
    cand_gender: '',
    cand_remarks: '',
    cand_status: 1,
    cand_nationality: 1,
    cand_mode: 'R',
    candidate_type: 'initial',
    probation_end_date: '',
    date_of_birth: '',
    org_id: '',
    inst_id: '',
    dept_id: '',
    cat_id: '',
    job_id: '',
    applied_job_id: '',
    current_job_id: '',
    hiring_status: 'applied',
    supervisor_id: ''
  });
  
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // New state for employment history
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState({
    open: false,
    date: new Date(),
    status: '',
    remarks: ''
  });
  
  useEffect(() => {
    const fetchCandidate = async () => {
      if (isEditMode) {
        try {
          const res = await axios.get(`${API_URL}/api/candidates/${id}`);
          if (res.data.success) {
            const candidate = res.data.data;
            
            // Format date fields
            const formattedData = {
              ...candidate,
              date_of_birth: candidate.date_of_birth ? new Date(candidate.date_of_birth) : '',
              probation_end_date: candidate.probation_end_date ? new Date(candidate.probation_end_date) : ''
            };
            
            // Ensure we have numeric IDs
            if (typeof formattedData.org_id === 'object' && formattedData.org_id !== null) {
              formattedData.org_id = formattedData.org_id.org_id || '';
            }
            
            if (typeof formattedData.inst_id === 'object' && formattedData.inst_id !== null) {
              formattedData.inst_id = formattedData.inst_id.inst_id || '';
            }
            
            if (typeof formattedData.dept_id === 'object' && formattedData.dept_id !== null) {
              formattedData.dept_id = formattedData.dept_id.dept_id || '';
            }
            
            if (typeof formattedData.cat_id === 'object' && formattedData.cat_id !== null) {
              formattedData.cat_id = formattedData.cat_id.cat_id || '';
            }
            
            if (typeof formattedData.job_id === 'object' && formattedData.job_id !== null) {
              formattedData.job_id = formattedData.job_id.job_id || '';
            }
            
            if (typeof formattedData.applied_job_id === 'object' && formattedData.applied_job_id !== null) {
              formattedData.applied_job_id = formattedData.applied_job_id.job_id || '';
            }
            
            if (typeof formattedData.current_job_id === 'object' && formattedData.current_job_id !== null) {
              formattedData.current_job_id = formattedData.current_job_id.job_id || '';
            }
            
            setFormData(formattedData);
            
            // Fetch dependent data
            if (formattedData.org_id) {
              fetchInstitutes(formattedData.org_id);
            }
            
            if (formattedData.inst_id) {
              fetchDepartments(formattedData.inst_id);
            }
            
            // Fetch employment history
            if (isEditMode) {
              fetchEmploymentHistory();
            }
          }
        } catch (error) {
          console.error('Failed to fetch candidate:', error);
          setError('Failed to load candidate data. Please try again.');
          toast.error('Failed to load candidate data.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    // Load initial data
    fetchCandidate();
    fetchOrganizations();
    fetchJobs();
    fetchCategories();
    fetchSupervisors();
  }, [id, isEditMode]);
  
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
      // Ensure we're using the numeric org_id, not the object
      const orgIdValue = typeof orgId === 'object' && orgId !== null ? 
        (orgId.org_id || 0) : Number(orgId);
        
      const res = await axios.get(`${API_URL}/api/institutes?org_id=${orgIdValue}`);
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
      // Ensure we're using the numeric inst_id, not the object
      const instIdValue = typeof instId === 'object' && instId !== null ? 
        (instId.inst_id || 0) : Number(instId);
        
      const res = await axios.get(`${API_URL}/api/departments?inst_id=${instIdValue}`);
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments.');
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
  
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs`);
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs.');
    }
  };
  
  const fetchSupervisors = async () => {
    try {
      // Fetch users who could be supervisors (you might want to filter by role)
      const res = await axios.get(`${API_URL}/api/users`);
      if (res.data.success) {
        setSupervisors(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
      toast.error('Failed to load supervisors.');
    }
  };
  
  const fetchEmploymentHistory = async () => {
    if (!id) return;
    
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_URL}/api/candidates/${id}/employment-history`);
      if (res.data.success) {
        // Sort by date descending
        const sortedHistory = res.data.data.sort((a, b) => 
          new Date(b.change_date) - new Date(a.change_date)
        );
        setEmploymentHistory(sortedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch employment history:', error);
      toast.error('Failed to load employment history.');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  const handleAddStatusChange = async () => {
    const { date, status, remarks } = statusChangeModal;
    
    if (!date || !status) {
      toast.error('Date and status are required.');
      return;
    }
    
    try {
      const res = await axios.post(`${API_URL}/api/candidates/${id}/employment-history`, {
        change_date: date instanceof Date ? date.toISOString() : date,
        status,
        remarks
      });
      
      if (res.data.success) {
        toast.success('Status change added successfully');
        fetchEmploymentHistory();
        setStatusChangeModal({ open: false, date: new Date(), status: '', remarks: '' });
      }
    } catch (error) {
      console.error('Failed to add status change:', error);
      toast.error('Failed to add status change.');
    }
  };
  
  const handleDeleteStatusChange = async (historyId) => {
    try {
      const res = await axios.delete(`${API_URL}/api/candidates/${id}/employment-history/${historyId}`);
      
      if (res.data.success) {
        toast.success('Status change deleted successfully');
        fetchEmploymentHistory();
      }
    } catch (error) {
      console.error('Failed to delete status change:', error);
      toast.error('Failed to delete status change.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'org_id') {
      setFormData(prev => ({ ...prev, [name]: value, inst_id: '', dept_id: '' }));
      
      if (value) {
        fetchInstitutes(value);
        setDepartments([]);
      } else {
        setInstitutes([]);
        setDepartments([]);
      }
    } else if (name === 'inst_id') {
      setFormData(prev => ({ ...prev, [name]: value, dept_id: '' }));
      
      if (value) {
        fetchDepartments(value);
      } else {
        setDepartments([]);
      }
    } else if (name === 'candidate_type' && value !== 'probation') {
    setFormData(prev => ({
      ...prev,
        [name]: value,
        probation_end_date: ''
    }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!formData.cand_name) {
        setError('Full Name is required');
        setSubmitting(false);
        return;
      }
      
      if (!formData.cand_cnic_no) {
        setError('CNIC Number is required');
        setSubmitting(false);
        return;
      }
      
      if (formData.candidate_type === 'probation' && !formData.probation_end_date) {
        setError('Probation End Date is required when status is set to On Probation');
        setSubmitting(false);
        return;
      }
      
      // Prepare data for submission
      const submissionData = { ...formData };
      
      // Format dates for API
      if (submissionData.date_of_birth instanceof Date) {
        submissionData.date_of_birth = submissionData.date_of_birth.toISOString().split('T')[0];
      }
      
      if (submissionData.probation_end_date instanceof Date) {
        submissionData.probation_end_date = submissionData.probation_end_date.toISOString().split('T')[0];
      }
      
      // Make API call
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/candidates/${id}`, submissionData);
        
        if (res.data.success) {
          setSuccess('Candidate updated successfully!');
          toast.success('Candidate updated successfully!');
          setTimeout(() => navigate('/candidates'), 1500);
        }
      } else {
        res = await axios.post(`${API_URL}/api/candidates`, submissionData);
      
      if (res.data.success) {
          // For new candidates, show the credentials if available
          if (res.data.credentials) {
            // Show the credentials in the modal
            setCredentials(res.data.credentials);
          } else {
            setSuccess('Candidate added successfully!');
            toast.success('Candidate added successfully!');
            setTimeout(() => navigate('/candidates'), 1500);
          }
        }
      }
    } catch (error) {
      console.error('Failed to submit candidate:', error);
      setError(
        error.response?.data?.message || 
        'Failed to submit candidate data. Please try again.'
      );
      toast.error(
        error.response?.data?.message || 
        'Failed to submit candidate data. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/candidates');
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStatusModalOpen = () => {
    setStatusModalOpen(true);
  };

  const handleStatusModalClose = () => {
    setStatusModalOpen(false);
  };

  const handleStatusUpdate = (updatedCandidate) => {
    // Update the local candidate data with the updated one
    setFormData(updatedCandidate);
    toast.success(`Candidate status updated to ${updatedCandidate.candidate_type}`);
  };
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  // Options for select fields
  const genderOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' }
  ];
  
  const nationalityOptions = [
    { value: 1, label: 'Pakistani' },
    { value: 2, label: 'Overseas Pakistani' },
    { value: 3, label: 'Foreign' }
  ];
  
  const modeOptions = [
    { value: 'R', label: 'Regular' },
    { value: 'C', label: 'Contract' },
    { value: 'T', label: 'Temporary' },
    { value: 'P', label: 'Part-time' }
  ];
  
  const candidateTypeOptions = [
    { value: 'initial', label: 'Initial Hiring' },
    { value: 'probation', label: 'On Probation' },
    { value: 'hired', label: 'Hired' },
    { value: 'promoted', label: 'Promoted' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'terminated', label: 'Terminated' }
  ];
  
  const hiringStatusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hired', label: 'Hired' }
  ];
  
  const statusOptions = [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ];
  
  const organizationOptions = organizations.map(org => ({
    value: org.org_id,
    label: org.org_name
  }));
  
  const instituteOptions = institutes.map(inst => ({
    value: inst.inst_id,
    label: inst.inst_name
  }));
  
  const departmentOptions = departments.map(dept => ({
    value: dept.dept_id,
    label: dept.dept_name
  }));
  
  const categoryOptions = categories.map(cat => ({
    value: cat.cat_id,
    label: cat.cat_name
  }));
  
  const jobOptions = jobs.map(job => ({
    value: job.job_id,
    label: job.job_name
  }));
  
  const supervisorOptions = supervisors.map(sup => ({
    value: sup._id,
    label: sup.profile?.firstName 
      ? `${sup.profile.firstName} ${sup.profile.lastName || ''}`.trim() 
      : sup.username
  }));
  
  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'initial':
        return 'Initial Hiring';
      case 'probation':
        return 'On Probation';
      case 'hired':
        return 'Hired';
      case 'promoted':
        return 'Promoted';
      case 'transferred':
        return 'Transferred';
      case 'resigned':
        return 'Resigned';
      case 'terminated':
        return 'Terminated';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'initial':
        return 'info';
      case 'probation':
        return 'warning';
      case 'hired':
        return 'success';
      case 'promoted':
        return 'success';
      case 'transferred':
        return 'info';
      case 'resigned':
        return 'error';
      case 'terminated':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <MainLayout>
      {/* Credentials Modal */}
      {credentials && (
        <CredentialsModal 
          credentials={credentials} 
          onClose={() => {
            setCredentials(null);
            toast.success('Candidate added successfully!');
            navigate('/candidates');
          }} 
        />
      )}
      
      <Box sx={{ p: 2 }}>
        <PageHeader
          title={isEditMode ? 'Edit Candidate' : 'Create Candidate'}
          subtitle={isEditMode ? 'Update candidate information' : 'Add a new candidate to the system'}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Candidates', path: '/candidates' },
            { label: isEditMode ? 'Edit Candidate' : 'Create Candidate' }
          ]}
          actionIcon={<PersonIcon />}
        />
        
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Basic Information" />
            <Tab label="Employment Details" />
            {isEditMode && <Tab label="Employment History" />}
          </Tabs>
        </Box>
        
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
          error={error}
          success={success}
          submitLabel={isEditMode ? 'Update Candidate' : 'Create Candidate'}
        >
          {activeTab === 0 && (
            <>
              <FormSection title="Personal Information">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormTextField
                    name="cand_name"
                      label="Full Name"
                    value={formData.cand_name}
                    onChange={handleChange}
                    required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormTextField
                    name="cand_cnic_no"
                      label="CNIC Number"
                    value={formData.cand_cnic_no}
                    onChange={handleChange}
                    required
                      placeholder="e.g., 12345-1234567-1"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormTextField
                    name="temp_cand_cnic_no"
                      label="Temporary CNIC/ID"
                    value={formData.temp_cand_cnic_no}
                    onChange={handleChange}
                      placeholder="Enter temporary ID (if applicable)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormDatePicker
                    name="date_of_birth"
                      label="Date of Birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </FormSection>
              
              <FormSection title="Contact Information">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormTextField
                      name="cand_email"
                      label="Email"
                      type="email"
                      value={formData.cand_email}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormTextField
                      name="cand_mobile_no"
                      label="Mobile Number"
                      value={formData.cand_mobile_no}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormTextField
                      name="cand_whatsapp_no"
                      label="WhatsApp Number"
                      value={formData.cand_whatsapp_no}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                    name="cand_gender"
                      label="Gender"
                    value={formData.cand_gender}
                    onChange={handleChange}
                      options={genderOptions}
                    />
                  </Grid>
                </Grid>
              </FormSection>
              
              <FormSection title="Status Information">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                    name="cand_nationality"
                      label="Nationality"
                    value={formData.cand_nationality}
                    onChange={handleChange}
                      options={nationalityOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                      name="cand_status"
                      label="Status"
                      value={formData.cand_status}
                      onChange={handleChange}
                      options={statusOptions}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormTextField
                      name="cand_remarks"
                      label="Remarks"
                      value={formData.cand_remarks}
                      onChange={handleChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </>
          )}
          
          {activeTab === 1 && (
            <>
              <FormSection title="Organization Details">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                    name="org_id"
                      label="Organization"
                    value={formData.org_id}
                    onChange={handleChange}
                      options={organizationOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                    name="inst_id"
                      label="Institute"
                    value={formData.inst_id}
                    onChange={handleChange}
                      options={instituteOptions}
                    disabled={!formData.org_id || institutes.length === 0}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                    name="dept_id"
                      label="Department"
                    value={formData.dept_id}
                    onChange={handleChange}
                      options={departmentOptions}
                    disabled={!formData.inst_id || departments.length === 0}
                    />
                  </Grid>
                </Grid>
              </FormSection>
              
              <FormSection title="Employment Details">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                      name="cand_mode"
                      label="Employment Mode"
                      value={formData.cand_mode}
                    onChange={handleChange}
                      options={modeOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                      name="cat_id"
                      label="Category"
                      value={formData.cat_id}
                    onChange={handleChange}
                      options={categoryOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                    name="candidate_type"
                      label="Candidate Type"
                    value={formData.candidate_type}
                      onChange={handleChange}
                      options={candidateTypeOptions}
                    />
                  </Grid>
                {formData.candidate_type === 'probation' && (
                    <Grid item xs={12} sm={6}>
                      <FormDatePicker
                      name="probation_end_date"
                        label="Probation End Date"
                      value={formData.probation_end_date}
                      onChange={handleChange}
                        required
                      />
                    </Grid>
                  )}
                </Grid>
              </FormSection>
              
              <FormSection title="Job & Hiring Details">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                      name="applied_job_id"
                      label="Applied Job"
                      value={formData.applied_job_id}
                      onChange={handleChange}
                      options={jobOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                      name="current_job_id"
                      label="Current Job"
                      value={formData.current_job_id}
                      onChange={handleChange}
                      options={jobOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                      name="hiring_status"
                      label="Hiring Status"
                      value={formData.hiring_status}
                      onChange={handleChange}
                      options={hiringStatusOptions}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormSelectField
                    name="supervisor_id"
                      label="Supervisor"
                      value={formData.supervisor_id}
                    onChange={handleChange}
                      options={supervisorOptions}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </>
          )}
          
          {activeTab === 2 && isEditMode && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Employment Status History</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setStatusChangeModal({ ...statusChangeModal, open: true })}
                >
                  Add Status Change
                </Button>
              </Box>
              
              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : employmentHistory.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    No employment status history available for this candidate.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setStatusChangeModal({ ...statusChangeModal, open: true })}
                    sx={{ mt: 2 }}
                  >
                    Add First Status Change
                  </Button>
                </Paper>
              ) : (
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Timeline position="alternate">
                    {employmentHistory.map((history, index) => (
                      <TimelineItem key={history._id || index}>
                        <TimelineOppositeContent color="text.secondary">
                          {new Date(history.change_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={getStatusColor(history.status)}>
                            {history.status === 'hired' ? (
                              <WorkIcon />
                            ) : history.status === 'promoted' ? (
                              <AssignmentIcon />
                            ) : history.status === 'transferred' ? (
                              <BusinessIcon />
                            ) : (
                              <AccessTimeIcon />
                            )}
                          </TimelineDot>
                          {index < employmentHistory.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Card sx={{ 
                            mb: 2, 
                            borderLeft: `4px solid ${theme.palette[getStatusColor(history.status)].main}`
                          }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6" component="div">
                                  {getStatusLabel(history.status)}
                                </Typography>
                                <Box>
                                  <Tooltip title="Delete">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleDeleteStatusChange(history._id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                              {history.remarks && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {history.remarks}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Paper>
              )}
              
              {/* Add Status Change Modal */}
              <Dialog
                open={statusChangeModal.open}
                onClose={() => setStatusChangeModal({ ...statusChangeModal, open: false })}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Add Status Change</DialogTitle>
                <DialogContent>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <FormDatePicker
                        name="statusChangeDate"
                        label="Date of Change"
                        value={statusChangeModal.date}
                        onChange={(e) => setStatusChangeModal({ 
                          ...statusChangeModal, 
                          date: e.target.value 
                        })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormSelectField
                        name="statusChangeType"
                        label="Status"
                        value={statusChangeModal.status}
                        onChange={(e) => setStatusChangeModal({ 
                          ...statusChangeModal, 
                          status: e.target.value 
                        })}
                        options={candidateTypeOptions}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Remarks"
                        value={statusChangeModal.remarks}
                        onChange={(e) => setStatusChangeModal({ 
                          ...statusChangeModal, 
                          remarks: e.target.value 
                        })}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button 
                    onClick={() => setStatusChangeModal({ ...statusChangeModal, open: false })}
              >
                Cancel
                  </Button>
                  <Button 
                    onClick={handleAddStatusChange} 
                    variant="contained" 
                    color="primary"
                  >
                    Add Status Change
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </FormLayout>
      </Box>
      
      {/* Status update modal */}
      {isEditMode && (
        <CandidateStatusModal
          open={statusModalOpen}
          onClose={handleStatusModalClose}
          candidate={formData}
          boardId={null} // No board associated with direct status update
          onStatusUpdated={handleStatusUpdate}
        />
      )}
    </MainLayout>
  );
};

export default CandidateForm; 