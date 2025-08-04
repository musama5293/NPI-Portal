import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
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
  Work as WorkIcon,
  Quiz as QuizIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    job_name: '',
    job_description: '',
    job_scale: '',
    org_id: 0,
    inst_id: 0,
    dept_id: 0,
    cat_id: 0,
    test_id: '',
    vacancy_count: 0,
    min_qualification: '',
    job_type: 'Full-time',
    job_status: 1,
    created_by: user?._id || ''
  });
  
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch user profile to get org, institute and department
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?._id) {
        try {
          const res = await axios.get(`${API_URL}/api/users/profile`);
          if (res.data.success) {
            setUserProfile(res.data.data);
            
            if (!isEditMode) {
              const profile = res.data.data;
              setFormData(prev => ({
                ...prev,
                org_id: profile.org_id || 0,
                inst_id: profile.inst_id || 0,
                dept_id: profile.dept_id || 0
              }));
              
              if (profile.org_id) fetchInstitutes(profile.org_id);
              if (profile.inst_id) fetchDepartments(profile.inst_id);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };
    
    fetchUserProfile();
  }, [user, isEditMode]);
  
  useEffect(() => {
    const fetchJob = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const res = await axios.get(`${API_URL}/api/jobs/${id}`);
          if (res.data.success) {
            const job = res.data.data;
            
            console.log('Fetched job data:', job); // Debug log
            
            // Handle potential object values that should be numbers
            if (typeof job.org_id === 'object' && job.org_id !== null) job.org_id = job.org_id.org_id || 0;
            if (typeof job.inst_id === 'object' && job.inst_id !== null) job.inst_id = job.inst_id.inst_id || 0;
            if (typeof job.dept_id === 'object' && job.dept_id !== null) job.dept_id = job.dept_id.dept_id || 0;
            
            // Fix category handling - check for both object and populated category
            if (typeof job.cat_id === 'object' && job.cat_id !== null) {
              job.cat_id = job.cat_id.cat_id || 0;
            } else if (job.category && job.category.cat_id) {
              // If category is populated separately but cat_id is 0, use the populated category's ID
              job.cat_id = job.category.cat_id;
            }
            
            console.log('Final cat_id value:', job.cat_id); // Debug log
            
            setFormData(job);
            
            if (job.org_id) fetchInstitutes(job.org_id);
            if (job.inst_id) fetchDepartments(job.inst_id);
          }
        } catch (err) {
          console.error('Failed to fetch job:', err);
          setError('Failed to load job data. Please try again.');
          toast.error('Failed to load job data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOrganizations();
    fetchCategories();
    fetchTests();
    fetchJob();
  }, [id, isEditMode]);
  
  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/organizations`);
      if (res.data.success) setOrganizations(res.data.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations.');
    }
  };
  
  const fetchInstitutes = async (orgId) => {
    try {
      const res = await axios.get(`${API_URL}/api/institutes?org_id=${orgId}`);
      if (res.data.success) setInstitutes(res.data.data);
    } catch (error) {
      console.error('Failed to fetch institutes:', error);
      toast.error('Failed to load institutes.');
    }
  };
  
  const fetchDepartments = async (instId) => {
    try {
      const res = await axios.get(`${API_URL}/api/departments?inst_id=${instId}`);
      if (res.data.success) setDepartments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments.');
    }
  };
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/test/categories`);
      if (res.data.success) setCategories(res.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories.');
    }
  };

  const fetchTests = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/test/tests`);
      if (res.data.success) {
        setTests(res.data.data.filter(test => test.test_status === 1));
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast.error('Failed to load tests.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const isNumeric = ['org_id', 'inst_id', 'dept_id', 'cat_id', 'vacancy_count', 'job_status'].includes(name);
    const val = isNumeric ? (value === '' ? 0 : Number(value)) : value;
      
    setFormData(prev => ({ ...prev, [name]: val }));
      
    if (name === 'org_id' && val > 0) {
      fetchInstitutes(val);
      setFormData(prev => ({ ...prev, inst_id: 0, dept_id: 0 }));
        setDepartments([]);
      }
      
    if (name === 'inst_id' && val > 0) {
      fetchDepartments(val);
      setFormData(prev => ({ ...prev, dept_id: 0 }));
      }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const payload = {
        ...formData,
      created_by: user?._id
      };
      
    try {
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/jobs/${id}`, payload);
      } else {
        res = await axios.post(`${API_URL}/api/jobs`, payload);
      }
      
      if (res.data.success) {
        toast.success(`Job ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate('/job-list');
      } else {
        throw new Error(res.data.message || 'An unknown error occurred.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit the form.';
      console.error('Form submission error:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/job-list');
  };
  
  const orgOptions = organizations.map(org => ({ value: org.org_id, label: org.org_name }));
  const instOptions = institutes.map(inst => ({ value: inst.inst_id, label: inst.inst_name }));
  const deptOptions = departments.map(dept => ({ value: dept.dept_id, label: dept.dept_name }));
  const catOptions = categories.map(cat => ({ value: cat.cat_id, label: cat.cat_name }));
  const testOptions = tests.map(test => ({ value: test.test_id, label: test.test_name }));
  const jobTypeOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Internship', label: 'Internship' },
  ];
  const statusOptions = [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' },
  ];
  
  if (loading) return <MainLayout><CircularProgress /></MainLayout>;
  if (error && !isEditMode) return <MainLayout><p>Error: {error}</p></MainLayout>;
  
  return (
    <MainLayout>
        <PageHeader
          title={isEditMode ? 'Edit Job' : 'Create Job'}
        subtitle="Fill in the details for the job position."
        icon={<WorkIcon fontSize="large" />}
        />
      <Box sx={{ mt: 4 }}>
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
          submitLabel={isEditMode ? 'Update Job' : 'Create Job'}
        >
          <FormSection title="Job Details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField
                    name="job_name"
                    label="Job Name"
                    value={formData.job_name}
                    onChange={handleChange}
                    required
                    helperText="What is the name of this job?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="test_id"
                    label="Associated Test"
                    value={formData.test_id || ''}
                    onChange={handleChange}
                    options={testOptions}
                    helperText="Link a test to this job for automatic assignment"
                    startAdornment={<QuizIcon color="action" />}
                  />
                </Grid>
              <Grid item xs={12}>
                <FormTextField
                  name="job_description"
                  label="Job Description"
                  value={formData.job_description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  helperText="Provide a detailed description of the job responsibilities."
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="Job Information">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormTextField
                    name="job_scale"
                  label="Job Scale"
                    value={formData.job_scale}
                    onChange={handleChange}
                  placeholder="e.g., BPS-17, E3"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormTextField
                  name="vacancy_count"
                  label="# of Vacancies"
                  type="number"
                  value={formData.vacancy_count}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormSelectField
                    name="job_type"
                  label="Job Type"
                    value={formData.job_type}
                    onChange={handleChange}
                  options={jobTypeOptions}
                    required
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormSelectField
                  name="job_status"
                  label="Job Status"
                  value={formData.job_status}
                  onChange={handleChange}
                  options={statusOptions}
                  required
                />
              </Grid>
            </Grid>
          </FormSection>
          
          <FormSection title="Organizational Details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="org_id"
                  label="Organization"
                  value={formData.org_id}
                    onChange={handleChange}
                  options={orgOptions}
                    required
                  disabled={!!userProfile?.org_id}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="inst_id"
                  label="Institute"
                  value={formData.inst_id}
                    onChange={handleChange}
                  options={instOptions}
                  disabled={!formData.org_id || !!userProfile?.inst_id}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="dept_id"
                  label="Department"
                  value={formData.dept_id}
                    onChange={handleChange}
                  options={deptOptions}
                  disabled={!formData.inst_id || !!userProfile?.dept_id}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="cat_id"
                  label="Category"
                  value={formData.cat_id}
                    onChange={handleChange}
                  options={catOptions}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="Requirements">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormTextField
                    name="min_qualification"
                  label="Minimum Qualification"
                    value={formData.min_qualification}
                    onChange={handleChange}
                  helperText="Specify the minimum educational or professional qualifications required."
                />
              </Grid>
            </Grid>
          </FormSection>
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default JobForm; 