import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import FormLayout from '../components/common/FormLayout';
import { 
  FormTextField, 
  FormSelectField,
  FormSection 
} from '../components/common/FormFields';
import {
  Box,
  Grid,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Business as BusinessIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const InstituteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    inst_id: '',
    inst_name: '',
    inst_status: 1,
    org_id: ''
  });
  
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchInstitute = async () => {
      if (isEditMode) {
        try {
          const res = await axios.get(`${API_URL}/api/institutes/${id}`);
          if (res.data.success) {
            setFormData(res.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch institute:', error);
          toast.error('Failed to load institute data. Please try again.');
          setError('Failed to load institute data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOrganizations();
    fetchInstitute();
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
      setError('Failed to load organizations. Please try again.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'inst_id' || name === 'inst_status' || name === 'org_id' 
        ? Number(value) 
        : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/institutes/${id}`, formData);
      } else {
        res = await axios.post(`${API_URL}/api/institutes`, formData);
      }
      
      if (res.data.success) {
        toast.success(`Institute ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/institutes');
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} institute:`, error);
      const errorMessage = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} institute. Please try again.`;
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
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
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title={isEditMode ? 'Edit Institute' : 'New Institute'}
          subtitle={isEditMode ? `Editing institute details` : 'Create a new institute'}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Institutes', path: '/institutes' },
            { label: isEditMode ? 'Edit' : 'Create' }
          ]}
          actionIcon={<BusinessIcon />}
        />
        
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={() => navigate('/institutes')}
          isLoading={submitting}
          error={error}
          submitLabel={isEditMode ? 'Update Institute' : 'Create Institute'}
        >
          <FormSection title="Institute Information">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField
                    name="inst_id"
                  label="Institute ID"
                    value={formData.inst_id}
                    onChange={handleChange}
                  disabled={true}
                    required
                  helperText="ID will be auto-generated"
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormTextField
                    name="inst_name"
                  label="Institute Name"
                    value={formData.inst_name}
                    onChange={handleChange}
                    required
                  placeholder="Enter institute name"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="org_id"
                  label="Organization"
                    value={formData.org_id}
                    onChange={handleChange}
                    required
                  options={[
                    { value: '', label: 'Select Organization' },
                    ...organizations.map(org => ({
                      value: org.org_id,
                      label: org.org_name
                    }))
                  ]}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="inst_status"
                  label="Status"
                    value={formData.inst_status}
                    onChange={handleChange}
                    required
                  options={[
                    { value: 1, label: 'Active' },
                    { value: 0, label: 'Inactive' }
                  ]}
                />
              </Grid>
            </Grid>
          </FormSection>
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default InstituteForm; 