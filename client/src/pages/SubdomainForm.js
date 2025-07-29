import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  CircularProgress,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { getSubdomain, createSubdomain, updateSubdomain, getDomains } from '../utils/api';

const SubdomainForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [domains, setDomains] = useState([]);
  const [formData, setFormData] = useState({
    domain_id: '',
    subdomain_name: '',
    description: '',
    subdomain_status: 1
  });

  const isEditMode = !!id;

  useEffect(() => {
    loadDomains();
    if (isEditMode) {
      loadSubdomain();
    }
  }, [id]);

  const loadDomains = async () => {
    try {
      const response = await getDomains();
      setDomains(response.data.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
      toast.error('Failed to load domains');
    }
  };

  const loadSubdomain = async () => {
    try {
      setLoading(true);
      const response = await getSubdomain(id);
      const subdomain = response.data.data;
      setFormData({
        domain_id: subdomain.domain_id,
        subdomain_name: subdomain.subdomain_name,
        description: subdomain.description || '',
        subdomain_status: subdomain.subdomain_status
      });
    } catch (err) {
      console.error('Error fetching subdomain:', err);
      toast.error('Failed to load subdomain details');
      navigate('/subdomains');
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

  const handleStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      subdomain_status: e.target.checked ? 1 : 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.domain_id) {
      toast.error('Please select a domain');
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await updateSubdomain(id, formData);
        toast.success('Subdomain updated successfully');
      } else {
        await createSubdomain(formData);
        toast.success('Subdomain created successfully');
      }
      navigate('/subdomains');
    } catch (err) {
      console.error('Error saving subdomain:', err);
      toast.error(err.response?.data?.message || 'Failed to save subdomain');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Edit Subdomain' : 'Create Subdomain'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditMode ? 'Edit Subdomain' : 'Create Subdomain'}>
      <Paper elevation={3} sx={{ p: 3, m: 3 }}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/subdomains')}
            sx={{ mr: 2 }}
          >
            Back to Subdomains
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Subdomain' : 'Create New Subdomain'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="domain-select-label">Domain</InputLabel>
                <Select
                  labelId="domain-select-label"
                  id="domain-select"
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleChange}
                  label="Domain"
                  disabled={isEditMode}
                >
                  <MenuItem value="">
                    <em>Select a domain</em>
                  </MenuItem>
                  {domains.map((domain) => (
                    <MenuItem key={domain.domain_id} value={domain.domain_id}>
                      {domain.domain_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="subdomain_name"
                label="Subdomain Name"
                fullWidth
                required
                value={formData.subdomain_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.subdomain_status === 1}
                      onChange={handleStatusChange}
                      name="subdomain_status"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  sx={{ mr: 1 }}
                  onClick={() => navigate('/subdomains')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={24} />
                  ) : isEditMode ? (
                    'Update Subdomain'
                  ) : (
                    'Create Subdomain'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </MainLayout>
  );
};

export default SubdomainForm; 