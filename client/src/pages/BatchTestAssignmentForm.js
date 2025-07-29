import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import FormLayout from '../components/common/FormLayout';
import { 
  FormTextField, 
  FormSelectField, 
  FormDatePicker,
  FormSection,
  FormSwitch
} from '../components/common/FormFields';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  TextField,
  InputAdornment,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  AssignmentTurnedIn as AssignmentIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const BatchTestAssignmentForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State for data
  const [tests, setTests] = useState([]);
  const [supervisorFeedbackTests, setSupervisorFeedbackTests] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  
  // State for form data
  const [formData, setFormData] = useState({
    test_id: '',
    supervisor_test_id: '',
    scheduled_date: '',
    expiry_date: '',
    assignment_status: 1,
    auto_assign_supervisor: true
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter state
  const [filters, setFilters] = useState({
    department: '',
    institute: '',
    category: '',
    searchQuery: '',
    candidateType: '',
    job: ''
  });
  
  // Special candidate lists
  const [probationEndingCandidates, setProbationEndingCandidates] = useState([]);
  
  useEffect(() => {    
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
      try {        
        setLoading(true);                
        
      // Fetch tests for both dropdowns
        const testsRes = await axios.get(`${API_URL}/api/test/tests`);                
        if (testsRes.data.success) {          
          const activeTests = testsRes.data.data.filter(test => test.test_status === 1);          
          setTests(activeTests);          
          setSupervisorFeedbackTests(activeTests);          
      }
      
      // Fetch all other required data in parallel
      const [
        candidatesRes, 
        departmentsRes, 
        institutesRes, 
        categoriesRes, 
        probationRes, 
        jobsRes
      ] = await Promise.all([
          axios.get(`${API_URL}/api/candidates`),
          axios.get(`${API_URL}/api/departments`),
          axios.get(`${API_URL}/api/institutes`),
          axios.get(`${API_URL}/api/test/categories`),
          axios.get(`${API_URL}/api/test/check-probation-tests`),
          axios.get(`${API_URL}/api/jobs`)
        ]);
        
      // Process the results
        if (candidatesRes.data.success) {
          setCandidates(candidatesRes.data.data);
        }
        
        if (departmentsRes.data.success) {
          setDepartments(departmentsRes.data.data);
        }
        
        if (institutesRes.data.success) {
          setInstitutes(institutesRes.data.data);
        }
        
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        }
        
        if (probationRes.data.success) {
          setProbationEndingCandidates(probationRes.data.data);
        }
        
        if (jobsRes.data.success) {
          setJobs(jobsRes.data.data);
        }
        
        // Set default dates
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const scheduledDate = today.toISOString().split('T')[0];
        const expiryDate = nextMonth.toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          scheduled_date: scheduledDate,
          expiry_date: expiryDate
        }));
      
      } catch (error) {
        console.error('Failed to fetch data:', error);
      setError('Failed to load data. Please try again.');
        toast.error('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
  // Filtering logic for candidates
  const filteredCandidates = candidates.filter(candidate => {
    // Apply candidate type filter
    if (filters.candidateType === 'probation-ending') {
      const probationIds = probationEndingCandidates.map(c => c._id);
      if (!probationIds.includes(candidate._id)) {
        return false;
      }
    } else if (filters.candidateType === 'probation') {
      if (candidate.candidate_type !== 'probation') {
        return false;
      }
    } else if (filters.candidateType === 'permanent') {
      if (candidate.candidate_type !== 'permanent') {
        return false;
      }
    } else if (filters.candidateType === 'initial') {
      if (candidate.candidate_type !== 'initial') {
        return false;
      }
    }
    
    // Apply department filter
    if (filters.department && filters.department !== "") {
      const deptIdToCompare = parseInt(filters.department);
      
      // Handle both cases: when dept_id is an object (populated) or a number
      if (typeof candidate.dept_id === 'object' && candidate.dept_id !== null) {
        if (candidate.dept_id.dept_id !== deptIdToCompare) {
          return false;
        }
      } else if (candidate.dept_id !== deptIdToCompare) {
        return false;
      }
    }
    
    // Apply institute filter
    if (filters.institute && filters.institute !== "") {
      const instIdToCompare = parseInt(filters.institute);
      
      // Handle both cases: when inst_id is an object (populated) or a number
      if (typeof candidate.inst_id === 'object' && candidate.inst_id !== null) {
        if (candidate.inst_id.inst_id !== instIdToCompare) {
          return false;
        }
      } else if (candidate.inst_id !== instIdToCompare) {
        return false;
      }
    }
    
    // Apply category filter
    if (filters.category && filters.category !== "") {
      const catIdToCompare = parseInt(filters.category);
      
      // Handle both cases: when cat_id is an object (populated) or a number
      if (typeof candidate.cat_id === 'object' && candidate.cat_id !== null) {
        if (candidate.cat_id.cat_id !== catIdToCompare) {
          return false;
        }
      } else if (candidate.cat_id !== catIdToCompare) {
        return false;
      }
    }
    
    // Apply job filter
    if (filters.job && filters.job !== "") {
      const jobIdToCompare = parseInt(filters.job);
      
      // Check all job-related fields
      const hasMatchingJob = 
        candidate.job_id === jobIdToCompare || 
        candidate.applied_job_id === jobIdToCompare || 
        candidate.current_job_id === jobIdToCompare;
        
      if (!hasMatchingJob) {
        return false;
      }
    }
    
    // Apply search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        (candidate.cand_name && candidate.cand_name.toLowerCase().includes(query)) ||
        (candidate.cand_cnic_no && candidate.cand_cnic_no.includes(query)) ||
        (candidate.cand_email && candidate.cand_email.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Sort the filtered candidates to show probation ending first
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    // First priority: Probation ending candidates at the top
    const aInProbationEnding = probationEndingCandidates.some(c => c._id === a._id);
    const bInProbationEnding = probationEndingCandidates.some(c => c._id === b._id);
    
    if (aInProbationEnding && !bInProbationEnding) return -1;
    if (!aInProbationEnding && bInProbationEnding) return 1;
    
    // Second priority: Sort by probation end date (if both are on probation)
    if (a.candidate_type === 'probation' && b.candidate_type === 'probation') {
      if (a.probation_end_date && b.probation_end_date) {
        return new Date(a.probation_end_date) - new Date(b.probation_end_date);
      }
    }
    
    // Third priority: Sort by name
    return (a.cand_name || '').localeCompare(b.cand_name || '');
  });
  
  // Pagination logic
  const paginatedCandidates = sortedCandidates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    
    // Reset pagination when filters change
    setPage(0);
    
    // If selecting probation-ending, pre-select those candidates
    if (name === 'candidateType' && value === 'probation-ending' && probationEndingCandidates.length > 0) {
      const probationIds = probationEndingCandidates.map(candidate => candidate._id);
      setSelectedCandidates(prevSelected => {
        // Add any probation candidates not already selected
        const newSelected = [...prevSelected];
        probationIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };
  
  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      // If all are selected, deselect all
      setSelectedCandidates([]);
    } else {
      // Otherwise select all filtered candidates
      setSelectedCandidates(filteredCandidates.map(c => c._id));
    }
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleAutoAssignChange = (e) => {
    setFormData({
      ...formData,
      auto_assign_supervisor: e.target.checked
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCandidates.length === 0) {
      setError('Please select at least one candidate');
      toast.error('Please select at least one candidate');
      return;
    }
    
    if (!formData.test_id) {
      setError('Please select a test');
      toast.error('Please select a test');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Prepare the assignments batch
      const assignments = selectedCandidates.map((candidateId, index) => {
        // Generate a unique assignment ID
        const randomId = Math.floor(1000 + Math.random() * 9000) + index;
        
        // Get the candidate to check supervisor
        const candidate = candidates.find(c => c._id === candidateId);
        
        // Add supervisor information if auto-assign is enabled and supervisor test is selected
        if (formData.auto_assign_supervisor && 
            formData.supervisor_test_id && 
            candidate.supervisor_id) {
          return {
            assignment_id: randomId,
            test_id: Number(formData.test_id),
            candidate_id: candidateId,
            scheduled_date: formData.scheduled_date,
            expiry_date: formData.expiry_date,
            assignment_status: formData.assignment_status,
            // Include supervisor information
            supervisor_id: candidate.supervisor_id,
            supervisor_test_id: Number(formData.supervisor_test_id),
            auto_assign_supervisor: true
          };
        } else {
          return {
            assignment_id: randomId,
            test_id: Number(formData.test_id),
            candidate_id: candidateId,
            scheduled_date: formData.scheduled_date,
            expiry_date: formData.expiry_date,
            assignment_status: formData.assignment_status,
            // Include supervisor information
            supervisor_id: null,
            supervisor_test_id: null,
            auto_assign_supervisor: false
          };
        }
      });
      
      // Use the batch endpoint
      const response = await axios.post(`${API_URL}/api/test/test-assignments/batch`, {
        assignments
      });
      
      // Get results from response
      const successful = response.data.data.success.length;
      const failed = response.data.data.failures.length;
      const supervisorAssignments = response.data.data.supervisor_assignments.length;
      
      if (successful > 0) {
        setSuccess(`Successfully assigned test to ${successful} candidate(s)`);
        toast.success(`Successfully assigned test to ${successful} candidate(s)`);
      }
      
      if (supervisorAssignments > 0) {
        toast.info(`Automatically assigned supervisor feedback forms to ${supervisorAssignments} supervisor(s)`);
      }
      
      if (failed > 0) {
        toast.error(`Failed to assign test to ${failed} candidate(s)`);
      }
      
      // Navigate to assignments page after a short delay
      setTimeout(() => navigate('/test-assignments'), 1500);
    } catch (error) {
      console.error('Failed to assign tests:', error);
      setError('An error occurred while assigning tests. Please try again.');
      toast.error('An error occurred while assigning tests. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/test-assignments');
  };
  
  // Helper function to get entity name
  const getEntityName = (entity, entityArray, idField, nameField) => {
    if (!entity) return '-';
    
    // If entity is already an object with the name field
    if (typeof entity === 'object' && entity !== null && entity[nameField]) {
      return entity[nameField];
    }
    
    // Find in array by ID
    const found = entityArray.find(item => item[idField] === entity);
    return found ? found[nameField] : '-';
  };
  
  // Helper function to render candidate type badge
  const renderCandidateType = (type, isEndingSoon = false) => {
    let color;
    let label;
    
    switch (type) {
      case 'probation':
        color = 'warning';
        label = 'Probation';
        break;
      case 'permanent':
        color = 'success';
        label = 'Permanent';
        break;
      case 'initial':
        color = 'info';
        label = 'Initial';
        break;
      default:
        color = 'default';
        label = type || 'Unknown';
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          label={label} 
          color={color} 
          size="small" 
          variant={isEndingSoon ? "filled" : "outlined"}
        />
        {isEndingSoon && (
          <Chip 
            label="Ending Soon" 
            color="error" 
            size="small" 
          />
        )}
      </Box>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Batch Test Assignment"
          subtitle="Assign tests to multiple candidates at once"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Test Assignments', path: '/test-assignments' },
            { label: 'Batch Assignment' }
          ]}
          actionIcon={<AssignmentIcon />}
        />
        
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
          error={error}
          success={success}
          submitLabel={`Assign Test to ${selectedCandidates.length} Candidate(s)`}
          submitDisabled={selectedCandidates.length === 0 || !formData.test_id}
        >
          <FormSection title="Assignment Details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="test_id"
                  label="Select Test"
                  value={formData.test_id}
                  onChange={handleChange}
                  options={tests.map(test => ({
                    value: test.test_id,
                    label: `${test.test_name} (${typeof test.test_type === 'number' ? 
                        (test.test_type === 1 ? 'Psychometric' : 
                         test.test_type === 2 ? 'Probation' : 'Type ' + test.test_type) : 
                      test.test_type})`
                  }))}
                  required
                  helperText="Select the test to assign to candidates"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="supervisor_test_id"
                  label="Supervisor Feedback Form"
                  value={formData.supervisor_test_id}
                  onChange={handleChange}
                  options={[
                    { value: '', label: '-- No Supervisor Form --' },
                    ...supervisorFeedbackTests.map(test => ({
                      value: test.test_id,
                      label: test.test_name
                    }))
                  ]}
                  helperText="Optional: Select a form to be assigned to supervisors"
                />
                
                <Box sx={{ mt: 2 }}>
                  <FormSwitch
                        name="auto_assign_supervisor"
                    label="Automatically assign to supervisors if available"
                        checked={formData.auto_assign_supervisor}
                    onChange={handleAutoAssignChange}
                    helperText="Only candidates with assigned supervisors will receive the supervisor form"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormDatePicker
                  name="scheduled_date"
                  label="Scheduled Date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                  helperText="Date when the test becomes available"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormDatePicker
                  name="expiry_date"
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  required
                  minDate={formData.scheduled_date}
                  helperText="Last date when the test can be taken"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="assignment_status"
                  label="Status"
                  value={formData.assignment_status}
                  onChange={handleChange}
                  options={[
                    { value: 1, label: 'Active' },
                    { value: 0, label: 'Inactive' }
                  ]}
                />
              </Grid>
            </Grid>
          </FormSection>
          
          <FormSection title="Select Candidates">
            <Accordion 
              defaultExpanded 
              elevation={0} 
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                mb: 2
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterListIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Filters</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                  name="department"
                      label="Filter by Department"
                  value={filters.department}
                  onChange={handleFilterChange}
                      options={[
                        { value: '', label: 'All Departments' },
                        ...departments.map(dept => ({
                          value: dept.dept_id,
                          label: dept.dept_name
                        }))
                      ]}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                  name="institute"
                      label="Filter by Institute"
                  value={filters.institute}
                  onChange={handleFilterChange}
                      options={[
                        { value: '', label: 'All Institutes' },
                        ...institutes.map(inst => ({
                          value: inst.inst_id,
                          label: inst.inst_name
                        }))
                      ]}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                  name="category"
                      label="Filter by Category"
                  value={filters.category}
                  onChange={handleFilterChange}
                      options={[
                        { value: '', label: 'All Categories' },
                        ...categories.map(cat => ({
                          value: cat.cat_id,
                          label: cat.cat_name
                        }))
                      ]}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                  name="job"
                      label="Filter by Job"
                  value={filters.job}
                  onChange={handleFilterChange}
                      options={[
                        { value: '', label: 'All Jobs' },
                        ...jobs.map(job => ({
                          value: job.job_id,
                          label: job.job_name
                        }))
                      ]}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormSelectField
                  name="candidateType"
                      label="Filter by Status"
                  value={filters.candidateType}
                  onChange={handleFilterChange}
                      options={[
                        { value: '', label: 'All Candidates' },
                        { value: 'initial', label: 'Initial Hiring' },
                        { value: 'probation', label: 'On Probation' },
                        { value: 'probation-ending', label: 'Probation Ending Soon' },
                        { value: 'permanent', label: 'Permanent Employees' }
                      ]}
                      size="small"
                    />
                {filters.candidateType === 'probation-ending' && probationEndingCandidates.length > 0 && (
                      <Typography variant="caption" color="secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {probationEndingCandidates.length} candidates with probation ending soon
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                  name="searchQuery"
                      label="Search Candidates"
                  placeholder="Search by name, CNIC, or email"
                  value={filters.searchQuery}
                  onChange={handleFilterChange}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Button
                variant="outlined"
                    onClick={handleSelectAll}
                startIcon={selectedCandidates.length === filteredCandidates.length ? null : <CheckIcon />}
                color="primary"
                size="small"
                  >
                    {selectedCandidates.length === filteredCandidates.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                    {selectedCandidates.length} of {filteredCandidates.length} candidates selected
              </Typography>
            </Box>
            
                {filteredCandidates.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No candidates found matching the filters.
              </Alert>
            ) : (
              <Paper variant="outlined" sx={{ mb: 2 }}>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedCandidates.length > 0 && selectedCandidates.length < filteredCandidates.length}
                            checked={filteredCandidates.length > 0 && selectedCandidates.length === filteredCandidates.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email/CNIC</TableCell>
                        <TableCell>Institute/Department</TableCell>
                        <TableCell>Job</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Probation End</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCandidates.map(candidate => {
                        const isSelected = selectedCandidates.includes(candidate._id);
                        const isEndingSoon = probationEndingCandidates.some(c => c._id === candidate._id);
                        
                        // Find the job details
                        const job = jobs.find(j => j.job_id === candidate.job_id || 
                                                  j.job_id === candidate.current_job_id || 
                                                  j.job_id === candidate.applied_job_id);
                        
                        return (
                          <TableRow 
                            key={candidate._id} 
                            hover
                            selected={isSelected}
                            onClick={() => handleCandidateSelect(candidate._id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleCandidateSelect(candidate._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                                {candidate.cand_name || 'Unnamed'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{candidate.cand_email || 'No email'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {candidate.cand_cnic_no || 'No CNIC'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {getEntityName(candidate.inst_id, institutes, 'inst_id', 'inst_name')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getEntityName(candidate.dept_id, departments, 'dept_id', 'dept_name')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {job ? job.job_name : '-'}
                            </TableCell>
                            <TableCell>
                              {renderCandidateType(candidate.candidate_type, isEndingSoon)}
                            </TableCell>
                            <TableCell>
                              {candidate.probation_end_date ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CalendarIcon 
                                    fontSize="small" 
                                    color={isEndingSoon ? "error" : "action"} 
                                    sx={{ mr: 0.5 }} 
                                  />
                                  <Typography variant="body2">
                                    {new Date(candidate.probation_end_date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={filteredCandidates.length}
                  page={page}
                  onPageChange={handlePageChange}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </Paper>
            )}
          </FormSection>
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default BatchTestAssignmentForm; 