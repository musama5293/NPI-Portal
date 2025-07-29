import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as ScoreIcon,
  School as DomainIcon,
  Quiz as SubdomainIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  AutoGraph as AnalysisIcon,
  Refresh as RefreshIcon,
  QuestionAnswer as QuestionIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { getBoard, getCandidate, getBoardCandidates, getQuestions, updateCandidate, getCategory, getSupervisors } from '../utils/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CandidateAssessment = () => {
  const { boardId, candidateId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [expandedDomains, setExpandedDomains] = useState({});
  const [psychometricAnalysis, setPsychometricAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  
  // New state for subdomain questions dialog
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [subdomainQuestions, setSubdomainQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  
  // New state for candidate type update
  const [candidateTypeDialogOpen, setCandidateTypeDialogOpen] = useState(false);
  const [updatingCandidateType, setUpdatingCandidateType] = useState(false);
  const [newCandidateType, setNewCandidateType] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');

  useEffect(() => {
    loadAssessmentData();
  }, [boardId, candidateId]);

  useEffect(() => {
    if (candidateData?.test_scores && candidateData?.test_scores?.completion_status === 'completed') {
      loadPsychometricAnalysis();
    }
  }, [candidateData]);

  useEffect(() => {
    if (candidate) {
      setNewCandidateType(candidate.candidate_type || 'initial');
    }
  }, [candidate]);

  const loadSupervisors = async () => {
    try {
      const response = await getSupervisors();
      if (response.data.success) {
        setSupervisors(response.data.data);
      } else {
        toast.error('Failed to load supervisors.');
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
      toast.error('Failed to load supervisors.');
    }
  };

  const handleOpenCandidateTypeDialog = () => {
    loadSupervisors();
    setCandidateTypeDialogOpen(true);
  };

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      
      // Load board and candidate data
      const [boardResponse, candidateResponse, boardCandidatesResponse] = await Promise.all([
        getBoard(boardId),
        getCandidate(candidateId),
        getBoardCandidates(boardId)
      ]);
      
      if (boardResponse.data.success) {
        setBoard(boardResponse.data.data);
      } else {
        toast.error('Failed to load board details');
      }
      
      if (candidateResponse.data.success) {
        setCandidate(candidateResponse.data.data);
      } else {
        toast.error('Failed to load candidate details');
      }
      
      // Find the specific candidate data with test scores
      if (boardCandidatesResponse.data.success) {
        const candidateWithScores = boardCandidatesResponse.data.data.find(
          c => c._id === candidateId
        );
        setCandidateData(candidateWithScores);
      }
      
    } catch (err) {
      console.error('Error loading assessment data:', err);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  // New function to handle subdomain click
  const handleSubdomainClick = async (subdomain) => {
    setSelectedSubdomain(subdomain);
    setQuestionsDialogOpen(true);
    setQuestionsLoading(true);
    
    try {
      const response = await getQuestions({ subdomain_id: subdomain.subdomain_id });
      if (response.data.success) {
        setSubdomainQuestions(response.data.data);
      } else {
        toast.error('Failed to load questions for this subdomain');
      }
    } catch (error) {
      console.error('Error loading subdomain questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCandidateTypeUpdate = async () => {
    setUpdatingCandidateType(true);
    
    try {
      let candidateUpdateData = {
        candidate_type: newCandidateType,
      };

      if (['hired', 'probation'].includes(newCandidateType) && selectedSupervisor) {
        candidateUpdateData.supervisor_id = selectedSupervisor;
      }

      // If setting to probation, calculate and add probation dates
      if (newCandidateType === 'probation' && candidate?.cat_id) {
        try {
          const categoryResponse = await getCategory(candidate.cat_id);
          if (categoryResponse.data.success && categoryResponse.data.data.probation_period_months > 0) {
            const probationMonths = categoryResponse.data.data.probation_period_months;
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + probationMonths);
            
            candidateUpdateData = {
              ...candidateUpdateData,
              probation_period: probationMonths,
              probation_start_date: startDate.toISOString(),
              probation_end_date: endDate.toISOString(),
            };

            toast.info(`Probation period set to ${probationMonths} months.`);
          } else {
            toast.warn('Could not find a probation period for the candidate\'s category. Please set it manually.');
          }
        } catch (catError) {
          console.error("Error fetching category for probation period:", catError);
          toast.error('Could not fetch category details to set probation period.');
        }
      }

      const response = await updateCandidate(candidateId, candidateUpdateData);
      
      if (response.data.success) {
        setCandidate(response.data.data); // Update candidate state with the full updated object from server
        setNewCandidateType(response.data.data.candidate_type);
        setCandidateTypeDialogOpen(false);
        toast.success('Candidate type updated successfully!');
      } else {
        toast.error('Failed to update candidate type');
      }
    } catch (error) {
      console.error('Error updating candidate type:', error);
      toast.error('Failed to update candidate type');
    } finally {
      setUpdatingCandidateType(false);
    }
  };

  const handleExpandDomain = (domainId) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domainId]: !prev[domainId]
    }));
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreLabel = (percentage) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Needs Improvement';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load existing psychometric analysis
  const loadPsychometricAnalysis = async () => {
    if (!candidateData?.test_scores?._id) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/test/test-assignments/${candidateData.test_scores._id}/psychometric-analysis`);
      if (response.data.success) {
        setPsychometricAnalysis({
          ...response.data.data,
          analysis: response.data.data.analysis,
          generated_at: response.data.data.generated_at,
          domains_analyzed: response.data.data.domains_analyzed,
          questions_analyzed: response.data.data.questions_analyzed
        });
        setHasAnalysis(true);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading psychometric analysis:', error);
      }
      setHasAnalysis(false);
    }
  };

  // Generate psychometric analysis
  const generatePsychometricAnalysis = async () => {
    if (!candidateData?.test_scores?._id) {
      toast.error('No test assignment found');
      return;
    }

    setAnalysisLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/test/test-assignments/${candidateData.test_scores._id}/psychometric-analysis`);
      
      if (response.data.success) {
        setPsychometricAnalysis({
          ...response.data.data,
          analysis: response.data.data.analysis,
          generated_at: response.data.data.generated_at,
          domains_analyzed: response.data.data.domains_analyzed,
          questions_analyzed: response.data.data.questions_analyzed
        });
        setHasAnalysis(true);
        toast.success('Psychometric analysis generated successfully!');
      } else {
        toast.error('Failed to generate psychometric analysis');
      }
    } catch (error) {
      console.error('Error generating psychometric analysis:', error);
      
      if (error.response?.data?.error === 'API_TIMEOUT') {
        toast.error('Analysis service timeout. Please try again later.');
      } else if (error.response?.data?.error === 'API_CONNECTION_ERROR') {
        toast.error('Unable to connect to analysis service. Please check your connection.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate psychometric analysis');
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  const testScores = candidateData?.test_scores;
  const hasTestData = testScores && testScores.completion_status === 'completed';

  return (
    <MainLayout>
      <PageHeader
        title="Candidate Assessment Report"
        subtitle={`Detailed test results and domain analysis for ${candidate?.cand_name}`}
        icon={<AssessmentIcon fontSize="large" />}
        breadcrumbs={[
          { label: 'Administration' },
          { label: 'Evaluation Boards', path: '/boards' },
          { label: 'Board', path: `/boards/${boardId}/candidates` },
          { label: 'Assessment Report' }
        ]}
        backButton={{
          label: 'Back to Candidates',
          path: `/boards/${boardId}/candidates`,
          icon: <ArrowBackIcon />
        }}
      />

      <Box sx={{ p: 3 }}>
        {/* Candidate Overview */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {candidate?.cand_name}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {candidate?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                <Chip 
                  label={`Board: ${board?.board_name}`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`Gender: ${candidate?.cand_gender === 'M' ? 'Male' : 'Female'}`} 
                  color="secondary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`Phone: ${candidate?.cand_phone}`} 
                  color="info" 
                  variant="outlined" 
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                {testScores ? (
                  <Box>
                    <Chip 
                      icon={testScores.completion_status === 'completed' ? <CompletedIcon /> : <PendingIcon />}
                      label={testScores.completion_status === 'completed' ? 'Test Completed' : 'Test Pending'}
                      color={testScores.completion_status === 'completed' ? 'success' : 'warning'}
                      size="medium"
                      sx={{ mb: 1 }}
                    />
                    {testScores.completion_status === 'completed' && (
                      <Typography variant="body2" color="text.secondary">
                        Completed: {formatDate(testScores.completion_date)}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Chip 
                    icon={<PendingIcon />}
                    label="No Test Assignment"
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Test Results Section */}
        {!hasTestData ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>No Test Results Available</Typography>
            <Typography>
              This candidate has not completed their test yet. Test results and domain analysis will appear here once the test is completed.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Overall Score Card */}
            <Card elevation={2} sx={{ mb: 3, background: 'linear-gradient(45deg, #f8f9fa 30%, #e9ecef 90%)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScoreIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                      {testScores.overall_score}%
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Overall Test Score
                    </Typography>
                    <Chip 
                      label={getScoreLabel(testScores.overall_score)}
                      color={testScores.overall_score >= 80 ? 'success' : testScores.overall_score >= 60 ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={testScores.overall_score} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: theme.palette.grey[300],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(testScores.overall_score)
                    }
                  }} 
                />
              </CardContent>
            </Card>

            {/* Domain Scores */}
            <Paper elevation={2} sx={{ mb: 3 }}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DomainIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Domain Analysis
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Detailed breakdown of performance across different assessment domains
                </Typography>
              </Box>

              {testScores.domain_scores && testScores.domain_scores.length > 0 ? (
                <Box sx={{ p: 0 }}>
                  {testScores.domain_scores.map((domain, index) => (
                    <Accordion 
                      key={domain.domain_id || index}
                      expanded={expandedDomains[domain.domain_id || index]}
                      onChange={() => handleExpandDomain(domain.domain_id || index)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                          <PsychologyIcon sx={{ mr: 2, color: getScoreColor(domain.percentage) }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {domain.domain_name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Box sx={{ width: '200px', mr: 2 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={domain.percentage} 
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 4,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: getScoreColor(domain.percentage)
                                    }
                                  }} 
                                />
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                                {domain.percentage}%
                              </Typography>
                              <Chip 
                                label={getScoreLabel(domain.percentage)}
                                size="small"
                                color={domain.percentage >= 80 ? 'success' : domain.percentage >= 60 ? 'warning' : 'error'}
                                sx={{ ml: 2 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ pl: 5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Score: {domain.obtained_score} out of {domain.max_score} points
                          </Typography>
                          
                          {/* Show related subdomains */}
                          {testScores.subdomain_scores && testScores.subdomain_scores.length > 0 && (
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                                <SubdomainIcon sx={{ mr: 1 }} />
                                Related Subdomains
                              </Typography>
                              <List dense>
                                {testScores.subdomain_scores
                                  .filter(subdomain => subdomain.domain_id === domain.domain_id)
                                  .map((subdomain, subIndex) => (
                                    <ListItem 
                                      key={subdomain.subdomain_id || subIndex} 
                                      sx={{ 
                                        pl: 0,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        '&:hover': {
                                          backgroundColor: theme.palette.action.hover
                                        }
                                      }}
                                      onClick={() => handleSubdomainClick(subdomain)}
                                    >
                                      <ListItemIcon>
                                        <Box 
                                          sx={{ 
                                            width: 12, 
                                            height: 12, 
                                            borderRadius: '50%', 
                                            backgroundColor: getScoreColor(subdomain.percentage) 
                                          }} 
                                        />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">
                                              {subdomain.subdomain_name}
                                            </Typography>
                                            <QuestionIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                                          </Box>
                                        }
                                        secondary={`${subdomain.obtained_score}/${subdomain.max_score} points - Click to view questions`}
                                      />
                                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '100px' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                          {subdomain.percentage}%
                                        </Typography>
                                        <LinearProgress 
                                          variant="determinate" 
                                          value={subdomain.percentage} 
                                          sx={{ 
                                            width: 60, 
                                            height: 6,
                                            '& .MuiLinearProgress-bar': {
                                              backgroundColor: getScoreColor(subdomain.percentage)
                                            }
                                          }} 
                                        />
                                      </Box>
                                    </ListItem>
                                  ))}
                              </List>
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Box sx={{ p: 3 }}>
                  <Alert severity="info">
                    No domain scores available. This may indicate that the test questions were not properly configured with domain assignments.
                  </Alert>
                </Box>
              )}
            </Paper>

            {/* Psychometric Analysis Section */}
            <Paper elevation={2} sx={{ mb: 3 }}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AnalysisIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      Psychometric Analysis
                    </Typography>
                  </Box>
                  <Button
                    variant={hasAnalysis ? "outlined" : "contained"}
                    color="primary"
                    onClick={generatePsychometricAnalysis}
                    disabled={analysisLoading}
                    startIcon={analysisLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    sx={{ minWidth: '160px' }}
                  >
                    {analysisLoading ? 'Generating...' : hasAnalysis ? 'Regenerate' : 'Generate Analysis'}
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  AI-powered psychological insights and personality assessment based on test responses
                </Typography>
              </Box>

              {hasAnalysis && psychometricAnalysis ? (
                <Box sx={{ p: 3 }}>
                  {/* Data Source Indicator */}
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      🔄 Dynamic Analysis Based on Real Test Data
                    </Typography>
                    <Typography variant="body2">
                      This analysis is generated using <strong>live data</strong> from the candidate's actual test responses, 
                      domain scores, and subdomain performance - not pre-written content. 
                      The AI processes real psychometric data from this portal to provide personalized insights.
                    </Typography>
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                        AI-Generated Psychometric Analysis for {psychometricAnalysis.candidate_name}
                      </Typography>
                      
                      {psychometricAnalysis.analysis && (
                        <Box sx={{ mt: 2 }}>
                          {(() => {
                            // Helper function to render a single analysis item/card
                            const renderAnalysisItem = (key, value) => (
                              <Paper 
                                key={key} 
                                elevation={2} 
                                sx={{ 
                                  p: 3, 
                                  mb: 2, 
                                  borderLeft: `5px solid ${key === 'Psychometric Analysis' ? theme.palette.primary.main : theme.palette.secondary.main}`,
                                  '&:hover': { elevation: 4 },
                                  transition: 'elevation 0.3s ease-in-out'
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <PsychologyIcon sx={{ mr: 1.5, color: key === 'Psychometric Analysis' ? theme.palette.primary.main : theme.palette.secondary.main }} />
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                    {key.replace(/_/g, ' ')}
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, textAlign: 'justify' }}>
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                                </Typography>
                              </Paper>
                            );

                            // Normalizes the analysis data, which can come in various nested or stringified forms
                            const getNormalizedAnalysis = (rawAnalysis) => {
                                let content = rawAnalysis;

                                // 1. Un-nest if the data is wrapped in an 'analysis' key
                                if (typeof content === 'object' && content !== null && content.analysis) {
                                    content = content.analysis;
                                }

                                // 2. Parse the content if it's a stringified JSON
                                if (typeof content === 'string') {
                                    try {
                                        return JSON.parse(content);
                                    } catch (e) {
                                        // If it's just a plain string, wrap it in a standard object format
                                        return { 'Overall Analysis': content };
                                    }
                                }

                                // 3. If it's already a valid object, return it
                                if (typeof content === 'object' && content !== null) {
                                    return content;
                                }

                                // Fallback for unexpected data types
                                return { 'Error': "Could not display analysis content." };
                            };

                            const normalizedAnalysis = getNormalizedAnalysis(psychometricAnalysis.analysis);
                            
                            return Object.entries(normalizedAnalysis).map(([key, value]) => renderAnalysisItem(key, value));
                          })()}
                        </Box>
                      )}
                      
                      {/* Enhanced Metadata Section */}
                      <Paper elevation={1} sx={{ mt: 3, p: 3, backgroundColor: theme.palette.grey[50] }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
                          Analysis Metadata
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                                {psychometricAnalysis.domains_analyzed !== undefined && psychometricAnalysis.domains_analyzed !== null
                                  ? psychometricAnalysis.domains_analyzed
                                  : 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Domains Analyzed
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (from live test scores)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                                {psychometricAnalysis.questions_analyzed !== undefined && psychometricAnalysis.questions_analyzed !== null
                                  ? psychometricAnalysis.questions_analyzed
                                  : 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Questions Analyzed
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (from actual responses)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                                {testScores.overall_score}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Overall Test Score
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (calculated from portal)
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                          <Chip 
                            icon={<AnalysisIcon />}
                            label={`Generated: ${formatDate(psychometricAnalysis.generated_at)}`}
                            variant="outlined"
                            size="small"
                          />
                          <Chip 
                            icon={<AssessmentIcon />}
                            label={`Assignment ID: ${psychometricAnalysis.assignment_id}`}
                            variant="outlined"
                            size="small"
                          />
                          <Chip 
                            label="Real-time AI Analysis"
                            color="success"
                            size="small"
                          />
                          <Chip 
                            label="Dynamic Data Source"
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              ) : !analysisLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Alert severity="info">
                    <Typography variant="h6" gutterBottom>No Psychometric Analysis Available</Typography>
                    <Typography>
                      Click "Generate Analysis" to create an AI-powered psychological assessment based on the candidate's test responses and scores.
                    </Typography>
                  </Alert>
                </Box>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Generating psychometric analysis... This may take a few moments.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Test Details */}
            <Paper elevation={2}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Test Details
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Assignment ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{testScores.assignment_id}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Completion Date</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{formatDate(testScores.completion_date)}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Scheduled Date</Typography>
                    <Typography variant="body1">{formatDate(testScores.scheduled_date)}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                    <Typography variant="body1">{formatDate(testScores.expiry_date)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Candidate Type Update Section */}
            <Paper elevation={2} sx={{ mt: 3 }}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EditIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      Candidate Status Management
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenCandidateTypeDialog}
                    startIcon={<EditIcon />}
                  >
                    Update Type
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Update the candidate's current status in the hiring process
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Candidate Type
                    </Typography>
                    <Chip 
                      label={candidate?.candidate_type ? candidate.candidate_type.charAt(0).toUpperCase() + candidate.candidate_type.slice(1) : 'Initial'}
                      color={
                        candidate?.candidate_type === 'hired' ? 'success' :
                        candidate?.candidate_type === 'probation' ? 'warning' :
                        candidate?.candidate_type === 'rejected' ? 'error' : 'default'
                      }
                      size="large"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Available Types
                    </Typography>
                    <Typography variant="body2">
                      Initial, Probation, Hired, Rejected
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </>
        )}

        {/* Subdomain Questions Dialog */}
        <Dialog
          open={questionsDialogOpen}
          onClose={() => setQuestionsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <QuestionIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Questions for {selectedSubdomain?.subdomain_name}
                </Typography>
              </Box>
              <Button
                onClick={() => setQuestionsDialogOpen(false)}
                sx={{ minWidth: 'auto', p: 1 }}
              >
                <CloseIcon />
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            {questionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading questions...</Typography>
              </Box>
            ) : subdomainQuestions.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Question ID</TableCell>
                      <TableCell>Question Text</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Difficulty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subdomainQuestions.map((question, index) => (
                      <TableRow key={question.question_id || index}>
                        <TableCell>{question.question_id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 400 }}>
                            {question.question_text}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={question.question_type} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={question.difficulty_level || 'N/A'} 
                            size="small"
                            color={
                              question.difficulty_level === 'hard' ? 'error' :
                              question.difficulty_level === 'medium' ? 'warning' : 'success'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No questions found for this subdomain.
              </Alert>
            )}
          </DialogContent>
        </Dialog>

        {/* Candidate Type Update Dialog */}
        <Dialog
          open={candidateTypeDialogOpen}
          onClose={() => setCandidateTypeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditIcon sx={{ mr: 1 }} />
              Update Candidate Type
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Candidate Type</InputLabel>
                <Select
                  value={newCandidateType}
                  label="Candidate Type"
                  onChange={(e) => setNewCandidateType(e.target.value)}
                >
                  <MenuItem value="initial">Initial</MenuItem>
                  <MenuItem value="probation">Probation</MenuItem>
                  <MenuItem value="hired">Hired</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              {['hired', 'probation'].includes(newCandidateType) && (
                <FormControl fullWidth>
                  <InputLabel>Assign Supervisor</InputLabel>
                  <Select
                    value={selectedSupervisor}
                    label="Assign Supervisor"
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {supervisors.map((supervisor) => (
                      <MenuItem key={supervisor._id} value={supervisor._id}>
                        {supervisor.username} ({supervisor.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Current Type:</strong> {candidate?.candidate_type ? candidate.candidate_type.charAt(0).toUpperCase() + candidate.candidate_type.slice(1) : 'Initial'}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setCandidateTypeDialogOpen(false)}
              disabled={updatingCandidateType}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCandidateTypeUpdate}
              variant="contained"
              disabled={updatingCandidateType || newCandidateType === candidate?.candidate_type}
              startIcon={updatingCandidateType ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {updatingCandidateType ? 'Updating...' : 'Update Type'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default CandidateAssessment;