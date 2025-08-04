import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Divider,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  Fade,
  Zoom,
  Backdrop,
  Avatar,
  Checkbox,
  Container,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Fullscreen as FullscreenIcon,
  Visibility as VisibilityIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  PlayArrow as PlayArrowIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config/config';
const QUESTIONS_PER_PAGE = 15;

// NUST Theme Colors
const nustTheme = {
  primary: '#1e3a8a', // NUST Blue
  secondary: '#0ea5e9', // Light Blue
  accent: '#d97706', // Orange/Brown for selections
  background: '#f8fafc',
  white: '#ffffff',
  gray: {
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
  }
};

// Enhanced Timer Component for NUST Style
const NustTimer = ({ timeRemaining, totalTime }) => {
  const formatTime = (seconds) => {
    if (seconds === null) return '00:00';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const time = formatTime(timeRemaining);
  const isUrgent = timeRemaining < 300; // Last 5 minutes

  return (
    <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
      backgroundColor: nustTheme.accent,
      color: 'white',
      px: 3,
      py: 1.5,
      borderRadius: '50px',
      fontWeight: 'bold',
      fontSize: '1.2rem',
            fontFamily: 'monospace',
      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
      border: isUrgent ? '2px solid #dc2626' : 'none',
      animation: isUrgent ? 'pulse 1s infinite' : 'none',
      '@keyframes pulse': {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.7 },
        '100%': { opacity: 1 },
      }
    }}>
      <TimerIcon sx={{ mr: 1, fontSize: '1.3rem' }} />
      {time}
    </Box>
  );
};

// NUST Header Component
const NustHeader = ({ testName, timeRemaining, totalTime, currentPage, totalPages }) => {
  return (
    <Paper 
      elevation={3}
      sx={{ 
        background: `linear-gradient(135deg, ${nustTheme.primary} 0%, ${nustTheme.secondary} 100%)`,
        color: 'white',
        p: 3,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderRadius: 0,
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: 1200,
        mx: 'auto'
      }}>
        {/* Left: Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ 
            bgcolor: 'white', 
            color: nustTheme.primary,
            width: 60,
            height: 60,
            mr: 3,
            border: '3px solid rgba(255,255,255,0.2)'
          }}>
            <SchoolIcon sx={{ fontSize: '2rem' }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {testName || 'PSYCHOMETRIC FORM'}
        </Typography>
            <Typography variant="h6" sx={{ 
              opacity: 0.9,
              fontWeight: 400,
            mt: 0.5
            }}>
              Test in Progress
            </Typography>
          </Box>
        </Box>

        {/* Right: Timer */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NustTimer timeRemaining={timeRemaining} totalTime={totalTime} />
        </Box>
      </Box>
    </Paper>
  );
};

// Progress Bar Component
const NustProgressBar = ({ progress, currentPage, totalPages }) => {
  return (
    <Box sx={{ 
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      bgcolor: 'white',
      borderTop: `2px solid ${nustTheme.gray[200]}`,
      p: 2,
      zIndex: 1000,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ color: nustTheme.gray[600], fontWeight: 500 }}>
            Progress: {progress}%
          </Typography>
          
          {/* Page Dots */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: i <= currentPage ? nustTheme.accent : nustTheme.gray[300],
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
            {totalPages > 5 && (
              <Typography variant="caption" sx={{ ml: 1, color: nustTheme.gray[500] }}>
                +{totalPages - 5} more
        </Typography>
            )}
      </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: nustTheme.gray[200],
            '& .MuiLinearProgress-bar': {
              bgcolor: nustTheme.accent,
              borderRadius: 4
            }
          }} 
        />
      </Container>
    </Box>
  );
};

// Terms and Conditions Component
const TermsAndConditions = ({ terms, onAccept, testName }) => {
  const [checked, setChecked] = useState(false);
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: nustTheme.background,
      py: 4
    }}>
      <Container maxWidth="md">
      <Paper sx={{ 
          p: 6, 
          borderRadius: 4,
          boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
          border: `1px solid ${nustTheme.gray[200]}`
        }}>
          {/* Header */}
          <Box sx={{ 
            textAlign: 'center',
            mb: 4,
            pb: 3,
            borderBottom: `2px solid ${nustTheme.gray[200]}`
          }}>
            <Avatar sx={{ 
              bgcolor: nustTheme.primary, 
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              fontSize: '2rem'
            }}>
              <SchoolIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
        <Typography variant="h4" gutterBottom sx={{ 
              color: nustTheme.primary,
          fontWeight: 700,
              mb: 1
        }}>
          Terms and Conditions
        </Typography>
            <Typography variant="h6" sx={{ 
              color: nustTheme.gray[600],
              fontWeight: 400
            }}>
          {testName}
        </Typography>
          </Box>
          
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4,
              backgroundColor: `${nustTheme.primary}08`,
              border: `1px solid ${nustTheme.primary}30`,
              '& .MuiAlert-icon': {
                color: nustTheme.primary
              }
            }}
          >
          Please read and accept the terms and conditions before proceeding with the test.
        </Alert>
        
        <Paper sx={{ 
            p: 4, 
          maxHeight: '400px', 
          overflow: 'auto',
            border: `2px solid ${nustTheme.gray[200]}`,
            borderRadius: 3,
            mb: 4,
            backgroundColor: nustTheme.gray[50]
        }}>
          {terms ? (
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                color: nustTheme.gray[700],
                lineHeight: 1.6
              }}>
              {terms}
            </Typography>
          ) : (
              <Typography variant="body1" sx={{ 
                fontStyle: 'italic', 
                color: nustTheme.gray[600],
                lineHeight: 1.6
              }}>
              By proceeding with this test, you agree to abide by the testing rules and regulations.
              You must complete the test honestly without any external assistance.
              Your responses will be recorded and evaluated according to the assessment criteria.
            </Typography>
          )}
        </Paper>
        
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4,
            p: 3,
            borderRadius: 3,
            backgroundColor: `${nustTheme.accent}08`,
            border: `1px solid ${nustTheme.accent}30`
          }}>
          <Checkbox 
            checked={checked} 
            onChange={(e) => setChecked(e.target.checked)} 
            sx={{ 
                color: nustTheme.accent,
              '&.Mui-checked': {
                  color: nustTheme.accent,
              },
            }}
          />
            <Typography variant="body1" sx={{ 
              fontWeight: 500,
              color: nustTheme.gray[700]
            }}>
            I have read and agree to the terms and conditions
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          fullWidth
          disabled={!checked}
          onClick={onAccept}
            size="large"
          sx={{
              py: 2,
              backgroundColor: checked ? nustTheme.accent : nustTheme.gray[300],
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
            '&:hover': {
                backgroundColor: checked ? '#b45309' : nustTheme.gray[300],
                transform: checked ? 'translateY(-2px)' : 'none',
                boxShadow: checked ? `0 6px 20px ${nustTheme.accent}40` : 'none'
            },
            '&.Mui-disabled': {
                backgroundColor: nustTheme.gray[300],
                color: nustTheme.gray[500]
              },
              transition: 'all 0.3s ease'
          }}
        >
          Continue to Test Instructions
        </Button>
      </Paper>
      </Container>
    </Box>
  );
};

// Test Instructions Component
const TestInstructions = ({ instructions, onStart, testName }) => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: nustTheme.background,
      py: 4
    }}>
      <Container maxWidth="md">
      <Paper sx={{ 
          p: 6, 
          borderRadius: 4,
          boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
          border: `1px solid ${nustTheme.gray[200]}`
        }}>
          {/* Header */}
          <Box sx={{ 
            textAlign: 'center',
            mb: 4,
            pb: 3,
            borderBottom: `2px solid ${nustTheme.gray[200]}`
          }}>
            <Avatar sx={{ 
              bgcolor: nustTheme.primary, 
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2
            }}>
              <QuestionAnswerIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
        <Typography variant="h4" gutterBottom sx={{ 
              color: nustTheme.primary,
          fontWeight: 700,
              mb: 1
        }}>
          Test Instructions
        </Typography>
            <Typography variant="h6" sx={{ 
              color: nustTheme.gray[600],
              fontWeight: 400
            }}>
          {testName}
        </Typography>
          </Box>
        
        <Paper sx={{ 
            p: 4, 
            borderRadius: 3,
            backgroundColor: nustTheme.gray[50],
            border: `1px solid ${nustTheme.gray[200]}`,
            mb: 4
          }}>
            {instructions ? (
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                color: nustTheme.gray[700],
                lineHeight: 1.6
              }}>
                {instructions}
          </Typography>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: nustTheme.primary,
                  fontWeight: 600,
                  mb: 3
                }}>
                  General Instructions:
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="body1" sx={{ 
                    color: nustTheme.gray[700],
                    lineHeight: 1.6
                  }}>
                    • Read each question carefully before selecting your answer
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: nustTheme.gray[700],
                    lineHeight: 1.6
                  }}>
                    • Select the option that best represents your response
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: nustTheme.gray[700],
                    lineHeight: 1.6
                  }}>
                    • You can navigate between questions using the navigation buttons
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: nustTheme.gray[700],
                    lineHeight: 1.6
                  }}>
                    • Make sure to answer all questions before submitting
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: nustTheme.gray[700],
                    lineHeight: 1.6
                  }}>
                    • Keep track of the time remaining displayed in the top right corner
                  </Typography>
                </Stack>
              </Box>
            )}
        </Paper>
          
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 4,
              backgroundColor: `${nustTheme.accent}08`,
              border: `1px solid ${nustTheme.accent}30`,
              '& .MuiAlert-icon': {
                color: nustTheme.accent
              }
            }}
          >
            Once you start the test, the timer will begin. Make sure you have a stable internet connection.
          </Alert>
        
        <Button
          variant="contained"
          fullWidth
          onClick={onStart}
            size="large"
            startIcon={<PlayArrowIcon />}
          sx={{
              py: 2,
              backgroundColor: nustTheme.accent,
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
            '&:hover': {
                backgroundColor: '#b45309',
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${nustTheme.accent}40`
              },
              transition: 'all 0.3s ease'
            }}
          >
            START TEST
        </Button>
      </Paper>
      </Container>
    </Box>
  );
};

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const questionRefs = useRef({});
  const pageStartTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef({});
  const fullscreenExitTimeRef = useRef(null);

  // Core state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [totalTime, setTotalTime] = useState(null);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState(null);
  
  // Test flow steps
  const [testStep, setTestStep] = useState('terms'); // 'terms', 'instructions', 'questions'
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [organizationTerms, setOrganizationTerms] = useState('');

  // Enhanced state for pagination and progress
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageAnswers, setPageAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPageComplete, setIsPageComplete] = useState(false);

  // Fullscreen and UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);

  // Activity tracking state
  const [activityLog, setActivityLog] = useState([]);
  const [questionTimes, setQuestionTimes] = useState({});

  // Initialize fullscreen on component mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        // Check if already in fullscreen to prevent violations
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.msFullscreenElement);
          
        if (!isCurrentlyFullscreen) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
          }
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        setFullscreenWarning(true);
      }
    };

    // Only enforce fullscreen when actually taking the test questions
    if (testStep === 'questions') {
      // Add a slight delay before requesting fullscreen to prevent immediate violations
      setTimeout(() => {
        enterFullscreen();
      }, 300);
    }

    // Add fullscreen change listeners
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement);
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Only show warnings when in the questions step
      if (!isCurrentlyFullscreen && !completed && testStep === 'questions') {
        logActivity('fullscreen_exit', { 
          page: currentPage,
          question_index: currentQuestionIndex,
          exit_time: Date.now()
        });
        fullscreenExitTimeRef.current = Date.now();
        setFullscreenWarning(true);
      } else if (isCurrentlyFullscreen && fullscreenExitTimeRef.current) {
        const offscreenDuration = Date.now() - fullscreenExitTimeRef.current;
        logActivity('fullscreen_enter', { 
          page: currentPage,
          question_index: currentQuestionIndex,
          offscreen_duration: offscreenDuration
        });
        fullscreenExitTimeRef.current = null;
        setFullscreenWarning(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [currentPage, currentQuestionIndex, completed, testStep]);

  // Activity logging function
  const logActivity = useCallback(async (activity_type, data) => {
    try {
      await axios.post(`${API_URL}/api/test/test-assignments/${id}/log-activity`, {
        activity_type,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [id]);

  // Fetch test data
  useEffect(() => {
    const fetchTestQuestions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/test/test-assignments/${id}/questions`);
        
        if (res.data.success) {
          const { test, questions, answers, start_time, expiry_date, candidate, organization } = res.data.data;
          
          setTest(test);
          setQuestions(questions);
          
          // Set organization terms if available
          if (organization && organization.terms_and_conditions) {
            setOrganizationTerms(organization.terms_and_conditions);
          }
          
          if (candidate && test.is_supervisor_feedback) {
            setCandidateInfo(candidate);
          }
          
          const answersMap = {};
          answers.forEach(answer => {
            answersMap[answer.question_id] = answer.answer;
          });
          setAnswers(answersMap);
          
          const pages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
          setTotalPages(pages);
          
          if (start_time && test.duration_minutes) {
            const startTime = new Date(start_time);
            const endTime = new Date(startTime.getTime() + test.duration_minutes * 60000);
            const now = new Date();
            const totalTestTime = test.duration_minutes * 60;
            
            setTotalTime(totalTestTime);
            
            const remaining = endTime - now;
            if (remaining > 0) {
              setTimeRemaining(Math.floor(remaining / 1000));
            } else {
              toast.error('Test time has expired!');
              handleSubmitTest();
            }
          }

          // Only log activity if we're starting the test questions
          if (testStep === 'questions') {
            logActivity('test_start', { 
              test_id: test._id,
              total_questions: questions.length,
              total_pages: pages
            });
          }
        } else {
          setError('Failed to load test questions');
        }
      } catch (error) {
        console.error('Error fetching test questions:', error);
        setError(error.response?.data?.message || 'Failed to load test questions');
        toast.error('Error loading test questions');
      } finally {
        setLoading(false);
      }
    };

    fetchTestQuestions();
  }, [id, logActivity]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitTest();
    }
  }, [timeRemaining]);

  // Get current page questions
  const getCurrentPageQuestions = () => {
    const startIndex = currentPage * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    return questions.slice(startIndex, endIndex);
  };

  // Start timing for the first question when test begins
  useEffect(() => {
    if (questions.length > 0 && testStep === 'questions' && !questionStartTimeRef.current[questions[0].question_id]) {
      const firstQuestionId = questions[0].question_id;
      const startTime = Date.now();
      questionStartTimeRef.current[firstQuestionId] = startTime;
      
      // Log detailed timing data for debugging
      console.log({
        activity_type: 'question_start',
        question_id: firstQuestionId,
        page: 0,
        question_index: 0,
        start_time: startTime,
        timestamp: startTime
      });
      
      logActivity('question_start', {
        question_id: firstQuestionId,
        page: 0,
        question_index: 0,
        start_time: startTime
      });
      
      console.log('🟢 TEST STARTED - Started timing for first question:', firstQuestionId, 'at:', new Date(startTime).toLocaleTimeString());
    }
  }, [questions, logActivity, testStep]);

  // Save progress function
  const saveProgress = useCallback(async () => {
    try {
      await axios.put(`${API_URL}/api/test/test-assignments/${id}/save-progress`, {
        current_page: currentPage,
        total_pages: totalPages,
        page_answers: pageAnswers
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [id, currentPage, totalPages, pageAnswers]);

  // Get page completion percentage
  const getPageCompletionPercentage = () => {
    const pageQuestions = getCurrentPageQuestions();
    if (!pageQuestions.length) return 0;
    
    const answeredCount = pageQuestions.filter(q => answers[q.question_id]).length;
    return Math.floor((answeredCount / pageQuestions.length) * 100);
  };

  // Check if current page is complete
  useEffect(() => {
    const pageQuestions = getCurrentPageQuestions();
    const allAnswered = pageQuestions.every(q => answers[q.question_id]);
    setIsPageComplete(allAnswered);
  }, [answers, currentPage, questions]);

  // Handle answer change with simple timing logic
  const handleAnswerChange = (questionId, value) => {
    const prevAnswer = answers[questionId];
    
    // 1. END timing for current question when option is clicked
    if (questionStartTimeRef.current[questionId]) {
      const timeSpent = Date.now() - questionStartTimeRef.current[questionId];
      
      console.log('⏱️ ANSWER CLICKED - Question:', questionId, 'Time spent:', timeSpent, 'ms', '(', Math.round(timeSpent/1000), 'seconds )');
      
      // Ensure time spent is a positive number and log it
      const validTimeSpent = Math.max(timeSpent, 0);
      
      // Log detailed timing data for debugging
      console.log({
        activity_type: 'question_time',
        question_id: questionId,
        time_spent: validTimeSpent,
        page: currentPage,
        question_index: currentQuestionIndex,
        navigation_type: 'answer_selection',
        timestamp: Date.now()
      });
      
      // Send timing data to server
      logActivity('question_time', {
        question_id: questionId,
        time_spent: validTimeSpent,
        page: currentPage,
        question_index: currentQuestionIndex,
        navigation_type: 'answer_selection'
      });
      
      // Clear the start time for this question (it's done)
      delete questionStartTimeRef.current[questionId];
    }
    
    // Save the answer
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    saveAnswer(questionId, value);

    logActivity('option_select', {
      question_id: questionId,
      answer: value,
      previous_answer: prevAnswer,
      page: currentPage,
      question_index: currentQuestionIndex,
      timestamp: Date.now()
    });

    // 2. START timing for next question immediately
    setTimeout(() => {
      const currentPageQuestions = getCurrentPageQuestions();
      const nextIndex = currentQuestionIndex + 1;
      
      if (nextIndex < currentPageQuestions.length) {
        // Next question on same page
        const nextQuestionId = currentPageQuestions[nextIndex]?.question_id;
        if (nextQuestionId) {
          const startTime = Date.now();
          questionStartTimeRef.current[nextQuestionId] = startTime;
          
          // Log detailed timing data for debugging
          console.log({
            activity_type: 'question_start',
            question_id: nextQuestionId,
            page: currentPage,
            question_index: nextIndex,
            navigation_type: 'auto_advance',
            start_time: startTime,
            timestamp: startTime
          });
          
          logActivity('question_start', {
            question_id: nextQuestionId,
            page: currentPage,
            question_index: nextIndex,
            navigation_type: 'auto_advance',
            start_time: startTime
          });
          
          console.log('🟢 NEXT QUESTION - Started timing for question:', nextQuestionId, 'at:', new Date(startTime).toLocaleTimeString());
        }
        
        setCurrentQuestionIndex(nextIndex);
        
        const nextQuestionRef = questionRefs.current[nextIndex];
        if (nextQuestionRef) {
          nextQuestionRef.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      } else {
        // Check if there's a next page
        const allQuestions = questions;
        const currentGlobalIndex = currentPage * QUESTIONS_PER_PAGE + currentQuestionIndex;
        const nextGlobalIndex = currentGlobalIndex + 1;
        
        if (nextGlobalIndex < allQuestions.length) {
          const nextQuestionId = allQuestions[nextGlobalIndex]?.question_id;
          if (nextQuestionId) {
            const startTime = Date.now();
            questionStartTimeRef.current[nextQuestionId] = startTime;
            
            logActivity('question_start', {
              question_id: nextQuestionId,
              page: currentPage + 1,
              question_index: 0,
              navigation_type: 'page_advance',
              start_time: startTime
            });
            
            console.log('🟢 NEXT PAGE - Started timing for question:', nextQuestionId, 'at:', new Date(startTime).toLocaleTimeString());
          }
        } else {
          console.log('🏁 LAST QUESTION - Test completed');
        }
      }
    }, 300);
  };

  // Save answer to server
  const saveAnswer = async (questionId, answer) => {
    try {
      await axios.post(`${API_URL}/api/test/test-assignments/${id}/submit-answer`, {
        question_id: questionId,
        answer
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save your answer. Please try again.');
    }
  };

  // Handle next page (simplified - timing handled by answer clicks)
  const handleNextPage = async () => {
    if (currentPage < totalPages - 1) {
      setPageTransition(true);
      
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setCurrentQuestionIndex(0);
        setPageTransition(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    }
  };

  // Handle test submission
  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);
      
      // Log final question timing before submission (only if not answered yet)
      const currentQuestions = getCurrentPageQuestions();
      const currentQuestionId = currentQuestions[currentQuestionIndex]?.question_id;
      
      if (currentQuestionId && questionStartTimeRef.current[currentQuestionId]) {
        const timeSpent = Date.now() - questionStartTimeRef.current[currentQuestionId];
        const validTimeSpent = Math.max(timeSpent, 0);
        
        console.log('🏁 FINAL QUESTION - Question:', currentQuestionId, 'Time spent:', validTimeSpent, 'ms', '(', Math.round(validTimeSpent/1000), 'seconds )');
        
        // Log detailed timing data for debugging
        console.log({
          activity_type: 'question_time',
          question_id: currentQuestionId,
          time_spent: validTimeSpent,
          page: currentPage,
          question_index: currentQuestionIndex,
          navigation_type: 'test_submission',
          timestamp: Date.now()
        });
        
        logActivity('question_time', {
          question_id: currentQuestionId,
          time_spent: validTimeSpent,
          page: currentPage,
          question_index: currentQuestionIndex,
          navigation_type: 'test_submission'
        });
        
        // Clear the final question timing
        delete questionStartTimeRef.current[currentQuestionId];
      }
      
      logActivity('test_submit', {
        final_page: currentPage,
        total_answered: Object.keys(answers).length,
        total_questions: questions.length
      });
      
      const res = await axios.put(`${API_URL}/api/test/test-assignments/${id}/complete-test`);
      
      if (res.data.success) {
        toast.success('Test submitted successfully!');
        setCompleted(true);
        
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        
        setTimeout(() => {
          navigate('/my-assessments');
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
      setSubmitDialogOpen(false);
    }
  };

  // Handle question navigation (simplified - no timing changes)
  const navigateToQuestion = (index) => {
    if (index >= 0 && index < getCurrentPageQuestions().length) {
      setCurrentQuestionIndex(index);
      
      const questionRef = questionRefs.current[index];
      if (questionRef) {
        questionRef.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setTestStep('instructions');
    
    // Log terms acceptance
    logActivity('terms_accepted', {
      timestamp: Date.now()
    });
  };
  
  // Handle test start after instructions
  const handleStartTest = () => {
    setTestStep('questions');
    
    // Log test start
    logActivity('test_start', { 
      test_id: test?._id,
      total_questions: questions.length,
      total_pages: totalPages
    });
  };

  // Render answer input with enhanced styling
  const renderAnswerInput = (question, questionIndex) => {
    const questionId = question.question_id;
    const currentAnswer = answers[questionId] || '';
    const isAnswered = !!currentAnswer;
    
    switch (question.question_type) {
      case 'single_choice':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              sx={{ gap: 0.5 }}
            >
              {question.options.map((option, optionIndex) => (
                <Box
                  key={option._id}
                  sx={{
                    border: `1px solid ${currentAnswer === option.option_text ? nustTheme.accent : nustTheme.gray[300]}`,
                    borderRadius: 2,
                    backgroundColor: currentAnswer === option.option_text ? 
                      nustTheme.accent : 
                      nustTheme.white,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: nustTheme.accent,
                      backgroundColor: currentAnswer === option.option_text ? 
                        nustTheme.accent : 
                        `${nustTheme.accent}08`
                    }
                  }}
                  onClick={() => handleAnswerChange(questionId, option.option_text)}
                >
                  <FormControlLabel
                  value={option.option_text}
                  control={
                    <Radio 
                      sx={{ 
                          display: 'none' // Hide the radio button, we'll use the box styling
                      }}
                    />
                  }
                  label={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        py: 1,
                        px: 2,
                        width: '100%'
                      }}>
                        {currentAnswer === option.option_text && (
                          <CheckIcon sx={{ 
                            color: 'white',
                            fontSize: '1.2rem',
                            mr: 1
                          }} />
                        )}
                    <Typography 
                          variant="body2" 
                      sx={{ 
                            color: currentAnswer === option.option_text ? 'white' : nustTheme.gray[700],
                            fontSize: '0.95rem',
                            fontWeight: currentAnswer === option.option_text ? 600 : 400
                      }}
                    >
                      {option.option_text}
                    </Typography>
                      </Box>
                  }
                  sx={{
                      width: '100%', 
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        width: '100%'
                      }
                    }}
                  />
                </Box>
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 'likert_scale':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              sx={{ gap: 0.5 }}
            >
                  {question.options && question.options.length > 0 ? 
                    question.options.map((option, index) => (
                  <Box
                        key={option._id || index}
                    sx={{
                      border: `1px solid ${currentAnswer === option.option_text ? nustTheme.accent : nustTheme.gray[300]}`,
                      borderRadius: 2,
                      backgroundColor: currentAnswer === option.option_text ? 
                        nustTheme.accent : 
                        nustTheme.white,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: nustTheme.accent,
                        backgroundColor: currentAnswer === option.option_text ? 
                          nustTheme.accent : 
                          `${nustTheme.accent}08`
                      }
                    }}
                    onClick={() => handleAnswerChange(questionId, option.option_text)}
                  >
                    <FormControlLabel
                        value={option.option_text}
                        control={
                          <Radio 
                            sx={{ 
                            display: 'none' // Hide the radio button
                            }}
                          />
                        }
                        label={
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          py: 1,
                          px: 2,
                          width: '100%'
                        }}>
                          {currentAnswer === option.option_text && (
                            <CheckIcon sx={{ 
                              color: 'white',
                              fontSize: '1.2rem',
                              mr: 1
                            }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: currentAnswer === option.option_text ? 'white' : nustTheme.gray[700],
                              fontSize: '0.95rem',
                              fontWeight: currentAnswer === option.option_text ? 600 : 400
                            }}
                          >
                            {option.option_text}
                          </Typography>
                        </Box>
                        }
                        sx={{
                        width: '100%', 
                        margin: 0,
                        '& .MuiFormControlLabel-label': {
                          width: '100%'
                        }
                      }}
                    />
                  </Box>
                )) :
                [
                  { value: '1', label: 'Strongly Disagree' },
                  { value: '2', label: 'Disagree' },
                  { value: '3', label: 'Neutral' },
                  { value: '4', label: 'Agree' },
                  { value: '5', label: 'Strongly Agree' }
                ].map((option) => (
                  <Box
                    key={option.value}
                    sx={{
                      border: `1px solid ${currentAnswer === option.value ? nustTheme.accent : nustTheme.gray[300]}`,
                      borderRadius: 2,
                      backgroundColor: currentAnswer === option.value ? 
                        nustTheme.accent : 
                        nustTheme.white,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: nustTheme.accent,
                        backgroundColor: currentAnswer === option.value ? 
                          nustTheme.accent : 
                          `${nustTheme.accent}08`
                      }
                    }}
                    onClick={() => handleAnswerChange(questionId, option.value)}
                  >
                      <FormControlLabel
                      value={option.value}
                        control={
                          <Radio 
                            sx={{ 
                            display: 'none'
                            }}
                          />
                        }
                        label={
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          py: 1,
                          px: 2,
                          width: '100%'
                        }}>
                          {currentAnswer === option.value && (
                            <CheckIcon sx={{ 
                              color: 'white',
                              fontSize: '1.2rem',
                              mr: 1
                            }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: currentAnswer === option.value ? 'white' : nustTheme.gray[700],
                              fontSize: '0.95rem',
                              fontWeight: currentAnswer === option.value ? 600 : 400
                            }}
                          >
                            {option.label}
                          </Typography>
                        </Box>
                        }
                        sx={{
                        width: '100%', 
                        margin: 0,
                        '& .MuiFormControlLabel-label': {
                          width: '100%'
                        }
                      }}
                    />
                  </Box>
                    ))
                  }
            </RadioGroup>
          </FormControl>
        );
      
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Type your answer here..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: nustTheme.white,
                border: `1px solid ${nustTheme.gray[300]}`,
                '&:hover': {
                  borderColor: nustTheme.accent,
                },
                '&.Mui-focused': {
                  borderColor: nustTheme.accent,
                  boxShadow: `0 0 0 2px ${nustTheme.accent}20`
                },
              },
            }}
          />
        );
      
      default:
        return (
          <Typography color="error">
            Question type "{question.question_type}" not supported
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Loading state */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: nustTheme.background,
          p: 3
        }}>
          <CircularProgress size={60} sx={{ mb: 3, color: nustTheme.primary }} />
          <Typography variant="h6" sx={{ mb: 1, color: nustTheme.gray[800] }}>
            Loading Test...
          </Typography>
          <Typography variant="body2" sx={{ color: nustTheme.gray[600] }}>
            Please wait while we prepare your test
          </Typography>
        </Box>
      )}
      
      {/* Error state */}
      {error && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: nustTheme.background,
          p: 3
        }}>
          <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/my-assessments')}
            sx={{
              backgroundColor: nustTheme.primary,
              '&:hover': {
                backgroundColor: '#1e40af'
              }
            }}
          >
            Return to My Assessments
          </Button>
        </Box>
      )}
      
      {/* Completed state */}
      {completed && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: nustTheme.background,
          p: 3
        }}>
          <Paper sx={{ 
            p: 6, 
            borderRadius: 4,
            maxWidth: 600,
            textAlign: 'center',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${nustTheme.gray[200]}`
          }}>
            <CheckCircleIcon sx={{ 
              fontSize: 100, 
              color: '#10b981',
              mb: 3
            }} />
            <Typography variant="h3" gutterBottom sx={{ 
              color: nustTheme.gray[800],
              fontWeight: 700,
              mb: 2
            }}>
              Test Completed!
            </Typography>
            <Typography variant="h6" paragraph sx={{ 
              color: nustTheme.gray[600], 
              mb: 4,
              lineHeight: 1.6
            }}>
              Congratulations! Your test has been submitted successfully.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/my-assessments')}
              sx={{
                backgroundColor: nustTheme.primary,
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#1e40af',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Return to My Assessments
            </Button>
          </Paper>
        </Box>
      )}
      
      {/* Terms and Conditions Step */}
      {!loading && !error && !completed && testStep === 'terms' && (
        <TermsAndConditions 
          terms={organizationTerms} 
          onAccept={handleAcceptTerms}
          testName={test?.test_name}
        />
      )}
      
      {/* Instructions Step */}
      {!loading && !error && !completed && testStep === 'instructions' && (
        <TestInstructions 
          instructions={test?.instruction} 
          onStart={handleStartTest}
          testName={test?.test_name}
        />
      )}
      
      {/* Questions Step */}
      {!loading && !error && !completed && testStep === 'questions' && (
        <Box>
          {/* Fullscreen warning */}
          <Backdrop
            sx={{ 
              color: '#fff', 
              zIndex: theme.zIndex.drawer + 1,
              backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }}
            open={fullscreenWarning}
          >
            <Paper sx={{ 
              p: 4, 
              maxWidth: 500, 
              textAlign: 'center',
              borderRadius: 2
            }}>
              <WarningIcon sx={{ fontSize: 60, color: theme.palette.warning.main, mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                Fullscreen Mode Required
              </Typography>
              <Typography variant="body1" paragraph>
                This test must be taken in fullscreen mode. Please click the button below to return to fullscreen.
              </Typography>
              <Button 
                variant="contained" 
                color="warning"
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                  } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                  } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                  }
                }}
                startIcon={<FullscreenIcon />}
                sx={{ mt: 2 }}
              >
                Return to Fullscreen
              </Button>
            </Paper>
          </Backdrop>
          
          {/* Test header */}
          <NustHeader testName={test?.test_name} timeRemaining={timeRemaining} totalTime={totalTime} currentPage={currentPage} totalPages={totalPages} />

          {/* Main Test Content */}
          <Box sx={{ 
            backgroundColor: nustTheme.background,
            minHeight: '100vh',
            pb: 12 // Space for fixed bottom progress bar
          }}>
            <Container maxWidth="md" sx={{ py: 3, px: { xs: 2, sm: 4 } }}>
              {/* Questions */}
              <Box sx={{ maxWidth: '100%', width: '100%' }}>
              <Stack spacing={3}>
                {(() => {
                  const currentPageQuestions = getCurrentPageQuestions();
                  return currentPageQuestions.map((question, questionIndex) => {
                    const isAnswered = !!answers[question.question_id];
                      const questionNumber = currentPage * QUESTIONS_PER_PAGE + questionIndex + 1;
                      const isCurrentQuestion = questionIndex === currentQuestionIndex;
                    
                    return (
                        <Fade key={question.question_id} in={true} timeout={300 + questionIndex * 50}>
                          <Paper
                          ref={el => questionRefs.current[questionIndex] = el}
                            elevation={isCurrentQuestion ? 4 : 1}
                          sx={{ 
                              p: { xs: 2, sm: 3 },
                            borderRadius: 3,
                              border: `2px solid ${isCurrentQuestion ? nustTheme.accent : (isAnswered ? '#10b981' : nustTheme.gray[200])}`,
                            backgroundColor: isCurrentQuestion ? 
                                `${nustTheme.accent}08` : 
                                (isAnswered ? '#10b98108' : nustTheme.white),
                              transition: 'all 0.3s ease',
                            cursor: 'pointer',
                              width: '100%',
                            '&:hover': {
                                borderColor: isCurrentQuestion ? nustTheme.accent : '#10b981',
                              transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            }
                          }}
                          onClick={() => navigateToQuestion(questionIndex)}
                        >
                            {/* Question Header */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 2,
                              pb: 2,
                              borderBottom: `1px solid ${nustTheme.gray[200]}`
                            }}>
                                <Avatar sx={{ 
                                bgcolor: isCurrentQuestion ? nustTheme.accent : (isAnswered ? '#10b981' : nustTheme.gray[400]), 
                                  mr: 2,
                                width: 32,
                                height: 32,
                                fontSize: '0.9rem',
                                  fontWeight: 700
                                }}>
                                {questionNumber}
                                </Avatar>
                                <Typography variant="h6" sx={{ 
                                color: isCurrentQuestion ? nustTheme.accent : nustTheme.gray[800],
                                fontWeight: 600,
                                fontSize: '1.1rem'
                                }}>
                                Question {questionNumber}
                                </Typography>
                              
                              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                                {isCurrentQuestion && (
                                  <Chip
                                    icon={<VisibilityIcon />}
                                    label="Current"
                                    size="small"
                                    sx={{
                                      backgroundColor: nustTheme.accent,
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                                {isAnswered && (
                                  <Chip
                                    icon={<CheckIcon />}
                                    label="Answered"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          
                            {/* Question Text - Left Aligned */}
                            <Box sx={{ 
                              textAlign: 'left', 
                              mb: 2,
                              width: '100%'
                            }}>
                              <Typography variant="body1" sx={{ 
                                color: nustTheme.gray[800],
                              lineHeight: 1.6,
                                fontSize: '1.05rem',
                                fontWeight: 500,
                                textAlign: 'left'
                            }}>
                              {question.question_text}
                            </Typography>
                          
                            {question.question_text_urdu && (
                                <Typography variant="body2" sx={{ 
                                fontStyle: 'italic',
                                  color: nustTheme.gray[600],
                                  mt: 1,
                                  fontSize: '0.95rem',
                                  textAlign: 'left'
                              }}>
                                {question.question_text_urdu}
                              </Typography>
                            )}
                            </Box>
                          
                            {/* Answer Options */}
                            <Box sx={{ width: '100%' }}>
                            {renderAnswerInput(question, questionIndex)}
                            </Box>
                          </Paper>
                      </Fade>
                    );
                  });
                })()}
              </Stack>
              </Box>

              {/* Navigation Button */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mt: 4 
              }}>
                      {currentPage < totalPages - 1 ? (
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardIcon />}
                          onClick={handleNextPage}
                          disabled={!isPageComplete}
                          size="large"
                          sx={{
                      backgroundColor: isPageComplete ? nustTheme.accent : nustTheme.gray[400],
                      color: 'white',
                            borderRadius: 2,
                      px: { xs: 4, sm: 6 },
                            py: 1.5,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                            fontWeight: 600,
                      boxShadow: `0 4px 12px ${isPageComplete ? nustTheme.accent : nustTheme.gray[400]}40`,
                            '&:hover': {
                        backgroundColor: isPageComplete ? '#b45309' : nustTheme.gray[400],
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${isPageComplete ? nustTheme.accent : nustTheme.gray[400]}60`
                      },
                      '&:disabled': {
                        backgroundColor: nustTheme.gray[300],
                        color: nustTheme.gray[500],
                        boxShadow: 'none'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    SAVE & CONTINUE
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={() => setSubmitDialogOpen(true)}
                          size="large"
                          sx={{
                      backgroundColor: '#10b981',
                      color: 'white',
                            borderRadius: 2,
                      px: { xs: 4, sm: 6 },
                            py: 1.5,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                            fontWeight: 600,
                      boxShadow: '0 4px 12px #10b98140',
                            '&:hover': {
                        backgroundColor: '#059669',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px #10b98160'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    SUBMIT TEST
                        </Button>
                      )}
            </Box>
            </Container>
          </Box>

          {/* Fixed Progress Bar at Bottom */}
          <NustProgressBar 
            progress={getPageCompletionPercentage()} 
            currentPage={currentPage} 
            totalPages={totalPages} 
          />

          {/* Submit Confirmation Dialog */}
          <Dialog
            open={submitDialogOpen}
            onClose={() => setSubmitDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3
              }
            }}
          >
            <DialogTitle sx={{ 
              color: theme.palette.text.primary, 
              fontWeight: 600,
              fontSize: '1.5rem'
            }}>
              Submit Test Confirmation
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: theme.palette.text.secondary, fontSize: '1rem' }}>
                {Object.keys(answers).length < questions.length && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
                    You have answered {Object.keys(answers).length} out of {questions.length} questions.
                    Unanswered questions will be marked as incomplete.
                  </Alert>
                )}
                
                Are you sure you want to submit your test? Once submitted, you cannot make any changes to your answers.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setSubmitDialogOpen(false)}
                sx={{ 
                  color: theme.palette.text.secondary,
                  borderRadius: 1,
                  px: 3
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTest} 
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{
                  backgroundColor: submitting ? theme.palette.grey[400] : theme.palette.success.main,
                  borderRadius: 1,
                  px: 4,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: submitting ? theme.palette.grey[400] : theme.palette.success.dark,
                  }
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
};

export default TakeTest; 