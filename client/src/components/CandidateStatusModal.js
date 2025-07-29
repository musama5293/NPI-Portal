import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  FormHelperText,
  Alert
} from '@mui/material';
import { toast } from 'react-toastify';
import { updateCandidateStatus, getSupervisors } from '../utils/api';

const CandidateStatusModal = ({ open, onClose, candidate, boardId, onStatusUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [formData, setFormData] = useState({
    candidate_type: '',
    probation_period: 3, // Default 3 months
    supervisor_id: '',
    comments: ''
  });

  useEffect(() => {
    // If candidate data is available, pre-populate form
    if (candidate) {
      setFormData({
        candidate_type: candidate.candidate_type || 'initial',
        probation_period: candidate.probation_period || 3,
        supervisor_id: candidate.supervisor_id?._id || '',
        comments: ''
      });
      
      // Load supervisors if not already loaded
      if (!supervisors.length) {
        loadSupervisorsList();
      }
    }
  }, [candidate]);

  const loadSupervisorsList = async () => {
    try {
      setLoadingSupervisors(true);
      const response = await getSupervisors();
      if (response.data.success) {
        setSupervisors(response.data.data || []);
      } else {
        toast.error('Failed to load supervisor list');
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
      toast.error('Error loading supervisors');
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.candidate_type) {
      toast.error('Please select a status');
      return;
    }

    // For probation, supervisor is required
    if (formData.candidate_type === 'probation' && !formData.supervisor_id) {
      toast.error('Please select a supervisor for probation');
      return;
    }

    try {
      setLoading(true);
      
      // Format payload for API call
      const payload = {
        ...formData,
        board_id: boardId // Include board ID for tracking
      };

      const response = await updateCandidateStatus(candidate._id, payload);
      
      if (response.data.success) {
        toast.success(`Candidate status updated to ${formData.candidate_type}`);
        
        // Call the callback to update parent components
        if (onStatusUpdated) {
          onStatusUpdated(response.data.data);
        }
        
        onClose();
      } else {
        toast.error('Failed to update candidate status');
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast.error('Error updating candidate status');
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Update Status for {candidate?.cand_name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Current Status: <strong>{candidate?.candidate_type || 'N/A'}</strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">New Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="candidate_type"
                  value={formData.candidate_type}
                  onChange={handleInputChange}
                  label="New Status"
                >
                  <MenuItem value="initial">Initial</MenuItem>
                  <MenuItem value="probation">Probation</MenuItem>
                  <MenuItem value="hired">Hired (Permanent)</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.candidate_type === 'probation' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="probation-period-label">Probation Period</InputLabel>
                    <Select
                      labelId="probation-period-label"
                      name="probation_period"
                      value={formData.probation_period}
                      onChange={handleInputChange}
                      label="Probation Period"
                    >
                      <MenuItem value={1}>1 Month</MenuItem>
                      <MenuItem value={2}>2 Months</MenuItem>
                      <MenuItem value={3}>3 Months</MenuItem>
                      <MenuItem value={6}>6 Months</MenuItem>
                      <MenuItem value={12}>12 Months</MenuItem>
                    </Select>
                    <FormHelperText>
                      Probation will start today for the selected duration
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="supervisor-select-label">Assign Supervisor</InputLabel>
                    <Select
                      labelId="supervisor-select-label"
                      name="supervisor_id"
                      value={formData.supervisor_id}
                      onChange={handleInputChange}
                      label="Assign Supervisor"
                      disabled={loadingSupervisors}
                    >
                      {loadingSupervisors ? (
                        <MenuItem disabled>Loading supervisors...</MenuItem>
                      ) : (
                        supervisors.map((supervisor) => (
                          <MenuItem key={supervisor._id} value={supervisor._id}>
                            {supervisor.profile?.firstName || ''} {supervisor.profile?.lastName || ''} ({supervisor.email})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    <FormHelperText>
                      The supervisor will be responsible for evaluating this candidate during probation
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments/Notes"
                fullWidth
                multiline
                rows={4}
                value={formData.comments}
                onChange={handleInputChange}
                helperText="Add any notes about this status change (optional)"
              />
            </Grid>
            
            {formData.candidate_type === 'hired' && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Changing status to <strong>Hired</strong> will mark this candidate as permanently employed.
                </Alert>
              </Grid>
            )}
            
            {formData.candidate_type === 'rejected' && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Changing status to <strong>Rejected</strong> will mark this candidate as no longer being considered.
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !formData.candidate_type || (formData.candidate_type === 'probation' && !formData.supervisor_id)}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateStatusModal; 