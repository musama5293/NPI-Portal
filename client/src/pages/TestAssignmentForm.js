import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  AssignmentTurnedIn as AssignmentIcon,
  Person as PersonIcon,
  Quiz as QuizIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const TestAssignmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  
  // Get candidate ID from URL if available
  const queryParams = new URLSearchParams(location.search);
  const preselectedCandidateId = queryParams.get('candidateId');
  
  const [tests, setTests] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [formData, setFormData] = useState({
    assignment_id: '',
    test_id: '',
    candidate_id: preselectedCandidateId || '',
    scheduled_date: '',
    expiry_date: '',
    assignment_status: 1
  });
  
  const [loading, setLoading] = useState(isEditMode || Boolean(preselectedCandidateId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/test/tests`);
        if (res.data.success) {
          setTests(res.data.data.filter(test => test.test_status === 1));
        }
      } catch (error) {
        console.error('Failed to fetch tests:', error);
        toast.error('Failed to load tests. Please try again.');
      }
    };
    
    const fetchCandidates = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/candidates`);
        if (res.data.success) {
          setCandidates(res.data.data);
          
          // If there's a preselected candidate ID, find its details
          if (preselectedCandidateId) {
            const candidate = res.data.data.find(c => c._id === preselectedCandidateId);
            if (candidate) {
              setSelectedCandidate(candidate);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
        toast.error('Failed to load candidates. Please try again.');
      }
    };
    
    const fetchAssignment = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const res = await axios.get(`${API_URL}/api/test/test-assignments/${id}`);
          
          if (res.data.success) {
            const assignment = res.data.data;
            
            // Format dates for input fields
            const scheduledDate = new Date(assignment.scheduled_date)
              .toISOString().split('T')[0];
            const expiryDate = new Date(assignment.expiry_date)
              .toISOString().split('T')[0];
            
            setFormData({
              assignment_id: assignment.assignment_id,
              test_id: assignment.test_id,
              candidate_id: assignment.candidate_id._id,
              scheduled_date: scheduledDate,
              expiry_date: expiryDate,
              assignment_status: assignment.assignment_status
            });
            
            // Set the selected candidate
            setSelectedCandidate(assignment.candidate_id);
          }
        } catch (error) {
          console.error('Failed to fetch assignment:', error);
          setError('Failed to load assignment data. Please try again.');
          toast.error('Failed to load assignment data. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // Generate a unique assignment ID for new assignments
        const generateAssignmentId = async () => {
          try {
            // For now, just use a random number between 1000-9999
            // In a real app, you'd want to check if this ID already exists
            const randomId = Math.floor(1000 + Math.random() * 9000);
            
            // Set default dates for new assignments
            const today = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            
            const scheduledDate = today.toISOString().split('T')[0];
            const expiryDate = nextMonth.toISOString().split('T')[0];
            
            setFormData(prev => ({
              ...prev,
              assignment_id: randomId,
              scheduled_date: scheduledDate,
              expiry_date: expiryDate
            }));
          } catch (error) {
            console.error('Failed to generate assignment ID:', error);
          } finally {
            setLoading(false);
          }
        };
        
        generateAssignmentId();
      }
    };
    
    fetchTests();
    fetchCandidates();
    fetchAssignment();
  }, [id, isEditMode, preselectedCandidateId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If the candidate selection changes, update the selected candidate details
    if (name === 'candidate_id' && value) {
      const candidate = candidates.find(c => c._id === value);
      if (candidate) {
        setSelectedCandidate(candidate);
      } else {
        setSelectedCandidate(null);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Ensure test_id is passed as a number
      const payload = {
        ...formData,
        test_id: Number(formData.test_id)
      };
      
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/test/test-assignments/${id}`, payload);
      } else {
        res = await axios.post(`${API_URL}/api/test/test-assignments`, payload);
      }
      
      if (res.data.success) {
        setSuccess(`Test assignment ${isEditMode ? 'updated' : 'created'} successfully`);
        toast.success(`Test assignment ${isEditMode ? 'updated' : 'created'} successfully`);
        setTimeout(() => navigate('/test-assignments'), 1500);
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} test assignment:`, error);
      setError(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} test assignment. Please try again.`);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} test assignment. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/test-assignments');
  };
  
  // Prepare data for form fields
  const testOptions = tests.map(test => ({
    value: test.test_id,
    label: test.test_name
  }));
  
  const candidateOptions = candidates.map(candidate => ({
    value: candidate._id,
    label: candidate.cand_name || 'Unnamed Candidate'
  }));
  
  const statusOptions = [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ];
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title={isEditMode ? 'Edit Test Assignment' : 'Assign Test'}
          subtitle={isEditMode ? 'Update test assignment details' : 'Assign a test to a candidate'}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Test Assignments', path: '/test-assignments' },
            { label: isEditMode ? 'Edit Assignment' : 'Assign Test' }
          ]}
          actionIcon={<AssignmentIcon />}
        />
        
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
          error={error}
          success={success}
          submitLabel={isEditMode ? 'Update Assignment' : 'Create Assignment'}
        >
          <FormSection title="Assignment Details">
            <Grid container spacing={2}>
              {!isEditMode && (
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    name="assignment_id"
                    label="Assignment ID"
                    value={formData.assignment_id}
                    onChange={handleChange}
                    disabled
                    required
                    type="number"
                    helperText="Auto-generated assignment ID"
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="test_id"
                  label="Test"
                  value={formData.test_id}
                  onChange={handleChange}
                  options={testOptions}
                  required
                  helperText="Select the test to assign"
                  startAdornment={<QuizIcon color="action" />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="candidate_id"
                  label="Candidate"
                  value={formData.candidate_id}
                  onChange={handleChange}
                  options={candidateOptions}
                  required
                  disabled={Boolean(preselectedCandidateId)}
                  helperText={preselectedCandidateId ? "Candidate pre-selected" : "Select the candidate to assign this test to"}
                  startAdornment={<PersonIcon color="action" />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormDatePicker
                  name="scheduled_date"
                  label="Scheduled Date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormDatePicker
                  name="expiry_date"
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  required
                  minDate={formData.scheduled_date}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="assignment_status"
                  label="Status"
                  value={formData.assignment_status}
                  onChange={handleChange}
                  options={statusOptions}
                  required
                />
              </Grid>
            </Grid>
          </FormSection>
          
          {selectedCandidate && (
            <FormSection title="Candidate Information">
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  backgroundColor: theme.palette.background.default
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      width: 56,
                      height: 56,
                      mr: 2
                    }}
                  >
                    {selectedCandidate.cand_name?.charAt(0) || 'C'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedCandidate.cand_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCandidate.cand_email || 'No email provided'}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">CNIC</Typography>
                    <Typography variant="body1">{selectedCandidate.cand_cnic_no || 'N/A'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1">
                      {selectedCandidate.cand_gender === 'M' ? 'Male' : 
                        selectedCandidate.cand_gender === 'F' ? 'Female' : 
                        selectedCandidate.cand_gender === 'O' ? 'Other' : 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Mobile</Typography>
                    <Typography variant="body1">{selectedCandidate.cand_mobile_no || 'N/A'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedCandidate.hiring_status || 'N/A'} 
                      color="primary" 
                      size="small" 
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </FormSection>
          )}
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default TestAssignmentForm; 