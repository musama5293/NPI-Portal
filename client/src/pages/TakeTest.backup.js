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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000';
const QUESTIONS_PER_PAGE = 15;

// Enhanced Circular Timer Component
const CircularTimer = ({ timeRemaining, totalTime }) => {
  const theme = useTheme();
  
  const formatTime = (seconds) => {
    if (seconds === null) return { hours: '--', minutes: '--', seconds: '--' };
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const time = formatTime(timeRemaining);
  const progress = totalTime ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const isUrgent = timeRemaining < 300; // Last 5 minutes

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={140}
        thickness={4}
        sx={{
          color: theme.palette.grey[200],
          position: 'absolute',
        }}
      />
      <CircularProgress
        variant="determinate"
        value={progress}
        size={140}
        thickness={4}
        sx={{
          color: isUrgent ? theme.palette.error.main : theme.palette.primary.main,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
          transform: 'rotate(-90deg)!important',
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <TimerIcon sx={{ 
          color: isUrgent ? theme.palette.error.main : theme.palette.primary.main,
          fontSize: 28,
          mb: 1
        }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            color: isUrgent ? theme.palette.error.main : theme.palette.primary.main,
            fontWeight: 700,
            fontFamily: 'monospace',
            lineHeight: 1
          }}
        >
          {time.hours}:{time.minutes}:{time.seconds}
        </Typography>
        <Typography
          variant="caption"
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '0.7rem',
            fontWeight: 500,
            mt: 0.5
          }}
        >
          {isUrgent ? 'URGENT' : 'TIME LEFT'}
        </Typography>
      </Box>
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
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          await document.documentElement.msRequestFullscreen();
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        setFullscreenWarning(true);
      }
    };

    enterFullscreen();

    // Add fullscreen change listeners
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement);
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && !completed) {
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
  }, [currentPage, currentQuestionIndex, completed]);

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
          const { test, questions, answers, start_time, expiry_date, candidate } = res.data.data;
          
          setTest(test);
          setQuestions(questions);
          
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

          logActivity('test_start', { 
            test_id: test._id,
            total_questions: questions.length,
            total_pages: pages
          });
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
    if (questions.length > 0 && !questionStartTimeRef.current[questions[0].question_id]) {
      const firstQuestionId = questions[0].question_id;
      questionStartTimeRef.current[firstQuestionId] = Date.now();
      
      logActivity('question_start', {
        question_id: firstQuestionId,
        page: 0,
        question_index: 0
      });
      
      console.log('🟢 TEST STARTED - Started timing for first question:', firstQuestionId, 'at:', new Date().toLocaleTimeString());
    }
  }, [questions, logActivity]);

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
      
      logActivity('question_time', {
        question_id: questionId,
        time_spent: timeSpent,
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
          questionStartTimeRef.current[nextQuestionId] = Date.now();
          
          logActivity('question_start', {
            question_id: nextQuestionId,
            page: currentPage,
            question_index: nextIndex,
            navigation_type: 'auto_advance'
          });
          
          console.log('🟢 NEXT QUESTION - Started timing for question:', nextQuestionId, 'at:', new Date().toLocaleTimeString());
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
            questionStartTimeRef.current[nextQuestionId] = Date.now();
            
            logActivity('question_start', {
              question_id: nextQuestionId,
              page: currentPage + 1,
              question_index: 0,
              navigation_type: 'page_advance'
            });
            
            console.log('🟢 NEXT PAGE - Started timing for question:', nextQuestionId, 'at:', new Date().toLocaleTimeString());
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
        
        console.log('🏁 FINAL QUESTION - Question:', currentQuestionId, 'Time spent:', timeSpent, 'ms', '(', Math.round(timeSpent/1000), 'seconds )');
        
        logActivity('question_time', {
          question_id: currentQuestionId,
          time_spent: timeSpent,
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
          navigate('/my-tests');
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
            >
              {question.options.map((option, optionIndex) => (
                <FormControlLabel
                  key={option._id}
                  value={option.option_text}
                  control={
                    <Radio 
                      sx={{ 
                        color: theme.palette.grey[400],
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: currentAnswer === option.option_text ? 600 : 400,
                        color: currentAnswer === option.option_text ? theme.palette.primary.main : theme.palette.text.primary,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {option.option_text}
                    </Typography>
                  }
                  sx={{
                    mb: 1,
                    p: 2,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: currentAnswer === option.option_text ? theme.palette.primary.main : theme.palette.grey[300],
                    backgroundColor: currentAnswer === option.option_text ? 
                      theme.palette.primary.main + '08' : 
                      theme.palette.background.paper,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.primary.main + '08',
                      transform: 'translateY(-1px)',
                      boxShadow: theme.shadows[2]
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 'likert_scale':
        return (
          <Box>
          <FormControl component="fieldset" fullWidth>
              <Paper sx={{ 
                p: 3,
                backgroundColor: theme.palette.grey[50],
                border: `1px solid ${theme.palette.grey[200]}`
              }}>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  sx={{ gap: 1 }}
            >
                  {question.options && question.options.length > 0 ? 
                    question.options.map((option, index) => (
                <FormControlLabel
                        key={option._id || index}
                        value={option.option_text}
                        control={
                          <Radio 
                            sx={{ 
                              color: theme.palette.grey[400],
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              },
                              '&:hover': {
                                backgroundColor: theme.palette.primary.main + '08'
                              }
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: currentAnswer === option.option_text ? 600 : 400,
                              color: currentAnswer === option.option_text ? theme.palette.primary.main : theme.palette.text.primary,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {option.option_text}
                          </Typography>
                        }
                        sx={{
                          mb: 1,
                          p: 2,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: currentAnswer === option.option_text ? theme.palette.primary.main : theme.palette.grey[300],
                          backgroundColor: currentAnswer === option.option_text ? 
                            theme.palette.primary.main + '08' : 
                            theme.palette.background.paper,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.primary.main + '08',
                            transform: 'translateY(-1px)',
                            boxShadow: theme.shadows[2]
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer'
                        }}
                      />
                    )) :
                    [1, 2, 3, 4, 5].map((value) => (
                      <FormControlLabel
                        key={value}
                        value={value.toString()}
                        control={
                          <Radio 
                            sx={{ 
                              color: theme.palette.grey[400],
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              }
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: currentAnswer === value.toString() ? 600 : 400,
                              color: currentAnswer === value.toString() ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {value === 1 ? 'Strongly Disagree' :
                             value === 2 ? 'Disagree' :
                             value === 3 ? 'Neutral' :
                             value === 4 ? 'Agree' :
                             'Strongly Agree'}
                          </Typography>
                        }
                        sx={{
                          mb: 1,
                          p: 2,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: currentAnswer === value.toString() ? theme.palette.primary.main : theme.palette.grey[300],
                          backgroundColor: currentAnswer === value.toString() ? 
                            theme.palette.primary.main + '08' : 
                            theme.palette.background.paper,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.primary.main + '08',
                            transform: 'translateY(-1px)',
                            boxShadow: theme.shadows[2]
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer'
                        }}
                      />
                    ))
                  }
            </RadioGroup>
              </Paper>
          </FormControl>
          </Box>
        );
      
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Type your answer here..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.grey[50],
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '2px',
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

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: theme.palette.primary.main,
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <CircularProgress size={60} sx={{ color: 'white', mb: 3 }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 300 }}>
          Loading your test...
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
          Please wait while we prepare everything for you
          </Typography>
        </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        height: '100vh', 
        backgroundColor: theme.palette.error.main,
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        p: 3
      }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/my-tests')}
            sx={{
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              px: 4,
              py: 1.5
            }}
          >
            Back to My Tests
          </Button>
        </Paper>
        </Box>
    );
  }

  // Completed state
  if (completed) {
    return (
      <Box sx={{ 
        height: '100vh', 
        backgroundColor: theme.palette.success.main,
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        p: 3
      }}>
        <Zoom in={completed}>
          <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 600, borderRadius: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 100, color: theme.palette.success.main, mb: 3 }} />
            <Typography variant="h3" gutterBottom sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 700
            }}>
              Test Completed!
            </Typography>
            <Typography variant="h6" paragraph sx={{ color: theme.palette.text.secondary, mb: 4 }}>
              Congratulations! Your test has been submitted successfully.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => navigate('/my-tests')}
              sx={{
                backgroundColor: theme.palette.primary.main,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Return to My Tests
            </Button>
          </Paper>
        </Zoom>
        </Box>
    );
  }

  const currentPageQuestions = getCurrentPageQuestions();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: theme.palette.background.default
    }}>
      {/* Fullscreen Warning */}
      <Backdrop open={fullscreenWarning && !isFullscreen} sx={{ zIndex: 9998 }}>
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          maxWidth: 500,
          borderRadius: 3
        }}>
          <WarningIcon sx={{ fontSize: 80, color: theme.palette.warning.main, mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            Fullscreen Required
              </Typography>
          <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary }}>
            This test must be taken in fullscreen mode for security purposes. Please return to fullscreen to continue.
              </Typography>
                  <Button
            variant="contained" 
            startIcon={<FullscreenIcon />}
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              }
            }}
            sx={{
              backgroundColor: theme.palette.warning.main,
              borderRadius: 2,
              px: 4,
              py: 1.5
            }}
          >
            Enter Fullscreen
                  </Button>
            </Paper>
      </Backdrop>

      {/* Main Test Interface */}
      <Fade in={!pageTransition}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Paper sx={{ 
            mb: 3, 
            p: 3,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[3]
          }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={6}>
                <Typography variant="h4" gutterBottom sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 700
                }}>
                  {test?.is_supervisor_feedback ? 'Supervisor Feedback' : test?.test_name}
                </Typography>
                {test?.is_supervisor_feedback && candidateInfo && (
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    Providing feedback for: <strong>{candidateInfo.name}</strong>
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Stack direction="row" spacing={3} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-end' }}>
                  {timeRemaining !== null && (
                    <CircularTimer timeRemaining={timeRemaining} totalTime={totalTime} />
                  )}
                  <Box>
                    <Chip
                      icon={<QuestionAnswerIcon />}
                      label={`Page ${currentPage + 1} of ${totalPages}`}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 600,
                        mb: 1
                      }}
                    />
              </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Progress Section */}
          <Paper sx={{ 
            mb: 3, 
            p: 3,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[2]
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ 
                bgcolor: theme.palette.primary.main, 
                mr: 2
              }}>
                <ScheduleIcon />
              </Avatar>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                Page Progress
                    </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getPageCompletionPercentage()} 
              sx={{ 
                height: 10, 
                borderRadius: 5, 
                mb: 2,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundColor: theme.palette.primary.main
                }
              }} 
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {currentPageQuestions.filter(q => answers[q.question_id]).length} of {currentPageQuestions.length} questions answered
                    </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 600,
                backgroundColor: theme.palette.primary.main + '15',
                px: 2,
                py: 0.5,
                borderRadius: 1
              }}>
                {getPageCompletionPercentage()}% Complete
                    </Typography>
                  </Box>
          </Paper>

          {/* Questions */}
          <Stack spacing={3}>
            {currentPageQuestions.map((question, questionIndex) => {
              const isCurrentQuestion = questionIndex === currentQuestionIndex;
              const isAnswered = !!answers[question.question_id];
              
              return (
                <Fade key={question.question_id} in={true} timeout={300 + questionIndex * 100}>
                  <Card 
                    ref={el => questionRefs.current[questionIndex] = el}
                    sx={{ 
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: isCurrentQuestion ? theme.palette.primary.main : (isAnswered ? theme.palette.success.main : theme.palette.grey[300]),
                      backgroundColor: isCurrentQuestion ? 
                        theme.palette.primary.main + '08' : 
                        (isAnswered ? 
                          theme.palette.success.main + '08' : 
                          theme.palette.background.paper),
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isCurrentQuestion ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isCurrentQuestion ? theme.shadows[8] : theme.shadows[2],
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[6]
                      }
                    }}
                    onClick={() => navigateToQuestion(questionIndex)}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: isCurrentQuestion ? theme.palette.primary.main : (isAnswered ? theme.palette.success.main : theme.palette.grey[400]), 
                            mr: 2,
                            width: 40,
                            height: 40,
                            fontSize: '1.2rem',
                            fontWeight: 700
                          }}>
                            {currentPage * QUESTIONS_PER_PAGE + questionIndex + 1}
                          </Avatar>
                          <Typography variant="h6" sx={{ 
                            color: isCurrentQuestion ? theme.palette.primary.main : theme.palette.text.primary,
                            fontWeight: 600
                          }}>
                            Question {currentPage * QUESTIONS_PER_PAGE + questionIndex + 1}
                      </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          {isAnswered && (
                      <Chip
                              icon={<CheckIcon />}
                              label="Answered"
                        size="small"
                              sx={{
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          )}
                          {isCurrentQuestion && (
                            <Chip
                              icon={<VisibilityIcon />}
                              label="Current"
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Stack>
                    </Box>
                    
                      <Typography variant="h6" paragraph sx={{ 
                        color: theme.palette.text.primary,
                        lineHeight: 1.6,
                        mb: 3
                      }}>
                        {question.question_text}
                    </Typography>
                    
                      {question.question_text_urdu && (
                        <Typography variant="body1" paragraph sx={{ 
                          fontStyle: 'italic',
                          color: theme.palette.text.secondary,
                          backgroundColor: theme.palette.primary.main + '08',
                          p: 2,
                          borderRadius: 1,
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                          mb: 3
                        }}>
                          {question.question_text_urdu}
                      </Typography>
                    )}
                    
                      <Divider sx={{ my: 3, backgroundColor: theme.palette.grey[300] }} />
                      
                      {renderAnswerInput(question, questionIndex)}
                  </CardContent>
                  </Card>
                </Fade>
              );
            })}
          </Stack>

          {/* Navigation */}
          <Paper sx={{ 
            mt: 4, 
            p: 3,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[3]
          }}>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                  Questions {currentPage * QUESTIONS_PER_PAGE + 1} - {Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, questions.length)} of {questions.length}
                </Typography>
              </Grid>
              <Grid item>
                <Stack direction="row" spacing={2}>
                  {currentPage < totalPages - 1 ? (
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleNextPage}
                      disabled={!isPageComplete}
                      size="large"
                      sx={{
                        backgroundColor: isPageComplete ? theme.palette.primary.main : theme.palette.grey[400],
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: isPageComplete ? theme.palette.primary.dark : theme.palette.grey[400],
                        }
                      }}
                    >
                      Next Page
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={() => setSubmitDialogOpen(true)}
                      size="large"
                      sx={{
                        backgroundColor: theme.palette.success.main,
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: theme.palette.success.dark,
                        }
                      }}
                    >
                      Submit Test
                    </Button>
              )}
                </Stack>
          </Grid>
        </Grid>
          </Paper>
        </Box>
      </Fade>

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
  );
};

export default TakeTest; 