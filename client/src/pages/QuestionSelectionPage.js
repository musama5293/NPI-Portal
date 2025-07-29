import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
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
  Checkbox
} from '@mui/material';
import { 
  RestoreFromTrash as ReversedIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { 
  getQuestions,
  getDomains, 
  getSubdomains, 
  getTests,
  assignQuestionsToTest
} from '../utils/api';

const QuestionSelectionPage = () => {
  const [questions, setQuestions] = useState([]);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const { testId } = useParams();
  const navigate = useNavigate();
  
  // Filters for questions
  const [filters, setFilters] = useState({
    domain_id: '',
    subdomain_id: '',
    is_likert: 'true',
    exclude_test_id: testId,
    test_id_exclude: testId,
    not_in_test: testId
  });

  useEffect(() => {
    loadTest();
    loadDomains();
    loadQuestions(); // Only load questions once with the initial filters
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
      
      // Get all questions from the API with our filters
      // Create a custom filter object to pass to the API
      const customFilters = {
        ...filters
      };

      // Make sure we're only getting questions NOT in the current test
      // Apply multiple test exclusion parameters to ensure compatibility
      customFilters.exclude_test_id = testId;
      customFilters.test_id_exclude = testId;
      customFilters.not_in_test = testId;
      
      const response = await getQuestions(customFilters);
      
      // Check if we have data and filter client-side as a backup
      if (response.data && response.data.success) {
        // Create a function to check if a question is linked to the current test
        const isLinkedToTest = (question) => {
          return question.test_ids && 
                 question.test_ids.includes(parseInt(testId));
        };
        
        // Filter out any questions that might still be linked to the test
        const filteredQuestions = response.data.data.filter(q => !isLinkedToTest(q));
        
        setQuestions(filteredQuestions);
        setError(null);
      } else {
        setError('Failed to load questions');
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
      toast.error('Failed to load questions');
      setQuestions([]);
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
      subdomain_id: '',
      is_likert: 'true',
      exclude_test_id: testId,
      test_id_exclude: testId,
      not_in_test: testId
    });
    loadQuestions();
  };

  const handleCheckboxChange = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedQuestions(questions.map(q => q.question_id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleAssignQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.warn('Please select at least one question to assign');
      return;
    }

    setSaving(true);
    try {
      await assignQuestionsToTest(testId, selectedQuestions);
      toast.success(`${selectedQuestions.length} questions assigned to test successfully`);
      // Navigate back to test questions page
      navigate(`/test-questions/${testId}`);
    } catch (err) {
      console.error('Error assigning questions to test:', err);
      toast.error('Failed to assign questions to test');
      setSaving(false);
    }
  };

  return (
    <MainLayout title={test ? `Select Questions for ${test.test_name}` : "Select Questions"}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {test ? `Select Questions for Test: ${test.test_name}` : `Select Questions for Test ${testId}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/test-questions/${testId}`)}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleAssignQuestions}
              disabled={selectedQuestions.length === 0 || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Assigning...' : `Add Selected (${selectedQuestions.length})`}
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
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions.length}
                      checked={selectedQuestions.length > 0 && selectedQuestions.length === questions.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Question Text</TableCell>
                  <TableCell>Help Text</TableCell>
                  <TableCell>Domain / Subdomain</TableCell>
                  <TableCell>Likert Scale</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No additional questions found. All applicable questions may already be assigned to this test.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow 
                      key={question.question_id}
                      sx={{ 
                        backgroundColor: selectedQuestions.includes(question.question_id) ? 'rgba(144, 202, 249, 0.08)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCheckboxChange(question.question_id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedQuestions.includes(question.question_id)}
                        />
                      </TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </MainLayout>
  );
};

export default QuestionSelectionPage; 