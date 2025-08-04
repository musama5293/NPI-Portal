import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Paper,
  useTheme,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  CheckCircleOutline as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  ScheduleOutlined as ScheduleIcon,
  Quiz as QuizIcon,
  HourglassTop as HourglassIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Timer as TimerIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import { API_URL } from '../config/config';

const SupervisorTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchSupervisorTests();
  }, [user]);
  
  const fetchSupervisorTests = async () => {
    try {
      setLoading(true);
      
      // Fetch supervisor feedback assignments
      const res = await axios.get(`${API_URL}/api/test/test-assignments/supervisor`);
      if (res.data.success) {
        setTests(res.data.data);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error('Failed to fetch supervisor feedback tests:', error);
      setError('Failed to load supervisor feedback tests. Please try again later.');
      toast.error('Failed to load supervisor feedback tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusChip = (status) => {
    switch(status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Completed"
            color="success"
            variant="outlined"
            size="small"
          />
        );
      case 'started':
        return (
          <Chip
            icon={<PauseIcon />}
            label="In Progress"
            color="warning"
            variant="outlined"
            size="small"
          />
        );
      default:
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Pending"
            color="primary"
            variant="outlined"
            size="small"
          />
        );
    }
  };
  
  const isTestAvailable = (test) => {
    const now = new Date();
    const scheduledDate = new Date(test.scheduled_date);
    const expiryDate = new Date(test.expiry_date);
    
    return now >= scheduledDate && now <= expiryDate && test.completion_status !== 'completed';
  };
  
  const getTimeLeftIndicator = (expiryDate) => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    if (now > expiry) {
      return (
        <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} />
          Expired
        </Typography>
      );
    }
    
    const totalMs = expiry - now;
    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    // Determine urgency based on time left
    let color = 'success.main';
    let progress = 25;
    
    if (days < 1) {
      color = 'error.main';
      progress = 90;
    } else if (days < 3) {
      color = 'warning.main';
      progress = 60;
    }
    
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <TimerIcon fontSize="small" sx={{ mr: 0.5, color }} />
          {days > 0 ? `${days} days` : ''} {hours} hours remaining
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 4, 
            borderRadius: 2,
            backgroundColor: theme.palette.background.default,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color
            }
          }} 
        />
      </Box>
    );
  };
  
  const renderTestDuration = (test) => {
    if (!test.test || !test.test.duration_minutes) return null;
    
    return (
      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        Duration: {test.test.duration_minutes} minutes
      </Typography>
    );
  };
  
  const handleStartTest = (test) => {
    toast.info(`Starting feedback form: ${test.test?.test_name}`);
    navigate(`/take-test/${test.assignment_id}`);
  };
  
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Supervisor Feedback Forms"
          subtitle="Complete feedback forms for candidates assigned to you"
          breadcrumbs={[
            { label: 'Dashboard', path: '/' },
            { label: 'Supervisor Feedback', path: '/supervisor-tests' }
          ]}
          icon={<PersonIcon />}
        />
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading feedback forms...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : (
          <Box>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 4, 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(25,118,210,0.04)',
                borderRadius: 2
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
                Supervisor Feedback Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                These are feedback forms assigned to you. Provide feedback for the candidates listed below.
                {tests.length > 0 && (
                  <Typography component="span" fontWeight="medium" color="primary.main">
                    {" "}You have {tests.length} feedback form{tests.length !== 1 ? 's' : ''} to complete.
                  </Typography>
                )}
              </Typography>
            </Paper>
            
            {tests.length === 0 ? (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.shadows[1]
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <PersonIcon sx={{ fontSize: 60, color: 'primary.light', opacity: 0.6 }} />
                </Box>
                <Typography variant="h5" gutterBottom color="primary.main">
                  No Feedback Forms Assigned
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You don't have any feedback forms assigned to you yet. Check back later.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {tests.map((test, index) => (
                  <Grid item xs={12} sm={6} md={4} key={test._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          },
                          borderRadius: 2,
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        {/* Status indicator at top of card */}
                        <Box 
                          sx={{ 
                            height: 4, 
                            width: '100%', 
                            bgcolor: test.completion_status === 'completed' ? 'success.main' : 
                                     test.completion_status === 'started' ? 'warning.main' : 'info.main'
                          }} 
                        />
                        
                        <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6" component="h3" gutterBottom noWrap title={test.test?.test_name || test.test_id?.test_name || 'Unnamed Test'}>
                              {test.test?.test_name || test.test_id?.test_name || 'Unnamed Test'}
                            </Typography>
                            {getStatusChip(test.completion_status)}
                          </Stack>
                          
                          {/* Show candidate information */}
                          {test.candidate_id && (
                            <Box sx={{ mt: 1, mb: 2 }}>
                              <Chip
                                icon={<PersonIcon />}
                                label={`For: ${test.candidate_id.candidate_name || 'Unknown Candidate'}`}
                                variant="outlined"
                                color="info"
                                size="small"
                                sx={{ mb: 1 }}
                              />
                            </Box>
                          )}
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Stack spacing={1} sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.info.main }} />
                              Scheduled: {formatDate(test.scheduled_date)}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <HourglassIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.error.main }} />
                              Expires: {formatDate(test.expiry_date)}
                            </Typography>
                            
                            {renderTestDuration(test)}
                            
                            {test.completion_status !== 'completed' && getTimeLeftIndicator(test.expiry_date)}
                          </Stack>
                          
                          {test.completion_status === 'completed' && (
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                mt: 2, 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)',
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.15)'}`
                              }}
                            >
                              <Typography variant="subtitle2" align="center" gutterBottom color="success.main">
                                Feedback Submitted
                              </Typography>
                              <Typography variant="h6" align="center" sx={{ fontWeight: 'bold' }}>
                                Score: {test.score || 'N/A'}
                              </Typography>
                              <Typography variant="caption" align="center" display="block" color="text.secondary">
                                Completed on: {formatDate(test.end_time)}
                              </Typography>
                            </Paper>
                          )}
                        </CardContent>
                        
                        {test.completion_status !== 'completed' && (
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                              variant="contained"
                              fullWidth
                              disabled={!isTestAvailable(test)}
                              color={isTestAvailable(test) ? "primary" : "inherit"}
                              startIcon={test.completion_status === 'started' ? <PlayArrowIcon /> : <PersonIcon />}
                              onClick={() => handleStartTest(test)}
                              sx={{ 
                                borderRadius: 1,
                                py: 1
                              }}
                            >
                              {test.completion_status === 'started' ? 'Continue Feedback' : 'Complete Feedback'}
                            </Button>
                          </CardActions>
                        )}
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
};

export default SupervisorTests; 