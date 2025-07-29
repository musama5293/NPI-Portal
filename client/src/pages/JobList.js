import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import {
  Box,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  VisibilityOutlined as ViewIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const JobList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, jobId: null, jobName: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchJobs();
  }, []);
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/jobs`);
      
      if (res.data.success) {
        // Get assigned candidate counts for each job
        const jobsWithCounts = await Promise.all(res.data.data.map(async (job) => {
          try {
            const candidatesRes = await axios.get(`${API_URL}/api/jobs/${job.job_id}/candidates`);
            return {
              ...job,
              assigned_count: candidatesRes.data.count || 0,
              available_slots: job.vacancy_count ? job.vacancy_count - (candidatesRes.data.count || 0) : "Unlimited"
            };
          } catch (error) {
            console.error(`Failed to get candidates for job ${job.job_id}:`, error);
            return {
              ...job,
              assigned_count: 0,
              available_slots: job.vacancy_count || "Unlimited"
            };
          }
        }));
        
        setJobs(jobsWithCounts);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDeleteDialog = (job) => {
    setDeleteDialog({
      open: true,
      jobId: job.job_id,
      jobName: job.job_name
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      jobId: null,
      jobName: ''
    });
  };

  const handleDelete = async () => {
      try {
      const res = await axios.delete(`${API_URL}/api/jobs/${deleteDialog.jobId}`);
        if (res.data.success) {
        setJobs(jobs.filter(job => job.job_id !== deleteDialog.jobId));
          toast.success('Job deleted successfully');
        handleCloseDeleteDialog();
        }
      } catch (error) {
        console.error('Failed to delete job:', error);
        toast.error(error.response?.data?.message || 'Failed to delete job. Please try again.');
      }
  };
  
  const handleAddJob = () => {
    navigate('/jobs/create');
  };

  const handleEditJob = (job) => {
    navigate(`/jobs/edit/${job.job_id}`);
  };

  const handleViewJob = (job) => {
    navigate(`/jobs/candidates/${job.job_id}`);
  };

  const columns = [
    { 
      id: 'job_id', 
      label: 'ID', 
      accessor: 'job_id' 
    },
    { 
      id: 'job_name', 
      label: 'Job Name', 
      accessor: 'job_name',
      render: (value, row) => (
        <Box>
          <Typography variant="body1" fontWeight="medium">
            {value}
          </Typography>
          {row.job_description && (
            <Typography variant="caption" color="text.secondary">
              {row.job_description.substring(0, 50)}...
            </Typography>
          )}
        </Box>
      )
    },
    { 
      id: 'job_scale', 
      label: 'Scale', 
      accessor: row => row.job_scale || '-',
    },
    { 
      id: 'institute', 
      label: 'Institute', 
      accessor: row => row.institute?.inst_name || '-',
    },
    { 
      id: 'department', 
      label: 'Department', 
      accessor: row => row.department?.dept_name || '-',
    },
    { 
      id: 'category', 
      label: 'Category', 
      accessor: row => row.category?.cat_name || '-',
    },
    { 
      id: 'vacancies', 
      label: 'Vacancies', 
      accessor: row => row.vacancy_count || 'Unlimited',
      render: (value, row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color={row.available_slots === 0 ? 'error' : 'text.secondary'}>
            {row.assigned_count}/{row.vacancy_count || '∞'} Used
          </Typography>
          {row.available_slots === 0 && (
            <Chip 
              label="Full" 
              color="error" 
              size="small" 
              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} 
            />
          )}
        </Box>
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: row => row.job_status === 1 ? 'Active' : 'Inactive',
      render: (value, row) => (
        <Chip 
          label={value}
          color={row.job_status === 1 ? 'success' : 'error'}
          variant="outlined"
          size="small"
        />
      )
    }
  ];

  const actions = [
    {
      name: 'View',
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'View Job Details',
      color: 'info',
      onClick: handleViewJob
    },
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Job',
      color: 'primary',
      onClick: handleEditJob
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Job',
      color: 'error',
      onClick: handleOpenDeleteDialog
    }
  ];
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Job Management"
          subtitle="Create, edit, and manage job positions"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Job Management' }
          ]}
          actionLabel="Add New Job"
          actionIcon={<AddIcon />}
          onActionClick={handleAddJob}
        />
        
        <DataTable
          columns={columns}
          data={jobs}
          isLoading={loading}
          title="Jobs"
          actions={actions}
          onRowClick={handleViewJob}
          searchPlaceholder="Search jobs..."
          emptyMessage="No jobs found. Create a new job to get started."
          onSearch={setSearchTerm}
          initialSearchTerm={searchTerm}
          getRowId={(row) => row.job_id}
          containerProps={{ elevation: 2 }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the job "{deleteDialog.jobName}"?
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default JobList; 