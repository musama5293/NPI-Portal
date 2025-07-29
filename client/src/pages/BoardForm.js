import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Grid, 
  CircularProgress,
  Typography,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
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
  getBoard, 
  createBoard, 
  updateBoard, 
} from '../utils/api';
import {
  GroupWork as BoardIcon,
  Work as WorkIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const BoardForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [associatedCandidates, setAssociatedCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    board_name: '',
    board_description: '',
    board_date: new Date().toISOString().split('T')[0],
    job_ids: [],
    status: 'draft'
  });
  
  useEffect(() => {
    loadJobs();
    if (isEditMode) {
      loadBoard();
    }
  }, [isEditMode, id]);

  useEffect(() => {
    if (formData.job_ids && formData.job_ids.length > 0) {
      fetchCandidatesForJobs(formData.job_ids);
    } else {
      setAssociatedCandidates([]);
    }
  }, [formData.job_ids]);

  const fetchCandidatesForJobs = async (jobIds) => {
    setLoadingCandidates(true);
    try {
      // Fetch candidates for all selected jobs
      const candidatesPromises = jobIds.map(jobId => 
        axios.get(`${API_URL}/api/jobs/${jobId}/candidates`)
      );
      
      const responses = await Promise.all(candidatesPromises);
      
      // Combine all candidates from different jobs
      let allCandidates = [];
      responses.forEach(res => {
      if (res.data.success) {
          allCandidates = [...allCandidates, ...res.data.data];
        }
      });
      
      // Remove duplicates (in case a candidate is associated with multiple jobs)
      const uniqueCandidates = Array.from(
        new Map(allCandidates.map(item => [item._id, item])).values()
      );
      
      setAssociatedCandidates(uniqueCandidates);
    } catch (error) {
      console.error('Failed to fetch candidates for jobs:', error);
      toast.error('An error occurred while fetching candidates.');
      setAssociatedCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs`);
      if (res.data.success) {
        const activeJobs = res.data.data.filter(job => job.job_status === 1 && job.test_id);
        setJobs(activeJobs);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs.');
    }
  };
  
  const loadBoard = async () => {
    setLoading(true);
    try {
      const response = await getBoard(id);
      if (response.data.success) {
        const board = response.data.data;
        
        // Handle both old boards with job_id and new boards with job_ids
        const jobIds = board.job_ids && board.job_ids.length > 0 
          ? board.job_ids 
          : board.job_id 
            ? [board.job_id] 
            : [];
            
        setFormData({
          board_name: board.board_name,
          board_description: board.board_description || '',
          board_date: new Date(board.board_date).toISOString().split('T')[0],
          job_ids: jobIds,
          status: board.status || 'draft'
        });
      } else {
        toast.error('Failed to load board details');
        navigate('/boards');
      }
    } catch (err) {
      console.error('Error loading board:', err);
      toast.error('Failed to load board details');
      navigate('/boards');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleJobsChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      job_ids: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.board_name || !formData.job_ids || formData.job_ids.length === 0) {
      toast.error('Board name and at least one Job are required.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // For backward compatibility, also set job_id to the first selected job
      const dataToSubmit = {
        ...formData,
        job_id: formData.job_ids[0]
      };
      
      if (isEditMode) {
        await updateBoard(id, dataToSubmit);
        toast.success('Evaluation board updated successfully');
      } else {
        await createBoard(dataToSubmit);
        toast.success('Evaluation board and test assignments created successfully!');
      }
      navigate('/boards');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save evaluation board.';
      console.error('Error saving board:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/boards');
  };

  const jobOptions = jobs.map(job => ({
    value: job.job_id,
    label: `${job.job_name} (Test ID: ${job.test_id})`
  }));
  
  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
        <PageHeader
          title={isEditMode ? "Edit Evaluation Board" : "Create Evaluation Board"}
        subtitle={isEditMode ? "Update board details" : "Create a board and automatically assign tests"}
        icon={<BoardIcon fontSize="large" />}
      />
      <Box sx={{ mt: 4 }}>
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
          submitLabel={isEditMode ? 'Update Board' : 'Create Board & Assign Tests'}
        >
          <FormSection title="Board Details">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                <FormTextField
                  name="board_name"
                  label="Board Name"
                  value={formData.board_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <FormDatePicker
                  name="board_date"
                  label="Board Date"
                  value={formData.board_date}
                  onChange={(date) => setFormData(p => ({ ...p, board_date: date }))}
                  required
                />
              </Grid>
                  <Grid item xs={12}>
                <FormTextField
                      name="board_description"
                      label="Description"
                      value={formData.board_description}
                      onChange={handleChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="status-label">Board Status</InputLabel>
                      <Select
                        labelId="status-label"
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        label="Board Status"
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
          </FormSection>
              
          <FormSection title="Job & Test Assignment">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!error}>
                  <InputLabel id="job-ids-label">Select Jobs</InputLabel>
                  <Select
                    labelId="job-ids-label"
                    id="job-ids"
                    name="job_ids"
                    multiple
                    value={formData.job_ids}
                    onChange={handleJobsChange}
                    input={<OutlinedInput label="Select Jobs" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const job = jobs.find(j => j.job_id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={job ? job.job_name : value} 
                              size="small"
                              icon={<WorkIcon />}
                            />
                          );
                        })}
                      </Box>
                    )}
                  disabled={isEditMode}
                  >
                    {jobs.map((job) => (
                      <MenuItem key={job.job_id} value={job.job_id}>
                        <Checkbox checked={formData.job_ids.indexOf(job.job_id) > -1} />
                        <ListItemText 
                          primary={job.job_name} 
                          secondary={`Test ID: ${job.test_id}`} 
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Select jobs to link candidates and automatically assign the associated tests.
                </Typography>
              </Grid>
            </Grid>
          </FormSection>
          
          {error && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {loadingCandidates ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
          ) : (
            associatedCandidates.length > 0 && (
              <FormSection title="Associated Candidates">
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The following {associatedCandidates.length} candidate(s) will be assigned to this board and linked test.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {associatedCandidates.map(candidate => (
                          <Chip
                        key={candidate._id}
                        icon={<PersonIcon />}
                        label={candidate.cand_name}
                            variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Paper>
              </FormSection>
            )
          )}
          
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default BoardForm; 