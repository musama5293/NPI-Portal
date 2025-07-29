import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Edit as EditIcon, 
  RestoreFromTrash as ReversedIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { 
  getQuestions,
  getDomains, 
  getSubdomains, 
  getTests, 
  unlinkQuestionsFromTest 
} from '../utils/api';

const TestQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlinking, setUnlinking] = useState(false);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  
  const { testId } = useParams();
  const navigate = useNavigate();
  
  // Filters for this test view
  const [filters, setFilters] = useState({
    domain_id: '',
    subdomain_id: ''
  });

  // Add state for the confirmation dialog
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [questionToUnlink, setQuestionToUnlink] = useState(null);

  useEffect(() => {
    loadTest();
    loadDomains();
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  useEffect(() => {
    if (filters.domain_id) {
      loadSubdomains(filters.domain_id);
    } else {
      setSubdomains([]);
      setFilters(prev => ({...prev, subdomain_id: ''}));
    }
  }, [filters.domain_id]);

  const loadTest = async () => {
    try {
      const response = await getTests();
      if (response.data?.success) {
        const foundTest = response.data.data.find(t => t.test_id === parseInt(testId));
        if (foundTest) {
          setTest(foundTest);
        } else {
          setError(`Test with ID ${testId} not found`);
        }
      } else {
        setError('Failed to load test data');
      }
    } catch (err) {
      console.error('Error fetching test:', err);
      setError('Failed to load test data');
    }
  };

  const loadDomains = async () => {
    try {
      const response = await getDomains();
      setDomains(response.data.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
      toast.error('Failed to load domains');
    }
  };

  const loadSubdomains = async (domainId) => {
    try {
      const response = await getSubdomains(domainId);
      setSubdomains(response.data.data);
    } catch (err) {
      console.error('Error fetching subdomains:', err);
      toast.error('Failed to load subdomains');
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        test_id: testId,
        ...filters
      };
      
      const response = await getQuestions(params);
      setQuestions(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions for this test');
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({...prev, [name]: value}));
    
    // Use setTimeout to ensure we have the latest state when loading questions
    setTimeout(() => {
      loadQuestions();
    }, 0);
  };

  const clearFilters = () => {
    setFilters({
      domain_id: '',
      subdomain_id: ''
    });
    loadQuestions();
  };

  const handleEdit = (questionId) => {
    navigate(`/questions/edit/${questionId}`);
  };

  // Update the handleUnlinkSingle function to open the dialog instead of immediately unlinking
  const handleUnlinkQuestion = (question) => {
    setQuestionToUnlink(question);
    setUnlinkDialogOpen(true);
  };

  const closeUnlinkDialog = () => {
    setUnlinkDialogOpen(false);
    setQuestionToUnlink(null);
  };

  // Rename the existing function to confirmUnlink and update it
  const confirmUnlink = async () => {
    if (!testId || !questionToUnlink) {
      toast.error('No test or question selected for unlinking');
      return;
    }

    setUnlinking(true);
    try {
      await unlinkQuestionsFromTest(testId, [questionToUnlink.question_id]);
      toast.success('Question unlinked from test successfully');
      loadQuestions();
    } catch (err) {
      console.error('Error unlinking question from test:', err);
      toast.error('Failed to unlink question from test');
    } finally {
      setUnlinking(false);
      closeUnlinkDialog();
    }
  };

  // Create a function to navigate to question selection page
  const handleAssignQuestions = () => {
    navigate(`/questions/select-for-test/${testId}`);
  }

  return (
    <MainLayout title={test ? `Questions for ${test.test_name}` : "Test Questions"}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {test ? `Questions for Test: ${test.test_name}` : `Test ${testId} Questions`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/tests')}
            >
              Back to Tests
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAssignQuestions}
            >
              Add New Question
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={5} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="domain-filter-label">Filter by Domain</InputLabel>
                <Select
                  labelId="domain-filter-label"
                  name="domain_id"
                  value={filters.domain_id}
                  onChange={handleFilterChange}
                  label="Filter by Domain"
                >
                  <MenuItem value="">All Domains</MenuItem>
                  {domains.map((domain) => (
                    <MenuItem key={domain.domain_id} value={domain.domain_id}>
                      {domain.domain_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={5} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="subdomain-filter-label">Filter by Subdomain</InputLabel>
                <Select
                  labelId="subdomain-filter-label"
                  name="subdomain_id"
                  value={filters.subdomain_id}
                  onChange={handleFilterChange}
                  label="Filter by Subdomain"
                  disabled={!filters.domain_id}
                >
                  <MenuItem value="">All Subdomains</MenuItem>
                  {subdomains.map((subdomain) => (
                    <MenuItem key={subdomain.subdomain_id} value={subdomain.subdomain_id}>
                      {subdomain.subdomain_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={2} md={2}>
              <Button 
                onClick={clearFilters} 
                variant="outlined" 
                fullWidth
                sx={{ height: '40px' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper elevation={3} sx={{ p: 3, bgcolor: '#fff9f9' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={loadQuestions}
            >
              Try Again
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Question Text</TableCell>
                  <TableCell>Help Text</TableCell>
                  <TableCell>Domain / Subdomain</TableCell>
                  <TableCell>Likert Scale</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No questions found for this test. Assign questions or adjust your filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow 
                      key={question.question_id}
                      sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                    >
                      <TableCell>{question.question_id}</TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {question.question_text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {question.help_text ? (
                          <Tooltip title={question.help_text.length > 100 ? question.help_text : ''}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {question.help_text}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            No help text
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {question.domain ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {question.domain.domain_name}
                            </Typography>
                            {question.subdomain && (
                              <Typography variant="body2" color="textSecondary">
                                {question.subdomain.subdomain_name}
                              </Typography>
                            )}
                          </Box>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={`${question.likert_points}-point`} 
                            size="small" 
                            color="primary"
                          />
                          {question.is_reversed && (
                            <Tooltip title="Reverse scored">
                              <ReversedIcon fontSize="small" color="warning" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEdit(question.question_id)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <Tooltip title="Unlink from test">
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleUnlinkQuestion(question)}
                            >
                              <LinkOffIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={unlinkDialogOpen}
        onClose={closeUnlinkDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}>
          Unlink Question
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, mt: 1 }}>
            Are you sure you want to unlink this question from "{test?.test_name}"?
          </DialogContentText>
          
          {questionToUnlink && (
            <Typography variant="subtitle1" sx={{ mt: 2, fontStyle: 'italic' }}>
              "{questionToUnlink.question_text.substring(0, 100)}{questionToUnlink.question_text.length > 100 ? '...' : ''}"
            </Typography>
          )}
          
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUnlinkDialog}>
            Cancel
          </Button>
          <Button 
            onClick={confirmUnlink} 
            color="error" 
            variant="contained"
            disabled={unlinking}
          >
            {unlinking ? <CircularProgress size={24} /> : 'Unlink'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default TestQuestions; 