import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  CircularProgress,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  RadioGroup,
  Radio,
  FormLabel,
  FormHelperText,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { 
  getQuestion, 
  createQuestion, 
  updateQuestion, 
  getDomains, 
  getSubdomains,
  getTests,
  assignQuestionsToTest
} from '../utils/api';

const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const testIdParam = queryParams.get('test_id');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [tests, setTests] = useState([]);
  const [formData, setFormData] = useState({
    question_text: '',
    question_text_urdu: '',
    help_text: '',
    question_type: 'likert_scale',
    domain_id: '',
    subdomain_id: '',
    is_likert: true,
    is_reversed: false,
    likert_points: 5,
    test_ids: [],
    options: [],
    question_status: 1
  });

  const isEditMode = !!id;

  useEffect(() => {
    loadDomains();
    loadTests();
    if (isEditMode) {
      loadQuestion();
    } else {
      // Initialize with 5-point Likert scale options
      createLikertOptions(5, false);
    }
  }, [id]);

  // Load subdomains when domain changes
  useEffect(() => {
    if (formData.domain_id) {
      loadSubdomains(formData.domain_id);
    } else {
      setSubdomains([]);
      // Clear subdomain if domain is cleared
      setFormData(prev => ({...prev, subdomain_id: ''}));
    }
  }, [formData.domain_id]);

  // Update options when likert points or reverse scoring changes
  useEffect(() => {
    createLikertOptions(formData.likert_points, formData.is_reversed);
  }, [formData.likert_points, formData.is_reversed]);

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

  const loadTests = async () => {
    try {
      const response = await getTests();
      if (response.data && response.data.success) {
        setTests(response.data.data || []);
      } else {
        setTests([]);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      toast.error('Failed to load tests');
      setTests([]);
    }
  };

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const response = await getQuestion(id);
      const question = response.data.data;
      
      setFormData({
        question_text: question.question_text,
        question_text_urdu: question.question_text_urdu || '',
        help_text: question.help_text || '',
        question_type: 'likert_scale',
        domain_id: question.domain_id || '',
        subdomain_id: question.subdomain_id || '',
        is_likert: true,
        is_reversed: question.is_reversed || false,
        likert_points: question.likert_points || 5,
        test_ids: question.test_ids || [],
        options: question.options || [],
        question_status: question.question_status
      });
      
      // Load subdomains if a domain is selected
      if (question.domain_id) {
        loadSubdomains(question.domain_id);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      toast.error('Failed to load question details');
      navigate('/questions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTestChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      test_ids: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      question_status: e.target.checked ? 1 : 0
    }));
  };

  const createLikertOptions = (points, isReversed) => {
    let options = [];
    
    switch(Number(points)) {
      case 3:
        options = [
          { option_text: 'Disagree', is_correct: false, score: isReversed ? 3 : 1 },
          { option_text: 'Neutral', is_correct: false, score: 2 },
          { option_text: 'Agree', is_correct: false, score: isReversed ? 1 : 3 }
        ];
        break;
      case 7:
        options = [
          { option_text: 'Strongly Disagree', is_correct: false, score: isReversed ? 7 : 1 },
          { option_text: 'Disagree', is_correct: false, score: isReversed ? 6 : 2 },
          { option_text: 'Somewhat Disagree', is_correct: false, score: isReversed ? 5 : 3 },
          { option_text: 'Neutral', is_correct: false, score: 4 },
          { option_text: 'Somewhat Agree', is_correct: false, score: isReversed ? 3 : 5 },
          { option_text: 'Agree', is_correct: false, score: isReversed ? 2 : 6 },
          { option_text: 'Strongly Agree', is_correct: false, score: isReversed ? 1 : 7 }
        ];
        break;
      default: // 5-point scale
        options = [
          { option_text: 'Strongly Disagree', is_correct: false, score: isReversed ? 5 : 1 },
          { option_text: 'Disagree', is_correct: false, score: isReversed ? 4 : 2 },
          { option_text: 'Neutral', is_correct: false, score: 3 },
          { option_text: 'Agree', is_correct: false, score: isReversed ? 2 : 4 },
          { option_text: 'Strongly Agree', is_correct: false, score: isReversed ? 1 : 5 }
        ];
    }
    
    setFormData(prev => ({
      ...prev,
      options
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = { ...formData };
      
      // Ensure likert-specific fields are set correctly
      payload.question_type = 'likert_scale';
      payload.is_likert = true;
      
      if (isEditMode) {
        await updateQuestion(id, payload);
        toast.success('Question updated successfully');
      } else {
        const response = await createQuestion(payload);
        toast.success('Question created successfully');

        if (testIdParam) {
          try {
            await assignQuestionsToTest(testIdParam, [response.data.data.question_id]);
            toast.success('Question added and assigned to test successfully');
            navigate(`/test-questions/${testIdParam}`);
            return;
          } catch (err) {
            console.error('Error assigning question to test:', err);
            toast.error('Question created but could not be assigned to test');
          }
        }
      }
      navigate('/questions');
    } catch (err) {
      console.error('Error saving question:', err);
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title={isEditMode ? 'Edit Question' : 'Create Question'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEditMode ? 'Edit Question' : 'Create Question'}>
      <Paper elevation={3} sx={{ p: 3, m: 3 }}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/questions')}
            sx={{ mr: 2 }}
          >
            Back to Questions
          </Button>
          <Typography variant="h5">
            {isEditMode ? 'Edit Question' : 'Create New Likert Scale Question'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Question Text */}
            <Grid item xs={12}>
              <TextField
                name="question_text"
                label="Question Text"
                fullWidth
                required
                multiline
                rows={3}
                value={formData.question_text}
                onChange={handleChange}
              />
            </Grid>

            {/* Optional Fields - Urdu Text & Help Text */}
            <Grid item xs={12} md={6}>
              <TextField
                name="question_text_urdu"
                label="Question Text (Urdu - Optional)"
                fullWidth
                multiline
                rows={2}
                value={formData.question_text_urdu}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="help_text"
                label="Help Text (Optional)"
                fullWidth
                multiline
                rows={2}
                value={formData.help_text}
                onChange={handleChange}
              />
            </Grid>

            {/* Domain and Subdomain */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="domain-select-label">Domain</InputLabel>
                <Select
                  labelId="domain-select-label"
                  id="domain-select"
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleChange}
                  label="Domain"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {domains.map((domain) => (
                    <MenuItem key={domain.domain_id} value={domain.domain_id}>
                      {domain.domain_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!formData.domain_id}>
                <InputLabel id="subdomain-select-label">Subdomain</InputLabel>
                <Select
                  labelId="subdomain-select-label"
                  id="subdomain-select"
                  name="subdomain_id"
                  value={formData.subdomain_id || ''}
                  onChange={handleChange}
                  label="Subdomain"
                  disabled={!formData.domain_id}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {subdomains.map((subdomain) => (
                    <MenuItem key={subdomain.subdomain_id} value={subdomain.subdomain_id}>
                      {subdomain.subdomain_name}
                    </MenuItem>
                  ))}
                </Select>
                {!formData.domain_id && (
                  <FormHelperText>Select a domain first</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Likert Scale Options */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Likert Scale Points</FormLabel>
                <RadioGroup
                  row
                  name="likert_points"
                  value={formData.likert_points}
                  onChange={handleChange}
                >
                  <FormControlLabel value={3} control={<Radio />} label="3-point" />
                  <FormControlLabel value={5} control={<Radio />} label="5-point" />
                  <FormControlLabel value={7} control={<Radio />} label="7-point" />
                </RadioGroup>
              </FormControl>
              
              <Box mt={2}>
                <Tooltip title="Reverse scoring flips the values, so 'Strongly Agree' gives a lower score (1) than 'Strongly Disagree' (5)">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_reversed}
                        onChange={handleChange}
                        name="is_reversed"
                        color="warning"
                      />
                    }
                    label="Reverse Scoring"
                  />
                </Tooltip>
              </Box>
            </Grid>

            {/* Additional Settings */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="test-select-label">Associate with Tests (Optional)</InputLabel>
                <Select
                  labelId="test-select-label"
                  id="test-select"
                  multiple
                  name="test_ids"
                  value={formData.test_ids || []}
                  onChange={handleTestChange}
                  label="Associate with Tests (Optional)"
                  renderValue={(selected) => {
                    const selectedTests = tests
                      .filter(test => selected.includes(test.test_id))
                      .map(test => test.test_name);
                    return selectedTests.join(', ');
                  }}
                >
                  {tests.map((test) => (
                    <MenuItem key={test.test_id} value={test.test_id}>
                      {test.test_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box mt={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.question_status === 1}
                      onChange={handleStatusChange}
                      name="question_status"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Box>
            </Grid>

            {/* Divider */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="subtitle1">
                  Likert Scale Preview
                  <Tooltip title="This shows how your Likert scale will appear">
                    <InfoIcon sx={{ ml: 1, fontSize: 18 }} color="info" />
                  </Tooltip>
                </Typography>
              </Divider>
            </Grid>

            {/* Preview of Likert options */}
            <Grid item xs={12}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Scale: {formData.likert_points}-point {formData.is_reversed ? "(Reverse Scored)" : ""}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" flexWrap="wrap" sx={{ mt: 2 }}>
                    {formData.options.map((option, index) => (
                      <Box 
                        key={index} 
                        textAlign="center" 
                        sx={{ 
                          padding: '8px 16px', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          margin: '4px',
                          minWidth: '100px'
                        }}
                      >
                        <Typography variant="body2">{option.option_text}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Score: {option.score}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  sx={{ mr: 1 }}
                  onClick={() => navigate('/questions')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={24} />
                  ) : isEditMode ? (
                    'Update Question'
                  ) : (
                    'Create Question'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </MainLayout>
  );
};

export default QuestionForm; 