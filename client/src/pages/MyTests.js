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
  LinearProgress,
  Tabs,
  Tab,
  Container,
  Avatar
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
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  RocketLaunch as RocketIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as SparkleIcon,
  FlashOn as FlashIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleFilledIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

// NUST Theme Colors
const nustTheme = {
  primary: '#1e3a8a',     // Deep blue
  secondary: '#0ea5e9',   // Sky blue  
  accent: '#d97706',      // Orange
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6', 
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

// NUST Header Component
const NustTestHeader = ({ title, subtitle }) => {
  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${nustTheme.primary} 0%, ${nustTheme.secondary} 100%)`,
      color: 'white',
      py: 4,
      px: 3,
      borderRadius: 3,
      mb: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px)',
        backgroundSize: '30px 30px'
      }} />
      
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
          {/* University Logo */}
          <Avatar sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            width: 80,
            height: 80,
            border: '3px solid rgba(255,255,255,0.3)'
          }}>
            <SchoolIcon sx={{ fontSize: 40, color: 'white' }} />
          </Avatar>
          
          {/* Header Text */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{
              fontWeight: 700,
              fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
              mb: 1,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {title}
            </Typography>
            <Typography variant="h6" sx={{
              fontWeight: 400,
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.2rem' }
            }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// Add custom CSS animations
const styles = `
  @keyframes sparkle {
    0%, 100% { transform: rotate(0deg) scale(1); opacity: 1; }
    50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// Component for candidate tests
const CandidateTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchCandidateTests();
  }, [user]);
  
  const fetchCandidateTests = async () => {
    try {
      setLoading(true);
      
      // First check if the user is a candidate and has tests
      const statusRes = await axios.get(`${API_URL}/api/test/candidate-status`);
      
      if (!statusRes.data.success || !statusRes.data.data.hasCandidate) {
        setError('Your account is not properly linked to a candidate profile. Please contact support.');
        setLoading(false);
        return;
      }
      
      if (statusRes.data.data.testCount === 0) {
        // No tests assigned yet
        setTests([]);
        setLoading(false);
        return;
      }
      
      // Fetch the detailed test assignments
      const candidateId = statusRes.data.data.candidateId;
      
      const res = await axios.get(`${API_URL}/api/test/test-assignments/candidate/${candidateId}`);
      if (res.data.success) {
        setTests(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assigned tests:', error);
      setError('Failed to load your tests. Please try again later.');
      toast.error('Failed to load your tests. Please try again.');
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
    toast.info(`Starting test: ${test.test?.test_name}`);
    navigate(`/take-test/${test.assignment_id}`);
  };
  
  return (
    <MainLayout>
      <Box sx={{ minHeight: '100vh', backgroundColor: nustTheme.gray[50] }}>
        {/* NUST Header */}
        <NustTestHeader 
          title="MY ASSESSMENTS" 
          subtitle="National University of Sciences & Technology"
        />
        
        <Container maxWidth="lg" sx={{ pb: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress size={60} thickness={4} sx={{ color: nustTheme.accent }} />
              <Typography variant="h6" sx={{ mt: 2, color: nustTheme.gray[700] }}>
                Loading your assessments...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2, borderLeft: `4px solid ${nustTheme.accent}` }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          ) : (
          <Box>
            {/* Modern Hero Section */}
            <Box
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
                borderRadius: 4,
                p: 4,
                mb: 4, 
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${theme.palette.primary.main}20`
              }}
            >
              {/* Background decorative elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
                  opacity: 0.6
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, ${theme.palette.secondary.main}08, ${theme.palette.primary.main}08)`,
                  opacity: 0.4
                }}
              />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      borderRadius: 3,
                      p: 1.5,
                      mr: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <RocketIcon sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5
                      }}
                    >
                      Assessment Center
              </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Powered by NUST Excellence Framework
                  </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.1rem' }}>
                  Welcome to your personalized assessment dashboard. Each test is designed to unlock your potential
                  and showcase your capabilities in the NUST ecosystem.
              </Typography>
                
                {tests.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<TrophyIcon />}
                      label={`${tests.length} Assessment${tests.length !== 1 ? 's' : ''} Available`}
                      sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        color: 'white',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Chip
                      icon={<StarIcon />}
                      label="Your Excellence Journey"
                      variant="outlined"
                      sx={{ borderColor: theme.palette.primary.main, fontWeight: 500 }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
            
            {tests.length === 0 ? (
              /* Empty State - Modern Design */
              <Box
                sx={{ 
                  textAlign: 'center',
                  py: 8,
                  px: 4,
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}05 100%)`,
                  borderRadius: 4,
                  border: `2px dashed ${theme.palette.primary.main}30`
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
                      borderRadius: '50%',
                      width: 120,
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      position: 'relative'
                    }}
                  >
                    <PsychologyIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                    <SparkleIcon 
                      sx={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        fontSize: 24, 
                        color: 'secondary.main',
                        animation: 'sparkle 2s infinite'
                      }} 
                    />
                </Box>
                </motion.div>
                
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Ready for Your Journey
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph sx={{ fontWeight: 400 }}>
                  No assessments assigned yet, but great things are coming your way!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Stay tuned for upcoming challenges that will help you showcase your talents and grow within the NUST community.
                </Typography>
              </Box>
            ) : (
              /* Test Cards Grid - Ultra Modern Design */
              <>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
                  Your Assessments
                </Typography>
              <Grid container spacing={3}>
                {tests.map((test, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={test._id}>
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: index * 0.1,
                          duration: 0.4,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{ scale: 1.02 }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          background: nustTheme.white,
                          borderRadius: 3,
                          overflow: 'hidden',
                          position: 'relative',
                          border: `2px solid ${nustTheme.gray[200]}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 32px ${nustTheme.primary}20`,
                            border: `2px solid ${nustTheme.accent}`
                          }
                        }}
                        >
                          {/* Status Gradient Bar */}
                        <Box 
                          sx={{ 
                              height: 4,
                              background: test.completion_status === 'completed' 
                                ? '#10b981'
                                : test.completion_status === 'started' 
                                ? nustTheme.accent
                                : nustTheme.primary
                            }} 
                          />
                          
                          {/* Card Header */}
                          <Box
                            sx={{
                              background: `${nustTheme.gray[50]}`,
                              p: 3,
                              position: 'relative'
                            }}
                          >
                            {/* Floating Status Chip */}
                            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                            {getStatusChip(test.completion_status)}
                            </Box>
                            
                            {/* Test Icon */}
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                background: `linear-gradient(45deg, ${nustTheme.primary}, ${nustTheme.secondary})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                                position: 'relative'
                              }}
                            >
                              <PsychologyIcon sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            
                            {/* Test Title */}
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 1,
                                pr: 8, // Leave space for status chip
                                lineHeight: 1.3
                              }}
                            >
                              {test.test?.test_name || 'Assessment Challenge'}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              NUST Excellence Assessment
                            </Typography>
                          </Box>
                          
                          {/* Card Content */}
                          <CardContent sx={{ flexGrow: 1, p: 3, pt: 2 }}>
                            <Stack spacing={2.5}>
                              {/* Duration Info */}
                              {test.test?.duration_minutes && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 2,
                                      bgcolor: theme.palette.primary.main + '15',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <AccessTimeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                      DURATION
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {test.test.duration_minutes} minutes
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              
                              {/* Schedule Info */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2,
                                    bgcolor: theme.palette.info.main + '15',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <ScheduleIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                    SCHEDULED
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDate(test.scheduled_date)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Expiry Info */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2,
                                    bgcolor: theme.palette.error.main + '15',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <HourglassIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                    DEADLINE
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDate(test.expiry_date)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Time Left Indicator */}
                            {test.completion_status !== 'completed' && getTimeLeftIndicator(test.expiry_date)}
                          </Stack>
                          
                            {/* Completion Status for Completed Tests */}
                          {test.completion_status === 'completed' && (
                              <Box
                              sx={{ 
                                  mt: 3,
                                  p: 2.5,
                                  borderRadius: 3,
                                  background: 'linear-gradient(45deg, #4caf5015, #81c78415)',
                                  border: `1px solid ${theme.palette.success.main}25`,
                                  textAlign: 'center',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                              >
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(45deg, transparent 30%, rgba(76, 175, 80, 0.1) 50%, transparent 70%)',
                                    animation: 'shimmer 3s infinite'
                                  }}
                                />
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                  <TrophyIcon sx={{ color: 'success.main', fontSize: 28, mb: 1 }} />
                                  <Typography variant="subtitle1" color="success.main" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Assessment Completed!
                              </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Completed on {formatDate(test.end_time)}
                              </Typography>
                                </Box>
                              </Box>
                          )}
                        </CardContent>
                        
                          {/* Action Button */}
                        {test.completion_status !== 'completed' && (
                            <Box sx={{ p: 3, pt: 0 }}>
                            <Button
                              variant="contained"
                              fullWidth
                              disabled={!isTestAvailable(test)}
                              onClick={() => handleStartTest(test)}
                              sx={{ 
                                  py: 1.5,
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  fontSize: '1rem',
                                  background: isTestAvailable(test) 
                                    ? nustTheme.accent
                                    : nustTheme.gray[300],
                                  color: 'white',
                                  '&:hover': {
                                    background: isTestAvailable(test)
                                      ? '#b45309'
                                      : nustTheme.gray[400],
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 8px 25px ${nustTheme.accent}40`
                                  },
                                  '&:disabled': {
                                    background: nustTheme.gray[300],
                                    color: nustTheme.gray[500]
                                  }
                                }}
                                startIcon={
                                  test.completion_status === 'started' 
                                    ? <PlayArrowIcon /> 
                                    : <RocketIcon />
                                }
                              >
                                {test.completion_status === 'started' ? 'Continue Assessment' : 'Launch Assessment'}
                            </Button>
                            </Box>
                        )}
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
              </>
            )}
          </Box>
        )}
        </Container>
      </Box>
    </MainLayout>
  );
};

// Component for supervisor feedback tests
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
            { label: 'Supervisor Feedback', path: '/my-tests' }
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
                            <Typography variant="h6" component="h3" gutterBottom noWrap title={test.test?.test_name || 'Unnamed Test'}>
                              {test.test?.test_name || 'Unnamed Test'}
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

// Main MyTests component that routes based on user role
const MyTests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // If there's no user, show loading or handle accordingly
  if (!user) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  // Role ID 4 is for candidates
  if (user.role_id === 4) {
    return <CandidateTests />;
  }
  
  // For supervisors or admin users, show both tabs
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader 
          title="Test Dashboard" 
          subtitle="View and complete your assigned tests"
        />
        
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="My Tests" id="tab-0" />
            <Tab label="Supervisor Feedback" id="tab-1" />
          </Tabs>
        </Paper>
        
        {activeTab === 0 && <CandidateTests />}
        {activeTab === 1 && <SupervisorTests />}
      </Box>
    </MainLayout>
  );
};

export default MyTests; 