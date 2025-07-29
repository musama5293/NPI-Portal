import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Divider,
  Grid,
  Alert,
  useTheme,
  TablePagination,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Visibility as ViewIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as AccessTimeIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { 
  getTestAssignments, 
  getSupervisorAssignments, 
  getLinkedAssignments, 
  deleteTestAssignment 
} from '../utils/api';

const TestAssignmentList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [assignments, setAssignments] = useState([]);
  const [supervisorAssignments, setSupervisorAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisorLoading, setSupervisorLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 for candidate, 1 for supervisor, 2 for consolidated
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalAssignments, setTotalAssignments] = useState(0);
  
  // Consolidated view state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [linkedAssignments, setLinkedAssignments] = useState([]);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);
  
  useEffect(() => {
    fetchAssignments();
  }, [page, rowsPerPage]);
  
  useEffect(() => {
    fetchSupervisorAssignments();
  }, []);
  
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await getTestAssignments({
        page: page + 1,
        limit: rowsPerPage,
      });
      
      if (res.data.success) {
        // Filter out supervisor feedback forms that should only appear in the supervisor tab
        const candidateAssignments = res.data.data.filter(assignment => !assignment.is_supervisor_feedback);
        setAssignments(candidateAssignments);
        setTotalAssignments(res.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch test assignments:', error);
      toast.error('Failed to load test assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSupervisorAssignments = async () => {
    try {
      setSupervisorLoading(true);
      const res = await getSupervisorAssignments();
      
      if (res.data.success) {
        setSupervisorAssignments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch supervisor assignments:', error);
      toast.error('Failed to load supervisor assignments. Please try again.');
    } finally {
      setSupervisorLoading(false);
    }
  };
  
  // Function to fetch linked assignments
  const fetchLinkedAssignments = async (assignmentId) => {
    try {
      setConsolidatedLoading(true);
      const res = await getLinkedAssignments(assignmentId);
      
      if (res.data.success) {
        setSelectedAssignment(res.data.data.mainAssignment);
        setLinkedAssignments(res.data.data.linkedAssignments);
        
        // Switch to consolidated view
        setActiveTab(2);
      }
    } catch (error) {
      console.error('Failed to fetch linked assignments:', error);
      toast.error('Failed to load linked assignments. Please try again.');
    } finally {
      setConsolidatedLoading(false);
    }
  };
  
  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this test assignment?')) {
      try {
        await deleteTestAssignment(assignmentId);
          toast.success('Test assignment deleted successfully');
        fetchAssignments(); // Refetch assignments after deletion
      } catch (error) {
        console.error('Failed to delete test assignment:', error);
        toast.error(error.response?.data?.message || 'Failed to delete test assignment. Please try again.');
      }
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // If switching away from consolidated view, reset consolidated state
    if (newValue !== 2) {
      setSelectedAssignment(null);
      setLinkedAssignments([]);
    }
  };
  
  const getCompletionStatusChip = (status) => {
    let color;
    let label;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      case 'started':
        color = 'info';
        label = 'In Progress';
        break;
      case 'completed':
        color = 'success';
        label = 'Completed';
        break;
      case 'expired':
        color = 'error';
        label = 'Expired';
        break;
      default:
        color = 'default';
        label = 'Unknown';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getScoreColor = (score) => {
    if (!score && score !== 0) return theme.palette.text.secondary; // N/A case
    if (score >= 80) return theme.palette.success.main; // Excellent
    if (score >= 70) return theme.palette.success.light; // Good
    if (score >= 60) return theme.palette.warning.main; // Satisfactory
    if (score >= 50) return theme.palette.warning.dark; // Needs Improvement
    return theme.palette.error.main; // Poor
  };
  
  const renderCandidateTable = () => {
    if (loading && assignments.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Showing {assignments.length} of {totalAssignments} test assignments
          </Typography>
        </Box>
        
        {assignments.length === 0 && !loading ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No test assignments found. Create new assignments by clicking the "Assign New Test" button.
          </Alert>
        ) : (
          <Paper variant="outlined" sx={{ position: 'relative' }}>
            {loading && 
              <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, width: '100%' }} />
            }
            <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Test</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map(assignment => (
                  <TableRow key={assignment._id} hover>
                    <TableCell>{assignment.assignment_id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.candidate_id ? assignment.candidate_id.candidate_name : assignment.candidate_name || 'Unknown'}
                        </Typography>
                        {assignment.candidate_id && assignment.candidate_id.candidate_type === 'probation' && (
                          <Chip 
                            label="On Probation" 
                            size="small" 
                            color="info" 
                            variant="outlined" 
                            sx={{ mt: 0.5 }}
                          />
                        )}
                        {assignment.linked_assignments && assignment.linked_assignments.length > 0 && (
                          <Chip 
                            label="Has Supervisor Form" 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mt: 0.5, ml: 0.5 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {assignment.test_id ? assignment.test_id.test_name : 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.test_id && 
                          (typeof assignment.test_id.test_type === 'number' ? 
                          (assignment.test_id.test_type === 1 ? 'Psychometric' : 
                            assignment.test_id.test_type === 2 ? 'Probation Assessment' : 
                            'Type ' + assignment.test_id.test_type) : 
                            assignment.test_id.test_type)
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(assignment.scheduled_date)}</TableCell>
                    <TableCell>{formatDate(assignment.expiry_date)}</TableCell>
                    <TableCell>
                      {getCompletionStatusChip(assignment.completion_status)}
                    </TableCell>
                    <TableCell align="center">
                      {assignment.completion_status === 'completed' ? (
                        <Typography variant="body2" fontWeight="bold" sx={{ color: getScoreColor(assignment.score) }}>
                          {assignment.score !== undefined && assignment.score !== null ? assignment.score : 'N/A'}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">--</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                          component={Link}
                          to={`/test-assignments/edit/${assignment.assignment_id}`}
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={assignment.completion_status === 'completed' ? <ViewIcon /> : <EditIcon />}
                        >
                          {assignment.completion_status === 'completed' ? 'View' : 'Edit'}
                        </Button>
                        
                        {assignment.linked_assignments && assignment.linked_assignments.length > 0 && (
                          <Button
                              onClick={() => fetchLinkedAssignments(assignment.assignment_id)}
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<AssessmentIcon />}
                          >
                            Details
                          </Button>
                        )}
                        
                        {assignment.completion_status === 'pending' && (
                          <IconButton
                            onClick={() => handleDelete(assignment.assignment_id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalAssignments}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </>
    );
  };
  
  const renderSupervisorTable = () => {
    if (supervisorLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            {supervisorAssignments.length} supervisor feedback forms found
          </Typography>
        </Box>
        
        {supervisorAssignments.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No supervisor feedback forms found. Create new assignments by clicking the "Assign New Test" button.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell>ID</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell>Feedback Form</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supervisorAssignments.map(assignment => (
                  <TableRow key={assignment._id} hover>
                    <TableCell>{assignment.assignment_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {assignment.candidate_id ? assignment.candidate_id.candidate_name : assignment.candidate_name || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>{assignment.supervisor_name || 'Unassigned'}</TableCell>
                    <TableCell>
                      {assignment.test_id ? assignment.test_id.test_name : 'Unknown Form'}
                    </TableCell>
                    <TableCell>{formatDate(assignment.expiry_date)}</TableCell>
                    <TableCell>{getCompletionStatusChip(assignment.completion_status)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                          component={Link}
                          to={`/test-assignments/edit/${assignment.assignment_id}`}
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={assignment.completion_status === 'completed' ? <ViewIcon /> : <EditIcon />}
                        >
                          {assignment.completion_status === 'completed' ? 'View Results' : 'Complete Form'}
                        </Button>
                        
                        <Button
                          onClick={() => fetchLinkedAssignments(assignment.assignment_id)}
                          variant="contained"
                          color="secondary"
                          size="small"
                          startIcon={<AssessmentIcon />}
                        >
                          Details
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={totalAssignments}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </>
    );
  };
  
  const renderConsolidatedView = () => {
    if (consolidatedLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!selectedAssignment) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          <Typography variant="h6" gutterBottom>Consolidated View</Typography>
          <Typography variant="body2">
            Select an assignment with the "Details" button from either tab to view linked assignments here.
          </Typography>
        </Alert>
      );
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {selectedAssignment.is_supervisor_feedback ? 'Supervisor Feedback' : 'Candidate Assessment'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assignment ID: {selectedAssignment.assignment_id} | 
              Candidate: {selectedAssignment.candidate_name || 
                        (selectedAssignment.candidate_id ? selectedAssignment.candidate_id.candidate_name : 'Unknown')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              setSelectedAssignment(null);
              setLinkedAssignments([]);
              setActiveTab(0);
            }}
          >
            Back to List
          </Button>
        </Paper>
        
        <Grid container spacing={2}>
          {/* Main Assignment Card */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ 
                  p: 1.5, 
                  mb: 2,
                  bgcolor: selectedAssignment.is_supervisor_feedback ? 'primary.lightest' : 'success.lightest',
                  borderRadius: 1
                }}>
                  <Typography variant="subtitle1">
                    {selectedAssignment.is_supervisor_feedback ? 'Supervisor Form' : 'Candidate Assessment'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAssignment.test && selectedAssignment.test.test_name ? selectedAssignment.test.test_name : 
                     (selectedAssignment.test_id && selectedAssignment.test_id.test_name) ? selectedAssignment.test_id.test_name : 'Unknown Test'}
                  </Typography>
                </Box>
                
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight="medium">Status:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {getCompletionStatusChip(selectedAssignment.completion_status)}
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight="medium">Scheduled:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{formatDate(selectedAssignment.scheduled_date)}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight="medium">Expires:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{formatDate(selectedAssignment.expiry_date)}</Typography>
                  </Grid>
                  
                  {selectedAssignment.completion_status === 'completed' && (
                    <>
                      <Grid item xs={4}>
                        <Typography variant="body2" fontWeight="medium">Score:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: getScoreColor(selectedAssignment.score) }}>
                          {selectedAssignment.score || 'N/A'}
                        </Typography>
                      </Grid>
                      
                      {selectedAssignment.feedback && (
                        <>
                          <Grid item xs={4}>
                            <Typography variant="body2" fontWeight="medium">Feedback:</Typography>
                          </Grid>
                          <Grid item xs={8}>
                            <Typography variant="body2">{selectedAssignment.feedback}</Typography>
                          </Grid>
                        </>
                      )}
                    </>
                  )}
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    component={Link}
                    to={`/test-assignments/edit/${selectedAssignment.assignment_id}`}
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    {selectedAssignment.completion_status === 'completed' ? 'View Details' : 'Edit Assignment'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Linked Assignments */}
          <Grid item xs={12} md={6}>
            {linkedAssignments.length === 0 ? (
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AccessTimeIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6">No Linked Assignments</Typography>
                  <Typography variant="body2" color="text.secondary">
                    This {selectedAssignment.is_supervisor_feedback ? 'supervisor form' : 'candidate assessment'} 
                    doesn't have any linked {selectedAssignment.is_supervisor_feedback ? 'candidate assessments' : 'supervisor forms'}.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {linkedAssignments.map(linked => (
                  <Card key={linked._id} variant="outlined">
                    <CardContent>
                      <Box sx={{ 
                        p: 1.5, 
                        mb: 2,
                        bgcolor: linked.is_supervisor_feedback ? 'primary.lightest' : 'success.lightest',
                        borderRadius: 1
                      }}>
                        <Typography variant="subtitle1">
                          {linked.is_supervisor_feedback ? 'Supervisor Form' : 'Candidate Assessment'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {linked.test && linked.test.test_name ? linked.test.test_name : 
                           (linked.test_id && linked.test_id.test_name) ? linked.test_id.test_name : 'Unknown Test'}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant="body2" fontWeight="medium">Status:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          {getCompletionStatusChip(linked.completion_status)}
                        </Grid>
                        
                        {linked.completion_status === 'completed' && (
                          <>
                            <Grid item xs={4}>
                              <Typography variant="body2" fontWeight="medium">Score:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: getScoreColor(linked.score) }}>
                                {linked.score || 'N/A'}
                              </Typography>
                            </Grid>
                            
                            {linked.feedback && (
                              <>
                                <Grid item xs={4}>
                                  <Typography variant="body2" fontWeight="medium">Feedback:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                  <Typography variant="body2">{linked.feedback}</Typography>
                                </Grid>
                              </>
                            )}
                          </>
                        )}
                      </Grid>
                      
                      <Box sx={{ mt: 3 }}>
                        <Button
                          component={Link}
                          to={`/test-assignments/edit/${linked.assignment_id}`}
                          variant="contained"
                          color="primary"
                          size="small"
                        >
                          {linked.completion_status === 'completed' ? 'View Details' : 'Edit Assignment'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader 
          title="Test Assignments"
          subtitle="Manage and track test assignments for candidates and supervisors"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Test Assignments' }
          ]}
          actionLabel="Assign Tests"
          actionIcon={<AddIcon />}
          actionPath="/test-assignments/batch"
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            component={Link}
            to="/test-assignments/batch"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Assign New Test
          </Button>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Candidate Tests" />
            <Tab label="Supervisor Feedback" />
            <Tab label="Consolidated View" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && renderCandidateTable()}
        {activeTab === 1 && renderSupervisorTable()}
        {activeTab === 2 && renderConsolidatedView()}
      </Box>
    </MainLayout>
  );
};

export default TestAssignmentList; 