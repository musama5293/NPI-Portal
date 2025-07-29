import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import {
  Box,
  Button,
  Chip,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const JobCandidates = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchJobDetails();
    fetchCandidates();
  }, [jobId]);
  
  const fetchJobDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}`);
      if (res.data.success) {
        setJob(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      setError('Failed to load job details. Please try again.');
      toast.error('Failed to load job details.');
    }
  };
  
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}/candidates`);
      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setError('Failed to load candidates. Please try again.');
      toast.error('Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditJob = () => {
    navigate(`/jobs/edit/${jobId}`);
  };
  
  const handleBack = () => {
    navigate('/jobs');
  };
  
  const handleAddCandidate = () => {
    navigate(`/candidates/create?job=${jobId}`);
  };
  
  const handleBulkImport = () => {
    navigate(`/users/import?job=${jobId}`);
  };
  
  const handleViewCandidate = (candidate) => {
    navigate(`/candidates/${candidate._id}`);
  };
  
  const columns = [
    {
      id: 'cand_name',
      label: 'Name',
      accessor: 'cand_name',
      render: (value, row) => (
        <Typography variant="body1" fontWeight="medium">
          {value}
        </Typography>
      )
    },
    {
      id: 'cand_cnic_no',
      label: 'CNIC',
      accessor: 'cand_cnic_no'
    },
    {
      id: 'cand_email',
      label: 'Email',
      accessor: 'cand_email'
    },
    {
      id: 'cand_mobile_no',
      label: 'Mobile',
      accessor: 'cand_mobile_no'
    },
    {
      id: 'hiring_status',
      label: 'Status',
      accessor: 'hiring_status',
      render: (value) => {
        let color;
        switch (value) {
          case 'applied':
            color = 'primary';
            break;
          case 'screening':
            color = 'info';
            break;
          case 'interview':
            color = 'warning';
            break;
          case 'selected':
            color = 'success';
            break;
          case 'rejected':
            color = 'error';
            break;
          case 'hired':
            color = 'success';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Chip
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            color={color}
            variant="outlined"
            size="small"
          />
        );
      }
    },
    {
      id: 'candidate_type',
      label: 'Type',
      accessor: 'candidate_type',
      render: (value) => (
        <Chip
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          color={value === 'hired' ? 'success' : value === 'probation' ? 'warning' : 'default'}
          variant="outlined"
          size="small"
        />
      )
    }
  ];
  
  if (loading && !job) {
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
          title={job?.job_name || 'Job Candidates'}
          subtitle={`Candidates for ${job?.job_name || 'this job'}`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Jobs', path: '/jobs' },
            { label: job?.job_name || 'Job Candidates' }
          ]}
          actionLabel="Add Candidate"
          actionIcon={<PersonAddIcon />}
          onActionClick={handleAddCandidate}
          extraActions={[
            {
              label: 'Bulk Import',
              icon: <CloudUploadIcon />,
              onClick: handleBulkImport
            },
            {
              label: 'Back to Jobs',
              icon: <ArrowBackIcon />,
              onClick: handleBack,
              color: 'secondary'
            }
          ]}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {job && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Job Details
                  </Typography>
                  <Typography variant="body1">
                    <strong>Job ID:</strong> {job.job_id}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Job Name:</strong> {job.job_name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Scale:</strong> {job.job_scale || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Type:</strong> {job.job_type || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Organization Details
                  </Typography>
                  <Typography variant="body1">
                    <strong>Organization:</strong> {job.organization?.org_name || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Institute:</strong> {job.institute?.inst_name || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Department:</strong> {job.department?.dept_name || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Category:</strong> {job.category?.cat_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1">
                    <strong>Description:</strong> {job.job_description || 'No description available'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditJob}
                >
                  Edit Job
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
        
        <DataTable
          columns={columns}
          data={candidates}
          isLoading={loading}
          title={`Candidates (${candidates.length})`}
          onRowClick={handleViewCandidate}
          searchPlaceholder="Search candidates..."
          emptyMessage={`No candidates found for this job. Use the "Add Candidate" or "Bulk Import" button to add candidates.`}
          containerProps={{ elevation: 2 }}
        />
      </Box>
    </MainLayout>
  );
};

export default JobCandidates; 