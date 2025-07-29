import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  useTheme,
  Fade,
  Zoom,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Fullscreen as FullscreenIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  QuestionAnswer as QuestionAnswerIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  ExitToApp as ExitToAppIcon,
  Flag as FlagIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';

const API_URL = 'http://localhost:5000';

// Custom Tab Panel
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Enhanced Stats Card Component
const StatsCard = ({ title, value, icon, color, description }) => {
  const theme = useTheme();
  
  return (
    <Zoom in={true} timeout={500}>
      <Card sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.grey[200]}`,
        borderRadius: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[6],
          borderColor: theme.palette.primary.main,
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: color, 
              width: 48, 
              height: 48,
            }}>
              {icon}
            </Avatar>
          </Box>
          <Typography variant="h4" sx={{ 
            color: color, 
            fontWeight: 700,
            mb: 1
          }}>
            {value}
          </Typography>
          <Typography variant="h6" sx={{ 
            color: theme.palette.text.primary, 
            fontWeight: 600,
            mb: 1
          }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            lineHeight: 1.4
          }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// Activity Timeline Component
const ActivityTimeline = ({ activities }) => {
  const theme = useTheme();
  
  const getActivityIcon = (type) => {
    const iconMap = {
      'test_start': <PlayArrowIcon sx={{ color: theme.palette.success.main }} />,
      'page_change': <TrendingUpIcon sx={{ color: theme.palette.info.main }} />,
      'question_start': <QuestionAnswerIcon sx={{ color: theme.palette.primary.main }} />,
      'question_end': <StopIcon sx={{ color: theme.palette.secondary.main }} />,
      'option_select': <CheckCircleIcon sx={{ color: theme.palette.success.main }} />,
      'fullscreen_exit': <ExitToAppIcon sx={{ color: theme.palette.error.main }} />,
      'fullscreen_enter': <FullscreenIcon sx={{ color: theme.palette.success.main }} />,
      'test_submit': <FlagIcon sx={{ color: theme.palette.warning.main }} />,
    };
    return iconMap[type] || <ScheduleIcon />;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'test_start': theme.palette.success.main,
      'page_change': theme.palette.info.main,
      'question_start': theme.palette.primary.main,
      'question_end': theme.palette.secondary.main,
      'option_select': theme.palette.success.main,
      'fullscreen_exit': theme.palette.error.main,
      'fullscreen_enter': theme.palette.success.main,
      'test_submit': theme.palette.warning.main,
    };
    return colorMap[type] || theme.palette.primary.main;
  };

  const getActivityDescription = (activity) => {
    const { activity_type, data } = activity;
    
    switch (activity_type) {
      case 'test_start':
        return `Started test with ${data?.total_questions || 0} questions across ${data?.total_pages || 0} pages`;
      case 'page_change':
        return `Moved from page ${(data?.from_page || 0) + 1} to page ${(data?.to_page || 0) + 1} (${data?.time_spent ? Math.round(data.time_spent / 1000) : 0}s spent)`;
      case 'question_start':
        return `Started viewing question ${data?.question_index + 1 || 'N/A'} on page ${(data?.page || 0) + 1}`;
      case 'question_end':
        return `Finished question ${data?.question_index + 1 || 'N/A'} (${data?.time_spent ? Math.round(data.time_spent / 1000) : 0}s spent)`;
      case 'option_select':
        return `Selected "${data?.answer || 'N/A'}" for question ${data?.question_index + 1 || 'N/A'}`;
      case 'fullscreen_exit':
        return `Exited fullscreen mode on page ${(data?.page || 0) + 1}`;
      case 'fullscreen_enter':
        return `Returned to fullscreen mode (${data?.offscreen_duration ? Math.round(data.offscreen_duration / 1000) : 0}s offline)`;
      case 'test_submit':
        return `Submitted test with ${data?.total_answered || 0}/${data?.total_questions || 0} questions answered`;
      default:
        return `${activity_type.replace('_', ' ')} activity`;
    }
  };

  return (
    <Box sx={{ maxHeight: '500px', overflowY: 'auto', pr: 1 }}>
      {activities.map((activity, index) => (
        <Fade key={index} in={true} timeout={300 + index * 50}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mr: 2,
              minWidth: 40
            }}>
              <Avatar sx={{ 
                bgcolor: getActivityColor(activity.activity_type),
                width: 36,
                height: 36,
              }}>
                {getActivityIcon(activity.activity_type)}
              </Avatar>
              {index < activities.length - 1 && (
                <Box sx={{ 
                  width: 2, 
                  height: 30, 
                  backgroundColor: theme.palette.grey[300],
                  mt: 1,
                  borderRadius: 1
                }} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ 
                p: 2, 
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.grey[200]}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: theme.shadows[2],
                  borderColor: getActivityColor(activity.activity_type),
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: getActivityColor(activity.activity_type),
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.8rem'
                  }}>
                    {activity.activity_type.replace('_', ' ')}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    backgroundColor: theme.palette.grey[100],
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontFamily: 'monospace'
                  }}>
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.text.primary,
                  lineHeight: 1.4
                }}>
                  {getActivityDescription(activity)}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Fade>
      ))}
    </Box>
  );
};

const ResultsDashboard = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchResults(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const fetchResults = async (page, limit) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/test/results?page=${page + 1}&limit=${limit}`);
      
      if (res.data.success) {
        setResults(res.data.data);
        setTotalResults(res.data.total);
      } else {
        toast.error('Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Error fetching results');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedResults = async (assignment) => {
    try {
      const res = await axios.get(`${API_URL}/api/test/test-assignments/${assignment._id}/detailed-scores`);
      
      if (res.data.success) {
        console.log('Detailed results received:', res.data.data);
        console.log('Activity analytics:', res.data.data.activityAnalytics);
        console.log('Question times data:', res.data.data.activityAnalytics?.questionTimes);
        
        setSelectedResult(assignment);
        setScoreBreakdown(res.data.data);
        setActivityData(res.data.data.activityAnalytics);
        setDetailsOpen(true);
      } else {
        toast.error('Failed to fetch detailed results');
      }
    } catch (error) {
      console.error('Error fetching detailed results:', error);
      toast.error('Error fetching detailed results');
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    if (score >= 40) return theme.palette.error.main;
    return theme.palette.error.dark;
  };

  const getCompletionStatus = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: theme.palette.success.main, icon: <CheckCircleIcon /> };
      case 'in_progress':
        return { label: 'In Progress', color: theme.palette.info.main, icon: <ScheduleIcon /> };
      case 'not_started':
        return { label: 'Not Started', color: theme.palette.grey[500], icon: <AccessTimeIcon /> };
      default:
        return { label: 'Unknown', color: theme.palette.grey[500], icon: <QuestionAnswerIcon /> };
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredResults = results.filter(result =>
    result.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.test_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <Box sx={{ 
        p: 3,
        backgroundColor: theme.palette.background.default,
        minHeight: 'calc(100vh - 64px)'
      }}>
        {/* Header */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[1]
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: theme.palette.primary.main, 
              mr: 2,
              width: 56,
              height: 56,
            }}>
              <DashboardIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700
              }}>
                Results Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                Comprehensive test analytics and performance insights
              </Typography>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by candidate name, email, or test name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.grey[50],
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Paper>

        {/* Results Table */}
        <Paper sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[1],
          position: 'relative'
        }}>
          {loading && <LinearProgress sx={{ position: 'absolute', top: 0, width: '100%' }} />}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: `0 4px 12px ${theme.palette.primary.main}60`,
                    height: '64px',
                  }}>
                    <TableCell sx={{ 
                      color: 'black', 
                      fontWeight: 700, 
                      fontSize: '1.1rem',
                      padding: '16px',
                      borderBottom: `2px solid ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.grey[100]
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1.5, fontSize: '1.3rem', color: theme.palette.primary.main }} />
                        Candidate
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'black', 
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      padding: '16px',
                      borderBottom: `2px solid ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.grey[100]
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ mr: 1.5, fontSize: '1.3rem', color: theme.palette.primary.main }} />
                        Test
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'black', 
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      padding: '16px',
                      borderBottom: `2px solid ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.grey[100]
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon sx={{ mr: 1.5, fontSize: '1.3rem', color: theme.palette.primary.main }} />
                        Score
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'black', 
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      padding: '16px',
                      borderBottom: `2px solid ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.grey[100]
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon sx={{ mr: 1.5, fontSize: '1.3rem', color: theme.palette.primary.main }} />
                        Status
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'black', 
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      padding: '16px',
                      borderBottom: `2px solid ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.grey[100]
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1.5, fontSize: '1.3rem', color: theme.palette.primary.main }} />
                        Completed
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'black', 
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      padding: '16px',
                      borderBottom: `2px solid ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.grey[100]
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result, index) => {
                    const status = getCompletionStatus(result.completion_status);
                    
                    return (
                      <Fade key={result._id} in={true} timeout={300 + index * 50}>
                        <TableRow sx={{ 
                          '&:hover': { 
                            backgroundColor: theme.palette.grey[50],
                          } 
                        }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ 
                                mr: 2, 
                                bgcolor: theme.palette.primary.main,
                              }}>
                                {result.candidate_name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                  {result.candidate_name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                  {result.candidate_email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                              {result.test_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {result.completion_status === 'completed' ? (
                              <Chip
                                label={`${result.overall_score?.toFixed(1) || 0}%`}
                                sx={{
                                  backgroundColor: getScoreColor(result.overall_score || 0),
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              sx={{
                                backgroundColor: status.color + '20',
                                color: status.color,
                                fontWeight: 600,
                                border: `1px solid ${status.color}`
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {result.completion_status === 'completed' ? (
                              result.completed_at ? (
                                <Typography variant="body2" sx={{ 
                                  color: theme.palette.text.primary,
                                  fontWeight: 500,
                                  backgroundColor: theme.palette.success.light + '20',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  border: `1px solid ${theme.palette.success.light}`
                                }}>
                                  {new Date(result.completed_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              ) : (
                                <Typography variant="body2" sx={{ 
                                  color: theme.palette.warning.main,
                                  fontWeight: 500,
                                  backgroundColor: theme.palette.warning.light + '20',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  border: `1px solid ${theme.palette.warning.light}`
                                }}>
                                  Date Missing
                                </Typography>
                              )
                            ) : (
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 500,
                                backgroundColor: theme.palette.grey[200],
                                padding: '6px 10px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                Not Completed
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              startIcon={<VisibilityIcon />}
                              onClick={() => fetchDetailedResults(result)}
                              disabled={result.completion_status !== 'completed'}
                              sx={{
                                backgroundColor: result.completion_status === 'completed' ? 
                                  theme.palette.primary.main : 
                                  theme.palette.grey[400],
                                borderRadius: 2,
                                fontWeight: 600,
                                '&:hover': {
                                  backgroundColor: result.completion_status === 'completed' ? 
                                    theme.palette.primary.dark : 
                                    theme.palette.grey[400],
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      </Fade>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalResults}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* Detailed Results Modal */}
        <Dialog 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            m: 0
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Detailed Results: {selectedResult?.test_name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Candidate: {selectedResult?.candidate_name}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setDetailsOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                backgroundColor: theme.palette.grey[50]
              }}
            >
              <Tab 
                icon={<PsychologyIcon />}
                label="Score Breakdown" 
                sx={{ 
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main
                  }
                }}
              />
              <Tab 
                icon={<TimelineIcon />}
                label="Activity Analytics" 
                sx={{ 
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main
                  }
                }}
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {scoreBreakdown && (
                <Box>
                  {/* Overall Score Card */}
                  <Card sx={{ 
                    mb: 4,
                    background: `linear-gradient(135deg, ${getScoreColor(scoreBreakdown.overall_score)}20 0%, ${getScoreColor(scoreBreakdown.overall_score)}05 100%)`,
                    border: `2px solid ${getScoreColor(scoreBreakdown.overall_score)}`,
                    borderRadius: 3,
                    boxShadow: theme.shadows[4]
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 5 }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                        <CircularProgress
                          variant="determinate"
                          value={100}
                          size={160}
                          thickness={8}
                          sx={{ color: theme.palette.grey[200] }}
                        />
                        <CircularProgress
                          variant="determinate"
                          value={scoreBreakdown.overall_score}
                          size={160}
                          thickness={8}
                          sx={{ 
                            color: getScoreColor(scoreBreakdown.overall_score),
                            position: 'absolute',
                            left: 0,
                            '& .MuiCircularProgress-circle': {
                              strokeLinecap: 'round',
                            },
                          }}
                        />
                        <Box sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}>
                          <Typography variant="h2" sx={{ 
                            color: getScoreColor(scoreBreakdown.overall_score),
                            fontWeight: 700,
                            lineHeight: 1
                          }}>
                            {scoreBreakdown.overall_score.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h4" sx={{ 
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                        mb: 1
                      }}>
                        Overall Performance
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                        {scoreBreakdown.total_answered} of {scoreBreakdown.total_questions} questions answered
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Domain and Subdomain Performance - Hierarchical Layout */}
                  <Typography variant="h4" gutterBottom sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <PsychologyIcon sx={{ mr: 2, fontSize: 32 }} />
                    Comprehensive Performance Analysis
                  </Typography>

                  {/* Summary Overview Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        p: 3,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
                        border: `1px solid ${theme.palette.primary.main}30`,
                        borderRadius: 3
                      }}>
                        <Typography variant="h3" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>
                          {Object.keys(scoreBreakdown.domain_scores).length}
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                          Domains Evaluated
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        p: 3,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}15 0%, ${theme.palette.secondary.main}05 100%)`,
                        border: `1px solid ${theme.palette.secondary.main}30`,
                        borderRadius: 3
                      }}>
                        <Typography variant="h3" sx={{ color: theme.palette.secondary.main, fontWeight: 700, mb: 1 }}>
                          {scoreBreakdown.subdomain_scores ? scoreBreakdown.subdomain_scores.length : 0}
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                          Subdomains Assessed
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        p: 3,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${getScoreColor(scoreBreakdown.overall_score)}15 0%, ${getScoreColor(scoreBreakdown.overall_score)}05 100%)`,
                        border: `1px solid ${getScoreColor(scoreBreakdown.overall_score)}30`,
                        borderRadius: 3
                      }}>
                        <Typography variant="h3" sx={{ color: getScoreColor(scoreBreakdown.overall_score), fontWeight: 700, mb: 1 }}>
                          {scoreBreakdown.overall_score.toFixed(1)}%
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                          Overall Score
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Hierarchical Domain-Subdomain Layout */}
                  <Box sx={{ mb: 4 }}>
                    {Object.entries(scoreBreakdown.domain_scores).map(([domainKey, domainScore], domainIndex) => {
                      // Group subdomains by domain
                      const domainSubdomains = scoreBreakdown.subdomain_scores 
                        ? scoreBreakdown.subdomain_scores.filter(sub => {
                            // Match subdomains to domains (you might need to adjust this logic based on your data structure)
                            return sub.domain_id === domainIndex + 1 || 
                                   sub.subdomain_name.toLowerCase().includes(domainKey.toLowerCase().split('_')[0]);
                          })
                        : [];

                      return (
                        <Card key={domainKey} sx={{ 
                          mb: 3,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${getScoreColor(domainScore)}08 0%, ${theme.palette.background.paper} 100%)`,
                          border: `1px solid ${getScoreColor(domainScore)}20`,
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[6],
                            borderColor: getScoreColor(domainScore)
                          }
                        }}>
                          {/* Domain Header */}
                          <Box sx={{ 
                            p: 3,
                            background: `linear-gradient(135deg, ${getScoreColor(domainScore)}20 0%, ${getScoreColor(domainScore)}10 100%)`,
                            borderBottom: `1px solid ${getScoreColor(domainScore)}30`
                          }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar sx={{ 
                                    bgcolor: getScoreColor(domainScore),
                                    width: 48,
                                    height: 48,
                                    mr: 2,
                                    fontSize: '16px',
                                    fontWeight: 700
                                  }}>
                                    {domainScore.toFixed(0)}%
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" sx={{ 
                                      color: theme.palette.text.primary,
                                      fontWeight: 700,
                                      textTransform: 'capitalize'
                                    }}>
                                      {domainKey.replace('_', ' ')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                      {domainSubdomains.length} subdomains
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={6}>
                                <Box sx={{ position: 'relative' }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={domainScore} 
                                    sx={{ 
                                      height: 16,
                                      borderRadius: 8,
                                      backgroundColor: theme.palette.grey[200],
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 8,
                                        background: `linear-gradient(90deg, ${getScoreColor(domainScore)} 0%, ${getScoreColor(domainScore)}80 100%)`
                                      }
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ 
                                    position: 'absolute',
                                    right: 8,
                                    top: -4,
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.75rem'
                                  }}>
                                    {domainScore.toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={12} md={3}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Chip 
                                    label={domainScore >= 80 ? 'Excellent' : domainScore >= 60 ? 'Good' : domainScore >= 40 ? 'Average' : 'Needs Improvement'}
                                    sx={{
                                      backgroundColor: getScoreColor(domainScore),
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                  <Chip 
                                    label="Domain"
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: getScoreColor(domainScore),
                                      color: getScoreColor(domainScore),
                                      fontWeight: 600
                                    }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>

                          {/* Subdomains Grid */}
                          {domainSubdomains.length > 0 && (
                            <Box sx={{ p: 3 }}>
                              <Typography variant="subtitle1" sx={{ 
                                color: theme.palette.text.secondary,
                                fontWeight: 600,
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                <SpeedIcon sx={{ mr: 1, fontSize: 18 }} />
                                Related Subdomains ({domainSubdomains.length})
                              </Typography>
                              <Grid container spacing={2}>
                                {domainSubdomains.map((subdomain, subIndex) => (
                                  <Grid item xs={12} sm={6} md={4} lg={3} key={subIndex}>
                                    <Card sx={{ 
                                      p: 2,
                                      height: '100%',
                                      textAlign: 'center',
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${getScoreColor(subdomain.percentage)}15 0%, ${theme.palette.background.paper} 100%)`,
                                      border: `1px solid ${getScoreColor(subdomain.percentage)}30`,
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: theme.shadows[4],
                                        borderColor: getScoreColor(subdomain.percentage)
                                      }
                                    }}>
                                      <Avatar sx={{ 
                                        bgcolor: getScoreColor(subdomain.percentage),
                                        width: 40,
                                        height: 40,
                                        mx: 'auto',
                                        mb: 1.5,
                                        fontSize: '14px',
                                        fontWeight: 700
                                      }}>
                                        {subdomain.percentage}%
                                      </Avatar>
                                      <Typography variant="body1" sx={{ 
                                        color: theme.palette.text.primary,
                                        fontWeight: 600,
                                        mb: 1.5,
                                        fontSize: '0.9rem',
                                        lineHeight: 1.2
                                      }}>
                                        {subdomain.subdomain_name}
                                      </Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={subdomain.percentage} 
                                        sx={{ 
                                          height: 6,
                                          borderRadius: 3,
                                          backgroundColor: theme.palette.grey[200],
                                          '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            backgroundColor: getScoreColor(subdomain.percentage)
                                          }
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ 
                                        color: theme.palette.text.secondary,
                                        fontWeight: 600,
                                        mt: 1,
                                        display: 'block'
                                      }}>
                                        {subdomain.percentage >= 80 ? 'Excellent' : 
                                         subdomain.percentage >= 60 ? 'Good' : 
                                         subdomain.percentage >= 40 ? 'Fair' : 'Needs Work'}
                                      </Typography>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </Card>
                      );
                    })}
                  </Box>

                  {/* Orphaned Subdomains (if any don't match to domains) */}
                  {scoreBreakdown.subdomain_scores && (() => {
                    const orphanedSubdomains = scoreBreakdown.subdomain_scores.filter(sub => {
                      return !Object.keys(scoreBreakdown.domain_scores).some((domainKey, domainIndex) => 
                        sub.domain_id === domainIndex + 1 || 
                        sub.subdomain_name.toLowerCase().includes(domainKey.toLowerCase().split('_')[0])
                      );
                    });
                    
                    if (orphanedSubdomains.length > 0) {
                      return (
                        <Card sx={{ 
                          mb: 3,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${theme.palette.grey[300]}08 0%, ${theme.palette.background.paper} 100%)`,
                          border: `1px solid ${theme.palette.grey[300]}20`
                        }}>
                          <Box sx={{ 
                            p: 3,
                            background: `linear-gradient(135deg, ${theme.palette.grey[300]}20 0%, ${theme.palette.grey[300]}10 100%)`,
                            borderBottom: `1px solid ${theme.palette.grey[300]}30`
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.text.primary,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <SpeedIcon sx={{ mr: 1 }} />
                              Additional Assessments ({orphanedSubdomains.length})
                            </Typography>
                          </Box>
                          <Box sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                              {orphanedSubdomains.map((subdomain, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                  <Card sx={{ 
                                    p: 2,
                                    height: '100%',
                                    textAlign: 'center',
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${getScoreColor(subdomain.percentage)}15 0%, ${theme.palette.background.paper} 100%)`,
                                    border: `1px solid ${getScoreColor(subdomain.percentage)}30`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: theme.shadows[4]
                                    }
                                  }}>
                                    <Avatar sx={{ 
                                      bgcolor: getScoreColor(subdomain.percentage),
                                      width: 40,
                                      height: 40,
                                      mx: 'auto',
                                      mb: 1.5,
                                      fontSize: '14px',
                                      fontWeight: 700
                                    }}>
                                      {subdomain.percentage}%
                                    </Avatar>
                                    <Typography variant="body1" sx={{ 
                                      color: theme.palette.text.primary,
                                      fontWeight: 600,
                                      mb: 1.5,
                                      fontSize: '0.9rem'
                                    }}>
                                      {subdomain.subdomain_name}
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={subdomain.percentage} 
                                      sx={{ 
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: theme.palette.grey[200],
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 3,
                                          backgroundColor: getScoreColor(subdomain.percentage)
                                        }
                                      }}
                                    />
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </Card>
                      );
                    }
                    return null;
                  })()}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {activityData && (
                <Box>
                  {/* Enhanced Stats Overview */}
                  <Typography variant="h4" gutterBottom sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AnalyticsIcon sx={{ mr: 2, fontSize: 32 }} />
                    Performance Analytics Dashboard
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatsCard
                        title="Total Duration"
                        value={formatDuration(activityData.totalDuration)}
                        icon={<AccessTimeIcon />}
                        color={theme.palette.primary.main}
                        description="Time spent on the test"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatsCard
                        title="Fullscreen Violations"
                        value={activityData.fullscreenViolations}
                        icon={<WarningIcon />}
                        color={theme.palette.error.main}
                        description="Times exited fullscreen"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatsCard
                        title="Offscreen Time"
                        value={formatDuration(activityData.offscreenTime)}
                        icon={<ExitToAppIcon />}
                        color={theme.palette.warning.main}
                        description="Time spent outside test"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatsCard
                        title="Total Pages"
                        value={activityData.totalPages}
                        icon={<AssignmentIcon />}
                        color={theme.palette.success.main}
                        description="Pages in the test"
                      />
                    </Grid>
                  </Grid>

                  {/* Enhanced Question Response Time Analysis */}
                  {(() => {
                    console.log('Question times check:', activityData.questionTimes);
                    console.log('Question times keys:', Object.keys(activityData.questionTimes));
                    
                    if (Object.keys(activityData.questionTimes).length === 0) {
                      return (
                        <Paper sx={{ 
                          p: 4, 
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.background.paper} 100%)`,
                          border: `1px solid ${theme.palette.primary.main}20`,
                          boxShadow: theme.shadows[3],
                          mb: 4
                        }}>
                          <Typography variant="h5" gutterBottom sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            mb: 3
                          }}>
                            <SpeedIcon sx={{ mr: 2 }} />
                            Question Response Time Analysis
                          </Typography>
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Avatar sx={{ 
                              bgcolor: theme.palette.grey[200],
                              width: 64,
                              height: 64,
                              mx: 'auto',
                              mb: 2
                            }}>
                              <SpeedIcon sx={{ fontSize: 32, color: theme.palette.grey[500] }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                              No Question Timing Data Available
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              This test may have been completed before timing analytics were implemented.
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    }

                    // Process question timing data
                    const questionTimesArray = Object.entries(activityData.questionTimes).map(([questionId, data], index) => ({
                      questionId,
                      questionNumber: index + 1,
                      timeInMs: data.time_spent || 0,
                      timeInSeconds: Math.max(Math.round((data.time_spent || 0) / 1000), 0),
                      viewCount: data.view_count || 1,
                      navigationEvents: data.navigation_events || []
                    }));

                    // Group questions by pages (15 questions per page for better chart readability)
                    const QUESTIONS_PER_PAGE = 15;
                    const pageGroups = [];
                    for (let i = 0; i < questionTimesArray.length; i += QUESTIONS_PER_PAGE) {
                      const pageQuestions = questionTimesArray.slice(i, i + QUESTIONS_PER_PAGE);
                      const pageNumber = Math.floor(i / QUESTIONS_PER_PAGE) + 1;
                      const totalTime = pageQuestions.reduce((sum, q) => sum + q.timeInMs, 0);
                      const avgTime = totalTime / pageQuestions.length;
                      
                      pageGroups.push({
                        pageNumber,
                        questions: pageQuestions,
                        totalTime,
                        avgTime,
                        questionCount: pageQuestions.length
                      });
                    }

                    // Calculate statistics
                    const allTimes = questionTimesArray.map(q => q.timeInMs);
                    const totalTestTime = allTimes.reduce((sum, time) => sum + time, 0);
                    const avgQuestionTime = totalTestTime / allTimes.length;
                    const maxTime = Math.max(...allTimes);
                    const minTime = Math.min(...allTimes);
                    
                    // Time categories
                    const fastQuestions = allTimes.filter(t => t < 10000).length; // < 10s
                    const normalQuestions = allTimes.filter(t => t >= 10000 && t < 30000).length; // 10-30s
                    const slowQuestions = allTimes.filter(t => t >= 30000).length; // > 30s

                    return (
                      <>
                        {/* Summary Statistics */}
                        <Paper sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${theme.palette.info.main}08 0%, ${theme.palette.background.paper} 100%)`,
                          border: `1px solid ${theme.palette.info.main}20`,
                          boxShadow: theme.shadows[2],
                          mb: 3
                        }}>
                          <Typography variant="h6" gutterBottom sx={{ 
                            color: theme.palette.info.main,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2
                          }}>
                            <SpeedIcon sx={{ mr: 1.5 }} />
                            Question Timing Summary
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">Average Time</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                {Math.round(avgQuestionTime / 1000)}s
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">Longest Time</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                                {Math.round(maxTime / 1000)}s
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">Shortest Time</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                {Math.round(minTime / 1000)}s
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">Total Questions</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                                {questionTimesArray.length}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>

                        {/* Question Response Time Analysis */}
                        <Paper sx={{ 
                          p: 4, 
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, ${theme.palette.background.paper} 100%)`,
                          border: `1px solid ${theme.palette.secondary.main}20`,
                          boxShadow: theme.shadows[3],
                          mb: 4
                        }}>
                          <Typography variant="h5" gutterBottom sx={{ 
                            color: theme.palette.secondary.main,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            mb: 3
                          }}>
                            <AssignmentIcon sx={{ mr: 2 }} />
                            Question Response Time Analysis
                          </Typography>

                          {/* Response Time Distribution Chart */}
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: theme.palette.text.primary }}>
                              Response Time Distribution (All {questionTimesArray.length} Questions)
                            </Typography>
                            
                            {/* Histogram-style chart for all questions */}
                            <Box sx={{ 
                              height: 200, 
                              backgroundColor: theme.palette.grey[50], 
                              borderRadius: 2, 
                              p: 3,
                              position: 'relative',
                              border: `1px solid ${theme.palette.grey[200]}`,
                              mb: 3,
                              overflow: 'hidden'
                            }}>
                              {/* Y-axis labels */}
                              <Box sx={{ 
                                position: 'absolute', 
                                left: 8, 
                                top: 16, 
                                bottom: 40, 
                                width: 40,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end'
                              }}>
                                {[100, 75, 50, 25, 0].map((percent) => {
                                  const timeValue = Math.round((maxTime * percent / 100) / 1000);
                                  return (
                                    <Typography 
                                      key={percent} 
                                      variant="caption" 
                                      sx={{ color: theme.palette.text.secondary, fontSize: '10px', fontWeight: 500 }}
                                    >
                                      {timeValue}s
                                    </Typography>
                                  );
                                })}
                              </Box>
                              
                              {/* Chart bars */}
                              <Box sx={{ 
                                ml: 6, 
                                mr: 2, 
                                height: '100%', 
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '1px',
                                pb: 4
                              }}>
                                {questionTimesArray.map((question, index) => {
                                  const percentage = maxTime > 0 ? (question.timeInMs / maxTime) * 100 : 0;
                                  const hue = (index * 360 / questionTimesArray.length) % 360;
                                  const questionColor = `hsl(${hue}, 70%, 60%)`;
                                  
                                  return (
                                    <Box
                                      key={question.questionId}
                                      sx={{
                                        flex: 1,
                                        height: `${Math.max(percentage, 2)}%`,
                                        backgroundColor: questionColor,
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        borderRadius: '2px 2px 0 0',
                                        minWidth: questionTimesArray.length > 50 ? '2px' : '8px',
                                        '&:hover': {
                                          backgroundColor: questionColor + 'DD',
                                          transform: 'scaleY(1.1)',
                                          zIndex: 10,
                                          '& .question-tooltip': {
                                            opacity: 1,
                                            visibility: 'visible'
                                          }
                                        }
                                      }}
                                      title={`Q${question.questionNumber}: ${question.timeInSeconds}s`}
                                    >
                                      {/* Tooltip */}
                                      <Box
                                        className="question-tooltip"
                                        sx={{
                                          position: 'absolute',
                                          bottom: '100%',
                                          left: '50%',
                                          transform: 'translateX(-50%)',
                                          backgroundColor: theme.palette.grey[900],
                                          color: 'white',
                                          px: 1.5,
                                          py: 1,
                                          borderRadius: 1,
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          opacity: 0,
                                          visibility: 'hidden',
                                          transition: 'all 0.3s ease',
                                          whiteSpace: 'nowrap',
                                          zIndex: 20,
                                          mb: 1,
                                          '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            border: '4px solid transparent',
                                            borderTopColor: theme.palette.grey[900]
                                          }
                                        }}
                                      >
                                        Q{question.questionNumber}: {question.timeInSeconds}s
                                        <br />
                                        ({question.timeInMs.toLocaleString()}ms)
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                              
                              {/* X-axis labels (showing question ranges) */}
                              <Box sx={{ 
                                position: 'absolute',
                                bottom: 8,
                                left: 56,
                                right: 16,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '10px' }}>
                                  Q1
                                </Typography>
                                {questionTimesArray.length > 10 && (
                                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '10px' }}>
                                    Q{Math.floor(questionTimesArray.length / 2)}
                                  </Typography>
                                )}
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '10px' }}>
                                  Q{questionTimesArray.length}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Statistics beneath chart */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.success.main + '10', borderRadius: 2 }}>
                                  <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                                    {fastQuestions}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Fast (&lt; 10s)
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.warning.main + '10', borderRadius: 2 }}>
                                  <Typography variant="h6" sx={{ color: theme.palette.warning.main, fontWeight: 700 }}>
                                    {normalQuestions}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Normal (10-30s)
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.error.main + '10', borderRadius: 2 }}>
                                  <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
                                    {slowQuestions}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Slow (&gt; 30s)
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.info.main + '10', borderRadius: 2 }}>
                                  <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
                                    {Math.round(avgQuestionTime / 1000)}s
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Average Time
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>

                          {/* Detailed Question Analysis (Paginated) */}
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.text.primary }}>
                              Detailed Question Analysis
                            </Typography>
                            
                            <Accordion defaultExpanded={questionTimesArray.length <= 10}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 600 }}>
                                  Individual Question Times ({questionTimesArray.length} questions)
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                                  {questionTimesArray.map((question, index) => {
                                    const percentage = maxTime > 0 ? (question.timeInMs / maxTime) * 100 : 0;
                                    const hue = (index * 360 / questionTimesArray.length) % 360;
                                    const questionColor = `hsl(${hue}, 70%, 60%)`;
                                    
                                    // Determine speed category
                                    let speedCategory = 'Normal';
                                    let speedColor = theme.palette.warning.main;
                                    if (question.timeInMs < 10000) {
                                      speedCategory = 'Fast';
                                      speedColor = theme.palette.success.main;
                                    } else if (question.timeInMs >= 30000) {
                                      speedCategory = 'Slow';
                                      speedColor = theme.palette.error.main;
                                    }
                                    
                                    return (
                                      <Box 
                                        key={question.questionId}
                                        sx={{ 
                                          display: 'flex',
                                          alignItems: 'center',
                                          mb: 1.5,
                                          p: 2,
                                          backgroundColor: theme.palette.grey[50],
                                          borderRadius: 2,
                                          border: `1px solid ${theme.palette.grey[200]}`,
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            backgroundColor: theme.palette.grey[100],
                                            borderColor: questionColor
                                          }
                                        }}
                                      >
                                        <Box sx={{ 
                                          width: 32,
                                          height: 32,
                                          borderRadius: '50%',
                                          backgroundColor: questionColor,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          mr: 2,
                                          fontWeight: 700,
                                          color: 'white',
                                          fontSize: '12px'
                                        }}>
                                          {question.questionNumber}
                                        </Box>
                                        
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            Question {question.questionNumber}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                              {question.timeInSeconds}s
                                            </Typography>
                                            <Chip 
                                              label={speedCategory}
                                              size="small"
                                              sx={{ 
                                                backgroundColor: speedColor + '20',
                                                color: speedColor,
                                                fontWeight: 600,
                                                fontSize: '10px'
                                              }}
                                            />
                                            <Chip 
                                              label={`${question.viewCount} view${question.viewCount !== 1 ? 's' : ''}`}
                                              size="small"
                                              variant="outlined"
                                              sx={{ fontSize: '10px' }}
                                            />
                                          </Box>
                                        </Box>
                                        
                                        {/* Compact progress bar */}
                                        <Box sx={{ width: 60, ml: 2 }}>
                                          <LinearProgress 
                                            variant="determinate" 
                                            value={percentage}
                                            sx={{ 
                                              height: 6,
                                              borderRadius: 3,
                                              backgroundColor: theme.palette.grey[300],
                                              '& .MuiLinearProgress-bar': {
                                                backgroundColor: questionColor,
                                                borderRadius: 3
                                              }
                                            }}
                                          />
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontSize: '9px' }}>
                                            {Math.round(percentage)}%
                                          </Typography>
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          </Box>

                          {/* Performance Insights */}
                          <Box sx={{ mt: 4, p: 3, backgroundColor: theme.palette.info.main + '08', borderRadius: 2, border: `1px solid ${theme.palette.info.main}20` }}>
                            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.info.main, fontWeight: 600, mb: 2 }}>
                              Performance Insights
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>Consistency:</strong> {Math.round((1 - (Math.max(...allTimes) - Math.min(...allTimes)) / avgQuestionTime) * 100)}% 
                                  {Math.round((1 - (Math.max(...allTimes) - Math.min(...allTimes)) / avgQuestionTime) * 100) > 70 ? ' (Consistent pacing)' : ' (Variable pacing)'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Efficiency:</strong> {fastQuestions > questionTimesArray.length * 0.5 ? 'High' : normalQuestions > questionTimesArray.length * 0.5 ? 'Moderate' : 'Needs improvement'}
                                  {fastQuestions > questionTimesArray.length * 0.5 ? ' (Most questions answered quickly)' : ''}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>Total Time:</strong> {Math.round(totalTestTime / 1000 / 60)}m {Math.round((totalTestTime / 1000) % 60)}s
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Avg per Question:</strong> {Math.round(avgQuestionTime / 1000)}s
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        </Paper>
                      </>
                    );
                  })()}

                  {/* Time Distribution */}
                  <Paper sx={{ 
                    p: 4, 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.success.main}08 0%, ${theme.palette.background.paper} 100%)`,
                    border: `1px solid ${theme.palette.success.main}20`,
                    boxShadow: theme.shadows[3],
                    mb: 4
                  }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                      color: theme.palette.success.main,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      mb: 3
                    }}>
                      <TrendingUpIcon sx={{ mr: 2 }} />
                      Time Distribution Analysis
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={7}>
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                              Active Time
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                              {formatDuration(activityData.totalDuration - (activityData.offscreenTime || 0))}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={((activityData.totalDuration - (activityData.offscreenTime || 0)) / activityData.totalDuration) * 100} 
                            sx={{ 
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 8,
                                background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`
                              }
                            }}
                          />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
                              Offscreen Time
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                              {formatDuration(activityData.offscreenTime || 0)}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={((activityData.offscreenTime || 0) / activityData.totalDuration) * 100} 
                            sx={{ 
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 8,
                                background: `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`
                              }
                            }}
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={5}>
                        <Card sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
                          border: `1px solid ${theme.palette.primary.main}30`,
                          borderRadius: 2,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                            Total Test Duration
                          </Typography>
                          <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', mb: 2 }}>
                            <CircularProgress
                              variant="determinate"
                              value={100}
                              size={100}
                              thickness={5}
                              sx={{ color: theme.palette.grey[200] }}
                            />
                            <CircularProgress
                              variant="determinate"
                              value={90}
                              size={100}
                              thickness={5}
                              sx={{ 
                                color: theme.palette.primary.main,
                                position: 'absolute',
                                left: 0,
                                '& .MuiCircularProgress-circle': {
                                  strokeLinecap: 'round',
                                },
                              }}
                            />
                            <Box sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                            }}>
                              <AccessTimeIcon sx={{ fontSize: 24, color: theme.palette.primary.main, mb: 0.5 }} />
                              <Typography variant="h6" sx={{ 
                                color: theme.palette.primary.main, 
                                fontWeight: 700,
                                fontFamily: 'monospace'
                              }}>
                                {formatDuration(activityData.totalDuration)}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {activityData.fullscreenViolations > 0 ? 
                              `${activityData.fullscreenViolations} fullscreen violation${activityData.fullscreenViolations > 1 ? 's' : ''} detected` : 
                              'No fullscreen violations detected'}
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Enhanced Activity Timeline */}
                  <Paper sx={{ 
                    p: 4, 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, ${theme.palette.background.paper} 100%)`,
                    border: `1px solid ${theme.palette.secondary.main}20`,
                    boxShadow: theme.shadows[3]
                  }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      mb: 3
                    }}>
                      <TimelineIcon sx={{ mr: 2 }} />
                      Complete Test Activity Timeline
                    </Typography>
                    <ActivityTimeline activities={activityData.activityLog} />
                  </Paper>
                </Box>
              )}
            </TabPanel>
          </DialogContent>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default ResultsDashboard; 