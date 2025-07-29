import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Tooltip,
  Checkbox,
  Divider,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  RestoreFromTrash as ReversedIcon,
  LinkOff as LinkOffIcon,
  FilterAlt as FilterIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import { 
  getQuestions, 
  deleteQuestion, 
  getDomains, 
  getSubdomains, 
  getTests, 
  assignQuestionsToTest,
  unlinkQuestionsFromTest
} from '../utils/api';

const QuestionList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [questions, setQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, question: null });
  const [assignDialog, setAssignDialog] = useState({ open: false });
  const [unlinkDialog, setUnlinkDialog] = useState({ open: false });
  
  // Operation states
  const [selectedTest, setSelectedTest] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [currentTestName, setCurrentTestName] = useState('');
  const [directNavigationChecked, setDirectNavigationChecked] = useState(false);
  
  // Get query params from URL
  const queryParams = new URLSearchParams(location.search);
  const testIdParam = queryParams.get('test_id');
  const assignToTestParam = queryParams.get('assign_to_test');
  
  // Filters
  const [filters, setFilters] = useState({
    domain_id: '',
    subdomain_id: '',
    is_likert: testIdParam ? '' : 'true',
    test_id: testIdParam || ''
  });

  // Check if this is a direct navigation from sidebar vs. navigation from test list
  useEffect(() => {
    // This will run every time the location changes
    const isFromSidebar = location.state?.from === 'sidebar' && location.state?.clear;
    const isTestIdInUrl = !!queryParams.get('test_id');
    
    if (isFromSidebar) {
      // Reset everything when coming from sidebar
      console.log('Sidebar navigation detected, clearing filters');
      setFilters({
        domain_id: '',
        subdomain_id: '',
        is_likert: 'true',
        test_id: ''
      });
      setCurrentTestName('');
      
      // Force immediate load of questions
      setTimeout(() => {
        loadQuestions();
      }, 0);
    } 
    // If there's no test_id but we have a test name, clear it
    else if (!isTestIdInUrl && currentTestName) {
      setCurrentTestName('');
      setFilters(prev => ({
        ...prev,
        test_id: ''
      }));
      loadQuestions();
    }
    
    setDirectNavigationChecked(true);
  }, [location, location.state?.timestamp]); // Add timestamp dependency to trigger effect

  useEffect(() => {
    loadDomains();
    loadTests();
  }, []);

  useEffect(() => {
    if (filters.domain_id) {
      loadSubdomains(filters.domain_id);
    } else {
      setSubdomains([]);
      // Clear subdomain filter if domain is cleared
      setFilters(prev => ({...prev, subdomain_id: ''}));
    }
  }, [filters.domain_id]);

  // Add new useEffect to load questions when filters change
  useEffect(() => {
    // Only load if directNavigationChecked is true (ensures other effects run first)
    if (directNavigationChecked) {
      loadQuestions();
    }
  }, [filters, directNavigationChecked]);

  useEffect(() => {
    if (testIdParam && directNavigationChecked && location.state?.from === 'testList') {
      setFilters(prev => ({ ...prev, test_id: testIdParam }));
      loadQuestions();
    }
  }, [testIdParam, directNavigationChecked]);

  useEffect(() => {
    if (assignToTestParam && tests.length > 0) {
      const testExists = tests.some(test => test.test_id === parseInt(assignToTestParam));
      if (testExists) {
        setSelectedTest(assignToTestParam);
        openAssignDialog();
      }
    }
  }, [tests, assignToTestParam]);

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
        
        // If test_id param exists, find test name
        if (testIdParam && response.data.data) {
          const test = response.data.data.find(t => t.test_id === parseInt(testIdParam));
          if (test) {
            setCurrentTestName(test.test_name);
            setSelectedTest(test.test_id.toString());
          }
        } else {
          setCurrentTestName('');
        }
      } else {
        console.error('Failed to load tests: Invalid response format');
        setTests([]);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      toast.error('Failed to load tests');
      setTests([]);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      // Filter out empty values
      const params = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '') acc[key] = value;
        return acc;
      }, {});
      
      // Force question_type to likert_scale for simplicity
      params.question_type = 'likert_scale';
      
      const response = await getQuestions(params);
      setQuestions(response.data.data);
      
      // Clear selected questions when filter changes
      setSelectedQuestions([]);
      
    } catch (err) {
      console.error('Error fetching questions:', err);
      toast.error('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({...prev, [name]: value}));
  };

  const clearFilters = () => {
    setFilters({
      domain_id: '',
      subdomain_id: '',
      is_likert: filters.test_id ? '' : 'true',
      test_id: testIdParam && location.state?.from === 'testList' ? testIdParam : ''
    });
    
    // Add this line to load questions after clearing filters
    setTimeout(() => loadQuestions(), 0);
  };

  const handleEdit = (question) => {
    navigate(`/questions/edit/${question.question_id}`);
  };

  const handleDeleteClick = (question) => {
    setDeleteDialog({ open: true, question });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, question: null });
  };

  const handleDeleteConfirm = async () => {
    const { question } = deleteDialog;
    if (!question) return;
    
    try {
      await deleteQuestion(question.question_id);
      toast.success(`Question deleted successfully`);
      loadQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error(
        err.response?.data?.message || 
        'Failed to delete question'
      );
    } finally {
      setDeleteDialog({ open: false, question: null });
    }
  };

  const handleRowSelect = (question, isSelected) => {
    const questionId = question.question_id;
    setSelectedQuestions(prev => {
      if (isSelected) {
        if (!prev.includes(questionId)) {
          return [...prev, questionId];
        }
        return prev;
      } else {
        return prev.filter(id => id !== questionId);
      }
    });
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedQuestions(questions.map(q => q.question_id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const openAssignDialog = () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    
    if (tests.length === 0) {
      toast.error('No tests available. Please create a test first.');
      return;
    }
    
    setAssignDialog({ open: true });
  };

  const closeAssignDialog = () => {
    setAssignDialog({ open: false });
    if (!testIdParam) {
    setSelectedTest('');
    }
  };

  const openUnlinkDialog = () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question to unlink');
      return;
    }
    
    setUnlinkDialog({ open: true });
  };

  const closeUnlinkDialog = () => {
    setUnlinkDialog({ open: false });
  };

  const handleAssign = async () => {
    if (!selectedTest) {
      toast.error('Please select a test');
      return;
    }

    setAssigning(true);
    try {
      await assignQuestionsToTest(selectedTest, selectedQuestions);
      toast.success(`${selectedQuestions.length} questions assigned to test successfully`);
      setSelectedQuestions([]);
      closeAssignDialog();
      
      // If we came from the test questions page with an assign_to_test parameter, 
      // navigate back to that test's questions page
      if (assignToTestParam) {
        navigate(`/test-questions/${assignToTestParam}`);
      } else {
        // Otherwise just reload the questions list
        loadQuestions();
      }
    } catch (err) {
      console.error('Error assigning questions to test:', err);
      toast.error('Failed to assign questions to test');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnlink = async () => {
    if (!testIdParam || selectedQuestions.length === 0) {
      toast.error('No test or questions selected for unlinking');
      return;
    }

    setUnlinking(true);
    try {
      await unlinkQuestionsFromTest(testIdParam, selectedQuestions);
      toast.success(`${selectedQuestions.length} questions unlinked from test successfully`);
      setSelectedQuestions([]);
      closeUnlinkDialog();
      loadQuestions();
    } catch (err) {
      console.error('Error unlinking questions from test:', err);
      toast.error('Failed to unlink questions from test');
    } finally {
      setUnlinking(false);
    }
  };

  const handleAdd = () => {
    navigate('/questions/create');
  };

  // Table columns definition
  const columns = [
    { 
      id: 'question_id', 
      label: 'ID', 
      accessor: 'question_id' 
    },
    { 
      id: 'question_text', 
      label: 'Question Text', 
      accessor: 'question_text',
      render: (value, row) => (
        <Tooltip title={value.length > 70 ? value : ''}>
          <Typography noWrap sx={{ 
            maxWidth: 250, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            fontWeight: 500
          }}>
            {value}
          </Typography>
        </Tooltip>
      )
    },
    { 
      id: 'help_text', 
      label: 'Help Text', 
      accessor: 'help_text',
      render: (value, row) => (
        value ? (
          <Tooltip title={value.length > 100 ? value : ''}>
            <Typography variant="body2" noWrap sx={{ 
              maxWidth: 200, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {value}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="textSecondary" fontStyle="italic">
            No help text
          </Typography>
        )
      )
    },
    { 
      id: 'domain_subdomain', 
      label: 'Domain / Subdomain', 
      accessor: row => `${row.domain?.domain_name || '-'} / ${row.subdomain?.subdomain_name || '-'}`,
      render: (value, row) => (
        row.domain ? (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {row.domain.domain_name}
            </Typography>
            {row.subdomain && (
              <Typography variant="body2" color="textSecondary">
                {row.subdomain.subdomain_name}
              </Typography>
            )}
          </Box>
        ) : '-'
      )
    },
    { 
      id: 'likert_scale', 
      label: 'Likert Scale', 
      accessor: row => `${row.likert_points}-point`,
      render: (value, row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            label={`${row.likert_points}-point`} 
            size="small" 
            color="primary"
            variant="outlined"
          />
          {row.is_reversed && (
            <Tooltip title="Reverse scored">
              <ReversedIcon fontSize="small" color="warning" />
            </Tooltip>
          )}
        </Box>
      )
    }
  ];
  
  // Table actions
  const actions = [
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Question',
      color: 'primary',
      onClick: handleEdit
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Question',
      color: 'error',
      onClick: handleDeleteClick
    }
  ];

  // Create breadcrumbs based on context
  const getBreadcrumbs = () => {
    const crumbs = [
      { label: 'Personality Assessment' }
    ];
    
    if (currentTestName) {
      crumbs.push(
        { label: 'Tests', path: '/tests' },
        { label: currentTestName }
      );
    } else {
      crumbs.push(
        { label: 'Questions' }
      );
    }
    
    return crumbs;
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title={currentTestName ? `Questions for ${currentTestName}` : "Question Management"}
          subtitle={currentTestName 
            ? `View and manage questions for the "${currentTestName}" test` 
            : "View, add, and manage personality assessment questions"}
          breadcrumbs={getBreadcrumbs()}
          actionLabel="Add New Question"
          actionIcon={<AddIcon />}
          onActionClick={handleAdd}
        />
        
        {/* Action Buttons for Selected Questions */}
        {selectedQuestions.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {testIdParam && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LinkOffIcon />}
                onClick={openUnlinkDialog}
              >
                Unlink Selected Questions ({selectedQuestions.length})
              </Button>
            )}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={openAssignDialog}
              >
              Assign Selected Questions ({selectedQuestions.length})
              </Button>
          </Box>
            )}
        
        {/* Navigation Button (Show when viewing test questions) */}
        {testIdParam && (
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/tests')}
            >
              Back to Tests
            </Button>
          </Box>
        )}

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FilterIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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
            
            <Grid item xs={12} sm={6} md={4}>
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
            
            <Grid item>
              <Button 
                onClick={clearFilters} 
                variant="outlined" 
                size="small"
                disabled={!filters.domain_id && !filters.subdomain_id}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <DataTable
          columns={columns}
          data={questions}
          isLoading={loading}
          title={currentTestName ? `Questions for "${currentTestName}"` : "Questions"}
          actions={actions}
          onRowClick={handleEdit}
          searchPlaceholder="Search questions..."
          emptyMessage="No questions found matching the selected filters. Create a new question or adjust your filters."
          getRowId={(row) => row.question_id}
          defaultSortColumn="question_id"
          containerProps={{ elevation: 2 }}
          selectable={true}
          selectedRows={selectedQuestions}
          onSelectRow={handleRowSelect}
          onSelectAllRows={handleSelectAll}
        />

      {/* Delete Confirmation Dialog */}
      <Dialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question?
            This action cannot be undone.
          </DialogContentText>
            {deleteDialog.question && (
            <Typography variant="subtitle1" sx={{ mt: 2, fontStyle: 'italic' }}>
                "{deleteDialog.question.question_text.length > 100
                  ? `${deleteDialog.question.question_text.substring(0, 100)}...`
                  : deleteDialog.question.question_text}"
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
            <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Questions Dialog */}
      <Dialog
          open={assignDialog.open}
        onClose={closeAssignDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Questions to Test</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a test to assign the {selectedQuestions.length} selected question(s).
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="test-select-label">Select Test</InputLabel>
            <Select
              labelId="test-select-label"
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              label="Select Test"
            >
              {tests.map((test) => (
                <MenuItem key={test.test_id} value={test.test_id}>
                  {test.test_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            color="primary" 
            variant="contained"
            disabled={!selectedTest || assigning}
          >
            {assigning ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Questions Dialog */}
      <Dialog
          open={unlinkDialog.open}
        onClose={closeUnlinkDialog}
        fullWidth
        maxWidth="sm"
      >
          <DialogTitle sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
          Unlink Questions from Test
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, mt: 1 }}>
            Are you sure you want to unlink the following {selectedQuestions.length} question(s) from "{currentTestName}"?
          </DialogContentText>
          
          {selectedQuestions.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto', mb: 2 }}>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {selectedQuestions.map(qId => {
                  const question = questions.find(q => q.question_id === qId);
                  return (
                    <li key={qId}>
                      <Typography variant="body2" gutterBottom>
                        {question?.question_text?.substring(0, 70)}{question?.question_text?.length > 70 ? '...' : ''}
                      </Typography>
                    </li>
                  );
                })}
              </ul>
            </Paper>
          )}
          
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone. These questions will no longer be part of this test.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUnlinkDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleUnlink} 
            color="error" 
            variant="contained"
            disabled={unlinking}
            sx={{ minWidth: 100 }}
          >
            {unlinking ? <CircularProgress size={24} /> : 'Unlink'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </MainLayout>
  );
};

export default QuestionList; 