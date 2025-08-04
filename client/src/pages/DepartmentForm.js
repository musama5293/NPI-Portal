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
import axios from 'axios';

import { API_URL } from '../config/config';

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    dept_name: '',
    dept_status: 1,
    inst_id: ''
  });
  
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchOrganizations();
    
    if (isEditMode) {
      fetchDepartment();
    }
  }, [id, isEditMode]);
  
  useEffect(() => {
    if (selectedOrgId) {
      fetchInstitutes(selectedOrgId);
    } else {
      setInstitutes([]);
      setFormData(prev => ({ ...prev, inst_id: '' }));
    }
  }, [selectedOrgId]);
  
  const fetchDepartment = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/departments/${id}`);
      if (res.data.success) {
        const dept = res.data.data;
        setFormData(dept);
        
        // Get the institute to determine its org_id
        const instRes = await axios.get(`${API_URL}/api/institutes/${dept.inst_id}`);
        if (instRes.data.success) {
          const inst = instRes.data.data;
          setSelectedOrgId(inst.org_id.toString());
          await fetchInstitutes(inst.org_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch department:', error);
      toast.error('Failed to load department data. Please try again.');
      navigate('/departments');
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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'org_id') {
      setSelectedOrgId(value);
    } else {
      setFormData({
        ...formData,
        [name]: name === 'inst_id' ? Number(value) : value
      });
    }
  };

  const handleStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      dept_status: e.target.checked ? 1 : 0
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.inst_id) {
      toast.error('Please select an institute');
      return;
    }
    
    setSubmitting(true);
    
    try {
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/departments/${id}`, formData);
      } else {
        res = await axios.post(`${API_URL}/api/departments`, formData);
      }
      
      if (res.data.success) {
        toast.success(`Department ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/departments');
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} department:`, error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} department. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Edit Department' : 'Create Department'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={isEditMode ? 'Edit Department' : 'Create Department'}>
      <Paper elevation={3} sx={{ p: 3, m: 3 }}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/departments')}
            sx={{ mr: 2 }}
          >
            Back to Departments
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Department' : 'Create New Department'}
          </Typography>
        </Box>

          <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="dept_name"
                label="Department Name"
                fullWidth
                    required
                    value={formData.dept_name}
                    onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="org-select-label">Organization</InputLabel>
                <Select
                  labelId="org-select-label"
                  id="org-select"
                    name="org_id"
                    value={selectedOrgId}
                    onChange={handleChange}
                  label="Organization"
                  disabled={isEditMode}
                >
                  <MenuItem value="">
                    <em>Select an organization</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.org_id} value={org.org_id.toString()}>
                        {org.org_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="inst-select-label">Institute</InputLabel>
                <Select
                  labelId="inst-select-label"
                  id="inst-select"
                    name="inst_id"
                    value={formData.inst_id}
                    onChange={handleChange}
                  label="Institute"
                    disabled={!selectedOrgId}
                >
                  <MenuItem value="">
                    <em>Select an institute</em>
                  </MenuItem>
                  {institutes.map((institute) => (
                    <MenuItem key={institute.inst_id} value={institute.inst_id}>
                      {institute.inst_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.dept_status === 1}
                      onChange={handleStatusChange}
                    name="dept_status"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  sx={{ mr: 1 }}
                  onClick={() => navigate('/departments')}
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
                    'Update Department'
                  ) : (
                    'Create Department'
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

export default DepartmentForm; 