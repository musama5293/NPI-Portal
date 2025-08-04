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
  FormSection 
} from '../components/common/FormFields';
import {
  Box,
  Grid,
  Chip,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Add as AddIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

// Predefined test types
const TEST_TYPES = {
  PSYCHOMETRIC: 1,
  PROBATION: 2,
  CUSTOM: 'custom'
};

const TestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = Boolean(id);
  
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    test_name: '',
    test_type: TEST_TYPES.PSYCHOMETRIC, // Default to Psychometric
    custom_test_type: '',
    description: '',
    instruction: '',
    closing_remarks: '',
    test_duration: 60,
    categories: [],
    test_status: 1
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/test/categories`);
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories. Please try again.');
      }
    };
    
    const fetchTest = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const res = await axios.get(`${API_URL}/api/test/tests/${id}`);
          
          if (res.data.success) {
            const test = res.data.data;
            
            // Map categories array to array of IDs (use _id for ObjectId reference)
            const categoryIds = test.categories ? test.categories.map(cat => cat._id || cat) : [];
            
            // Check if test_type is a custom type (string)
            const isCustom = typeof test.test_type === 'string' && 
                            !Object.values(TEST_TYPES).includes(test.test_type);
            
            setFormData({
              test_id: test.test_id,
              test_name: test.test_name,
              test_type: isCustom ? TEST_TYPES.CUSTOM : test.test_type,
              custom_test_type: isCustom ? test.test_type : '',
              description: test.description || '',
              instruction: test.instruction || '',
              closing_remarks: test.closing_remarks || '',
              test_duration: test.test_duration || 60,
              categories: categoryIds,
              test_status: test.test_status
            });
          }
        } catch (error) {
          console.error('Failed to fetch test:', error);
          setError('Failed to load test data. Please try again.');
          toast.error('Failed to load test data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchCategories();
    fetchTest();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'categories') {
      // Handle multi-select for categories
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData({
        ...formData,
        categories: selectedOptions
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      if (newCategories.includes(categoryId)) {
        // Remove if already selected
        return {
          ...prev,
          categories: newCategories.filter(id => id !== categoryId)
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          categories: [...newCategories, categoryId]
        };
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare the data
      const submitData = { ...formData };
      
      // Handle custom test type
      if (submitData.test_type === TEST_TYPES.CUSTOM) {
        if (!submitData.custom_test_type.trim()) {
          setError('Please enter a custom test type');
          toast.error('Please enter a custom test type');
          setSubmitting(false);
          return;
        }
        submitData.test_type = submitData.custom_test_type;
      }
      
      // Remove custom_test_type field as it's not needed in the API
      delete submitData.custom_test_type;
      
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/test/tests/${id}`, submitData);
      } else {
        res = await axios.post(`${API_URL}/api/test/tests`, submitData);
      }
      
      if (res.data.success) {
        setSuccess(`Test ${isEditMode ? 'updated' : 'created'} successfully`);
        toast.success(`Test ${isEditMode ? 'updated' : 'created'} successfully`);
        setTimeout(() => navigate('/tests'), 1500);
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} test:`, error);
      setError(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} test. Please try again.`);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} test. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/tests');
  };
  
  // Define select options
  const testTypeOptions = [
    { value: TEST_TYPES.PSYCHOMETRIC, label: 'Psychometric' },
    { value: TEST_TYPES.PROBATION, label: 'Probation' },
    { value: TEST_TYPES.CUSTOM, label: 'Custom' }
  ];
  
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
          title={isEditMode ? 'Edit Test' : 'Create Test'}
          subtitle={isEditMode ? 'Update test details' : 'Add a new test to the system'}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Tests', path: '/tests' },
            { label: isEditMode ? 'Edit Test' : 'Create Test' }
          ]}
          actionIcon={<QuizIcon />}
        />
        
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
          error={error}
          success={success}
          submitLabel={isEditMode ? 'Update Test' : 'Create Test'}
        >
          <FormSection title="Basic Information">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField
                    name="test_name"
                  label="Test Name"
                    value={formData.test_name}
                    onChange={handleChange}
                    required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="test_type"
                  label="Test Type"
                    value={formData.test_type}
                    onChange={handleChange}
                  options={testTypeOptions}
                    required
                />
              </Grid>
                
                {formData.test_type === TEST_TYPES.CUSTOM && (
                <Grid item xs={12} sm={6}>
                  <FormTextField
                      name="custom_test_type"
                    label="Custom Test Type"
                      value={formData.custom_test_type}
                      onChange={handleChange}
                      required
                    helperText="Specify your custom test type (e.g., 'Technical', 'Leadership')"
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="test_duration"
                  label="Duration (minutes)"
                    type="number"
                    value={formData.test_duration}
                    onChange={handleChange}
                    required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                    name="test_status"
                  label="Status"
                    value={formData.test_status}
                    onChange={handleChange}
                  options={statusOptions}
                />
              </Grid>
            </Grid>
          </FormSection>
          
          <FormSection title="Categories">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select one or more categories for this test:
                </Typography>
              
                {categories.length === 0 ? (
                  <Paper elevation={0} sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    border: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No categories available. Please create categories from the Categories page first.
                    </Typography>
                  </Paper>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    p: 1
                  }}>
                    {categories.map(category => (
                      <Chip
                        key={category._id}
                        label={category.cat_name}
                        onClick={() => handleCategoryToggle(category._id)}
                        color={formData.categories.includes(category._id) ? "primary" : "default"}
                        variant={formData.categories.includes(category._id) ? "filled" : "outlined"}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </FormSection>
          
          <FormSection title="Content">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormTextField
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  helperText="General description of the test purpose and content"
                />
              </Grid>
              <Grid item xs={12}>
                <FormTextField
                  name="instruction"
                  label="Instructions"
                  value={formData.instruction}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  helperText="Instructions displayed to candidates before starting the test"
                />
              </Grid>
              <Grid item xs={12}>
                <FormTextField
                  name="closing_remarks"
                  label="Closing Remarks"
                  value={formData.closing_remarks}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  helperText="Message displayed to candidates after completing the test"
                />
              </Grid>
            </Grid>
          </FormSection>
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default TestForm; 