import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  useTheme
} from '@mui/material';
import { 
  Quiz as QuizIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Add as AddIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { getTests, deleteTest } from '../utils/api';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';

import { API_URL } from '../config/config';

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  
  useEffect(() => {
    fetchTests();
  }, []);
  
  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await getTests();
      
      if (res.data.success) {
        setTests(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast.error('Failed to load tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (testId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await axios.put(`${API_URL}/api/test/tests/${testId}`, {
        test_status: newStatus
      });
      
      if (res.data.success) {
        setTests(tests.map(test => 
          test.test_id === testId ? { ...test, test_status: newStatus } : test
        ));
        toast.success(`Test ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update test status:', error);
      toast.error(error.response?.data?.message || 'Failed to update test status. Please try again.');
    }
  };
  
  const handleViewQuestions = (test) => {
    navigate(`/test-questions/${test.test_id}`);
  };
  
  const getTestTypeData = (testType) => {
    if (typeof testType === 'number') {
      switch (testType) {
        case 1:
          return { label: 'Psychometric', color: 'primary' };
        case 2:
          return { label: 'Probation', color: 'success' };
        default:
          return { label: 'Unknown', color: 'default' };
      }
    } else if (typeof testType === 'string' && testType.trim() !== '') {
      return { label: testType, color: 'info' };
    } else {
      return { label: 'Unknown', color: 'default' };
    }
  };
  
  const openDeleteDialog = (test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTestToDelete(null);
  };
  
  const confirmDelete = async () => {
    if (!testToDelete) return;
    
    try {
      await deleteTest(testToDelete.test_id);
      toast.success('Test deleted successfully');
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    } finally {
      closeDeleteDialog();
    }
  };

  const handleAddTest = () => {
    navigate('/tests/create');
  };
  
  const handleEditTest = (test) => {
    navigate(`/tests/edit/${test.test_id}`);
  };

  // Define columns for the DataTable
  const columns = [
    { 
      id: 'test_id', 
      label: 'Test ID', 
      accessor: 'test_id' 
    },
    { 
      id: 'test_name', 
      label: 'Test Name', 
      accessor: 'test_name',
      render: (value, row) => (
        <Box>
          <Typography variant="body1" fontWeight="medium">
            {value}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Chip 
              size="small" 
              label={`${row.question_count || 0} questions`} 
              color={row.question_count ? "primary" : "default"}
              variant={row.question_count ? "default" : "outlined"}
            />
          </Box>
        </Box>
      )
    },
    { 
      id: 'test_type', 
      label: 'Test Type', 
      accessor: row => getTestTypeData(row.test_type).label,
      render: (value, row) => (
        <Chip
          label={getTestTypeData(row.test_type).label}
          color={getTestTypeData(row.test_type).color}
          size="small"
        />
      )
    },
    { 
      id: 'test_duration', 
      label: 'Duration (min)', 
      accessor: 'test_duration' 
    },
    { 
      id: 'categories', 
      label: 'Categories', 
      accessor: row => row.categories && row.categories.length > 0 
        ? row.categories.map(cat => cat.cat_name).join(', ') 
        : 'No categories'
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.test_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          color={row.test_status === 1 ? "success" : "error"}
          variant="outlined"
          size="small"
        />
      )
    }
  ];

  // Define actions for the DataTable
  const actions = [
    {
      name: 'View Questions',
      icon: <QuizIcon fontSize="small" />,
      tooltip: 'View or manage questions for this test',
      color: 'primary',
      onClick: handleViewQuestions
    },
    {
      name: row => row.test_status === 1 ? 'Deactivate' : 'Activate',
      icon: row => row.test_status === 1 ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />,
      tooltip: row => row.test_status === 1 ? 'Deactivate Test' : 'Activate Test',
      color: row => row.test_status === 1 ? 'success' : 'warning',
      onClick: (row) => handleStatusChange(row.test_id, row.test_status)
    },
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Test',
      color: 'info',
      onClick: handleEditTest
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Test',
      color: 'error',
      onClick: openDeleteDialog
    }
  ];
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Test Management"
          subtitle="Create, edit, and manage tests for candidates"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Test Management' }
          ]}
          actionLabel="Add New Test"
          actionIcon={<AddIcon />}
          onActionClick={handleAddTest}
        />
        
        <DataTable
          columns={columns}
          data={tests}
          isLoading={loading}
          title="Tests"
          actions={actions}
          onRowClick={handleViewQuestions}
          searchPlaceholder="Search tests..."
          emptyMessage="No tests found"
          onSearch={setSearchTerm}
          initialSearchTerm={searchTerm}
          getRowId={(row) => row.test_id}
          containerProps={{ elevation: 2 }}
        />
        
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the test "{testToDelete?.test_name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </MainLayout>
  );
};

export default TestList; 