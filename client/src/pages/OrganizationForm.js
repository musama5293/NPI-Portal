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
import axios from 'axios';

import { API_URL } from '../config/config';

const OrganizationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    org_name: '',
    status: 1,
    poc_name: '',
    contact_no: '',
    address: '',
    email: '',
    terms_and_conditions: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchOrganization = async () => {
      if (isEditMode) {
        try {
          const res = await axios.get(`${API_URL}/api/organizations/${id}`);
          if (res.data.success) {
            setFormData(res.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch organization:', error);
          toast.error('Failed to load organization data. Please try again.');
          navigate('/organizations');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOrganization();
  }, [id, isEditMode, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.checked ? 1 : 0
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/organizations/${id}`, formData);
      } else {
        res = await axios.post(`${API_URL}/api/organizations`, formData);
      }
      
      if (res.data.success) {
        toast.success(`Organization ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/organizations');
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} organization:`, error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} organization. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Edit Organization' : 'Create Organization'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={isEditMode ? 'Edit Organization' : 'Create Organization'}>
      <Paper elevation={3} sx={{ p: 3, m: 3 }}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/organizations')}
            sx={{ mr: 2 }}
          >
            Back to Organizations
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Organization' : 'Create New Organization'}
          </Typography>
        </Box>

          <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="org_name"
                label="Organization Name"
                fullWidth
                    required
                    value={formData.org_name}
                    onChange={handleChange}
                  />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                    name="poc_name"
                label="Point of Contact Name"
                fullWidth
                value={formData.poc_name}
                    onChange={handleChange}
                  />
            </Grid>
                
            <Grid item xs={12} md={6}>
              <TextField
                    name="contact_no"
                label="Contact Number"
                fullWidth
                value={formData.contact_no}
                    onChange={handleChange}
                  />
            </Grid>
                
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                    type="email"
                fullWidth
                value={formData.email}
                    onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.status === 1}
                      onChange={handleStatusChange}
                      name="status"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                    name="address"
                label="Address"
                fullWidth
                multiline
                rows={3}
                value={formData.address}
                    onChange={handleChange}
              />
            </Grid>
                
            <Grid item xs={12}>
              <TextField
                    name="terms_and_conditions"
                label="Terms and Conditions"
                fullWidth
                multiline
                rows={4}
                value={formData.terms_and_conditions}
                    onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  sx={{ mr: 1 }}
                  onClick={() => navigate('/organizations')}
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
                    'Update Organization'
                  ) : (
                    'Create Organization'
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

export default OrganizationForm; 