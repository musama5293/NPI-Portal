import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Grid,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Domain as DomainIcon,
  School as SchoolIcon,
  Apartment as ApartmentIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  AssignmentInd as AssignmentIndIcon,
  SupervisorAccount as SupervisorAccountIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const CandidateProfile = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      try {
        // Get candidate details
        const candidateRes = await axios.get(`${API_URL}/api/candidates/${id}`);
        
        if (candidateRes.data.success) {
          const candidateData = candidateRes.data.data;
          
          // Normalize data structure - the API returns the org_id as an object with org_name inside
          // But our component expects organization.org_name
          const normalizedData = {
            ...candidateData,
            organization: candidateData.org_id && typeof candidateData.org_id === 'object' ? 
              { org_id: candidateData.org_id.org_id, org_name: candidateData.org_id.org_name } : null,
            institute: candidateData.inst_id && typeof candidateData.inst_id === 'object' ? 
              { inst_id: candidateData.inst_id.inst_id, inst_name: candidateData.inst_id.inst_name } : null,
            department: candidateData.dept_id && typeof candidateData.dept_id === 'object' ? 
              { dept_id: candidateData.dept_id.dept_id, dept_name: candidateData.dept_id.dept_name } : null
          };
          
          // Fetch job data if present
          let currentJob = null;
          let appliedJob = null;
          
          // Fetch current job data
          if (candidateData.current_job_id) {
            try {
              const currentJobRes = await axios.get(`${API_URL}/api/jobs/${candidateData.current_job_id}`);
              if (currentJobRes.data.success) {
                currentJob = currentJobRes.data.data;
              }
            } catch (err) {
              console.error('Failed to fetch current job:', err);
            }
          }
          
          // Fetch applied job data
          if (candidateData.applied_job_id) {
            try {
              const appliedJobRes = await axios.get(`${API_URL}/api/jobs/${candidateData.applied_job_id}`);
              if (appliedJobRes.data.success) {
                appliedJob = appliedJobRes.data.data;
              }
            } catch (err) {
              console.error('Failed to fetch applied job:', err);
            }
          }
          
          // Fetch supervisor data if present
          let supervisorData = null;
          if (candidateData.supervisor_id) {
            try {
              const supervisorRes = await axios.get(`${API_URL}/api/users/${candidateData.supervisor_id}`);
              if (supervisorRes.data.success) {
                supervisorData = supervisorRes.data.data;
              }
            } catch (err) {
              console.error('Failed to fetch supervisor data:', err);
            }
          }
          
          // If the candidate has a user account, fetch that too
          if (normalizedData.user_account) {
            try {
              const userRes = await axios.get(`${API_URL}/api/users/${normalizedData.user_account}`);
              if (userRes.data.success) {
                normalizedData.user = userRes.data.data;
              }
            } catch (userError) {
              console.error('Failed to fetch user account:', userError);
            }
          }
          
          // Add job data to the candidate object
          normalizedData.current_job = currentJob;
          normalizedData.applied_job = appliedJob;
          normalizedData.supervisor = supervisorData;
          
          console.log('Normalized candidate data:', normalizedData);
          setCandidate(normalizedData);
        } else {
          toast.error('Failed to load candidate details');
        }
      } catch (error) {
        console.error('Failed to fetch candidate:', error);
        toast.error('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidate();
  }, [id]);
  
  const handleEditClick = () => {
    navigate(`/candidates/edit/${id}`);
  };
  
  const handleBackClick = () => {
    navigate('/candidates');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const getNationalityName = (nationality) => {
    switch (Number(nationality)) {
      case 1:
        return 'Pakistani';
      case 2:
        return 'Overseas Pakistani';
      case 3:
        return 'Foreign';
      default:
        return 'Unknown';
    }
  };

  const getGenderName = (gender) => {
    switch (gender) {
      case 'M':
        return 'Male';
      case 'F':
        return 'Female';
      case 'O':
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const getModeName = (mode) => {
    switch (mode) {
      case 'R':
        return 'Regular';
      case 'C':
        return 'Contract';
      case 'T':
        return 'Temporary';
      case 'P':
        return 'Part-time';
      default:
        return 'Unknown';
    }
  };

  const getHiringStatusName = (status) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'screening':
        return 'Screening';
      case 'interview':
        return 'Interview';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Rejected';
      case 'hired':
        return 'Hired';
      default:
        return 'Unknown';
    }
  };

  const getHiringStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'info';
      case 'screening':
        return 'info';
      case 'interview':
        return 'warning';
      case 'selected':
        return 'success';
      case 'rejected':
        return 'error';
      case 'hired':
        return 'success';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <PageHeader 
            title="Candidate Profile" 
            subtitle="View candidate details"
            breadcrumbs={[
              { label: 'Candidates', path: '/candidates' },
              { label: 'Profile' }
            ]}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Box>
      </MainLayout>
    );
  }
  
  if (!candidate) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <PageHeader 
            title="Candidate Not Found" 
            subtitle="The requested candidate could not be found"
            breadcrumbs={[
              { label: 'Candidates', path: '/candidates' },
              { label: 'Profile' }
            ]}
          />
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Candidate Not Found
            </Typography>
            <Typography variant="body1" paragraph>
              The candidate you are looking for does not exist or has been removed.
            </Typography>
            <Button 
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackClick}
            >
              Back to Candidates
            </Button>
          </Paper>
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader 
          title="Candidate Profile" 
          subtitle="View candidate details"
          breadcrumbs={[
            { label: 'Candidates', path: '/candidates' },
            { label: candidate.cand_name }
          ]}
          actionIcon={<EditIcon />}
          actionLabel="Edit Candidate"
          onActionClick={handleEditClick}
          backButton={{
            label: 'Back to Candidates',
            onClick: handleBackClick
          }}
        />
        
        <Grid container spacing={3}>
          {/* Left Column - Basic Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3, boxShadow: theme.shadows[2] }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column', 
                  alignItems: 'center',
                  mb: 3 
                }}>
                  <Avatar 
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2.5rem',
                      mb: 2
                    }}
                  >
                    {candidate.cand_name ? candidate.cand_name.charAt(0).toUpperCase() : 'C'}
                  </Avatar>
                  <Typography variant="h5" fontWeight={600}>
                    {candidate.cand_name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {candidate.cand_email}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Chip 
                      label={getHiringStatusName(candidate.hiring_status)}
                      color={getHiringStatusColor(candidate.hiring_status)}
                    />
                    <Chip 
                      label={getModeName(candidate.cand_mode)}
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Contact Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                    Contact Information
                  </Typography>
                  
                  <List dense disablePadding>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <EmailIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={candidate.cand_email || 'Not provided'}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PhoneIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Mobile" 
                        secondary={candidate.cand_mobile_no || 'Not provided'}
                      />
                    </ListItem>
                    
                    {candidate.cand_whatsapp_no && (
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <PhoneIcon fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="WhatsApp" 
                          secondary={candidate.cand_whatsapp_no}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Personal Information */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                    Personal Information
                  </Typography>
                  
                  <List dense disablePadding>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <BadgeIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="CNIC" 
                        secondary={candidate.cand_cnic_no || 'Not provided'}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PersonIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Gender" 
                        secondary={getGenderName(candidate.cand_gender)}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PersonIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Nationality" 
                        secondary={getNationalityName(candidate.cand_nationality)}
                      />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
            
            {/* Organization Information */}
            <Card sx={{ boxShadow: theme.shadows[2] }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                  Organization Information
                </Typography>
                
                <List dense disablePadding>
                  {candidate.organization && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <DomainIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Organization" 
                        secondary={candidate.organization.org_name || `ID: ${candidate.org_id}`}
                      />
                    </ListItem>
                  )}
                  
                  {candidate.institute && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <SchoolIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Institute" 
                        secondary={candidate.institute.inst_name || `ID: ${candidate.inst_id}`}
                      />
                    </ListItem>
                  )}
                  
                  {candidate.department && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ApartmentIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Department" 
                        secondary={candidate.department.dept_name || `ID: ${candidate.dept_id}`}
                      />
                    </ListItem>
                  )}
                  
                  {candidate.supervisor_id && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <SupervisorAccountIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Supervisor" 
                        secondary={candidate.supervisor ? candidate.supervisor.username : 'Not assigned'}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right Column - Tabs and Details */}
          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: theme.shadows[2], mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Employment Information" />
                  <Tab label="Test Results" />
                  <Tab label="Documents" />
                </Tabs>
              </Box>
              
              {/* Employment Information Tab */}
              {tabValue === 0 && (
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Current Job
                        </Typography>
                        
                        {candidate.current_job ? (
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {candidate.current_job.job_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Department: {candidate.current_job.department?.dept_name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Grade: {candidate.current_job.job_scale || 'N/A'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No current job assigned
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Applied Job
                        </Typography>
                        
                        {candidate.applied_job ? (
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {candidate.applied_job.job_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Department: {candidate.applied_job.department?.dept_name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Grade: {candidate.applied_job.job_scale || 'N/A'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No job application recorded
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Employment Details
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Employment Mode
                            </Typography>
                            <Typography variant="body1">
                              {getModeName(candidate.cand_mode)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Candidate Type
                            </Typography>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                              {candidate.candidate_type || 'Initial'}
                            </Typography>
                          </Grid>
                          
                          {candidate.candidate_type === 'probation' && candidate.probation_end_date && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                Probation End Date
                              </Typography>
                              <Typography variant="body1">
                                {new Date(candidate.probation_end_date).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          )}
                          
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Hiring Status
                            </Typography>
                            <Chip 
                              label={getHiringStatusName(candidate.hiring_status)}
                              color={getHiringStatusColor(candidate.hiring_status)}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              )}
              
              {/* Test Results Tab */}
              {tabValue === 1 && (
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Test Results
                  </Typography>
                  
                  {candidate.test_assignments && candidate.test_assignments.length > 0 ? (
                    <List>
                      {candidate.test_assignments.map((assignment) => (
                        <ListItem key={assignment._id}>
                          <ListItemIcon>
                            <AssignmentIndIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={assignment.test.test_name}
                            secondary={`Status: ${assignment.status} | Score: ${assignment.score || 'N/A'}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No test results available
                    </Typography>
                  )}
                </CardContent>
              )}
              
              {/* Documents Tab */}
              {tabValue === 2 && (
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Documents
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    No documents uploaded for this candidate
                  </Typography>
                </CardContent>
              )}
            </Card>
            
            {/* Account Information (if linked to a user account) */}
            {candidate.user && (
              <Card sx={{ boxShadow: theme.shadows[2] }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    User Account Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Username
                      </Typography>
                      <Typography variant="body1">
                        {candidate.user.username}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Account Status
                      </Typography>
                      <Chip 
                        label={candidate.user.user_status === 1 ? 'Active' : 'Inactive'} 
                        color={candidate.user.user_status === 1 ? 'success' : 'error'}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Account Type
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {candidate.user.user_type || 'Candidate'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default CandidateProfile; 