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
  CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { getDomain, createDomain, updateDomain } from '../utils/api';

const DomainForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    domain_name: '',
    description: '',
    domain_status: 1
  });

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      loadDomain();
    }
  }, [id]);

  const loadDomain = async () => {
    try {
      setLoading(true);
      const response = await getDomain(id);
      const domain = response.data.data.domain;
      setFormData({
        domain_name: domain.domain_name,
        description: domain.description || '',
        domain_status: domain.domain_status
      });
    } catch (err) {
      console.error('Error fetching domain:', err);
      toast.error('Failed to load domain details');
      navigate('/domains');
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
      domain_status: e.target.checked ? 1 : 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        await updateDomain(id, formData);
        toast.success('Domain updated successfully');
      } else {
        await createDomain(formData);
        toast.success('Domain created successfully');
      }
      navigate('/domains');
    } catch (err) {
      console.error('Error saving domain:', err);
      toast.error(err.response?.data?.message || 'Failed to save domain');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Edit Domain' : 'Create Domain'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditMode ? 'Edit Domain' : 'Create Domain'}>
      <Paper elevation={3} sx={{ p: 3, m: 3 }}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/domains')}
            sx={{ mr: 2 }}
          >
            Back to Domains
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Domain' : 'Create New Domain'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="domain_name"
                label="Domain Name"
                fullWidth
                required
                value={formData.domain_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.domain_status === 1}
                      onChange={handleStatusChange}
                      name="domain_status"
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
                  onClick={() => navigate('/domains')}
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
                    'Update Domain'
                  ) : (
                    'Create Domain'
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

export default DomainForm; 