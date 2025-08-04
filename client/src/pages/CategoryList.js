import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { 
  FormTextField, 
  FormSection 
} from '../components/common/FormFields';
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  IconButton,
  Card,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const CategoryList = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ cat_name: '', description: '', probation_period_months: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/test/categories`);
      
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewCategory({
      ...newCategory,
      [e.target.name]: e.target.value
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.cat_name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      // No need to generate cat_id manually - the backend handles it now
      const res = await axios.post(`${API_URL}/api/test/categories`, {
        cat_name: newCategory.cat_name.trim(),
        description: newCategory.description?.trim(),
        probation_period_months: newCategory.probation_period_months || null,
        cat_status: 1
      });
      
      if (res.data.success) {
        setCategories([...categories, res.data.data]);
        setNewCategory({ cat_name: '', description: '', probation_period_months: '' });
        toast.success('Category added successfully');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error(error.response?.data?.message || 'Failed to add category. Please try again.');
    }
  };

  const handleStatusChange = async (categoryId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/test/categories/${categoryId}`, {
        cat_status: newStatus
      });
      
      if (res.data.success) {
        setCategories(categories.map(category => 
          category.cat_id === categoryId ? { ...category, cat_status: newStatus } : category
        ));
        toast.success(`Category ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update category status:', error);
      toast.error('Failed to update category status. Please try again.');
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const res = await axios.delete(`${API_URL}/api/test/categories/${categoryId}`);
        if (res.data.success) {
          setCategories(categories.filter(category => category.cat_id !== categoryId));
          toast.success('Category deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
        toast.error('Failed to delete category. Please try again.');
      }
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Categories"
          subtitle={`Manage test categories (${categories.length})`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Categories' }
          ]}
          actionIcon={<CategoryIcon />}
        />
        
        <Card sx={{ mb: 3, p: 2 }}>
          <FormSection title="Add New Category">
            <form onSubmit={handleAddCategory}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                id="cat_name"
                name="cat_name"
                    label="Category Name"
                placeholder="Enter category name"
                value={newCategory.cat_name}
                onChange={handleInputChange}
                required
                    size="small"
              />
                </Grid>
            
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                id="description"
                name="description"
                    label="Description"
                placeholder="Enter category description"
                value={newCategory.description}
                onChange={handleInputChange}
                    size="small"
              />
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    id="probation_period_months"
                    name="probation_period_months"
                    label="Probation (Months)"
                    placeholder="e.g., 3"
                    type="number"
                    value={newCategory.probation_period_months || ''}
                    onChange={handleInputChange}
                    size="small"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
            
                <Grid item xs={12} sm={2}>
                  <Button
                type="submit"
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    fullWidth
              >
                Add Category
                  </Button>
                </Grid>
              </Grid>
          </form>
          </FormSection>
        </Card>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Probation (Months)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map(category => (
                    <TableRow key={category._id} hover>
                      <TableCell>{category.cat_id}</TableCell>
                      <TableCell>{category.cat_name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>{category.probation_period_months ?? 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={category.cat_status === 1 ? 'Active' : 'Inactive'} 
                          color={category.cat_status === 1 ? 'success' : 'error'}
                          size="small"
                          variant={category.cat_status === 1 ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <IconButton
                            onClick={() => handleStatusChange(category.cat_id, category.cat_status)}
                            color={category.cat_status === 1 ? 'warning' : 'success'}
                            size="small"
                            title={category.cat_status === 1 ? 'Deactivate' : 'Activate'}
                          >
                            {category.cat_status === 1 ? <InactiveIcon /> : <ActiveIcon />}
                          </IconButton>
                          
                          <IconButton
                            onClick={() => handleDelete(category.cat_id)}
                            color="error"
                            size="small"
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                      No categories found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </MainLayout>
  );
};

export default CategoryList; 