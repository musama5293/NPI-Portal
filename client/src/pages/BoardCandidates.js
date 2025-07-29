import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  FormControlLabel,
  Switch,
  Pagination,
  OutlinedInput,
  InputAdornment,
  LinearProgress,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Quiz as QuizIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { 
  getBoard, 
  getBoardCandidates, 
  getCandidates,
  assignCandidatesToBoard, 
  removeCandidateFromBoard,
  getJobs,
  getOrganizations,
  getDepartments,
  getInstitutes,
  getCategories,
  getCandidatesByJob
} from '../utils/api';
import axios from 'axios';

const BoardCandidates = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    job_id: '',
    gender: '',
    status: '1', // Default to active candidates
    org_id: '',
    dept_id: '',
    inst_id: '',
    cat_id: ''
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Add a new state for candidate search
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');

  useEffect(() => {
    loadBoardData();
    loadJobs();
    loadOrganizations();
    loadDepartments();
    loadInstitutes();
    loadCategories();
  }, [boardId]);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      
      // Get board details
      const boardResponse = await getBoard(boardId);
      if (!boardResponse.data.success) {
        toast.error('Failed to load board details');
        navigate('/boards');
        return;
      }
      
      const boardData = boardResponse.data.data;
      setBoard(boardData);
      
      // Get candidates assigned to this board
      const candidatesResponse = await getBoardCandidates(boardId);
      if (candidatesResponse.data.success) {
        setCandidates(candidatesResponse.data.data || []);
      }
    } catch (err) {
      console.error('Error loading board data:', err);
      toast.error('Failed to load board data');
      navigate('/boards');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      // Direct API call to get full job details
      const response = await axios.get(`http://localhost:5000/api/jobs`);
      if (response.data.success) {
        console.log('Jobs data:', response.data.data);
        setJobs(response.data.data);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      toast.error('Failed to load job positions');
    }
  };
  
  const loadOrganizations = async () => {
    try {
      const response = await getOrganizations();
      if (response.data.success) {
        setOrganizations(response.data.data);
      }
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };
  
  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadInstitutes = async () => {
    try {
      const response = await getInstitutes();
      if (response.data.success) {
        setInstitutes(response.data.data);
      }
    } catch (err) {
      console.error('Error loading institutes:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Update filter state
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    
    // Apply filter automatically without needing the button
    setPage(1);
    setTimeout(() => {
      loadAvailableCandidates(1, newFilters);
    }, 0);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      job_id: '',
      gender: '',
      status: '1',
      org_id: '',
      dept_id: '',
      inst_id: '',
      cat_id: ''
    };
    
    setFilters(resetFilters);
    setSearchTerm('');
    setPage(1);
    
    // Apply reset immediately
    loadAvailableCandidates(1, resetFilters);
  };

  const handleSearchCandidates = () => {
    setPage(1); // Reset to first page on new search
    loadAvailableCandidates(1);
  };
  
  const handleOpenAssignDialog = async () => {
    try {
      // Make sure reference data is loaded before opening the dialog
      if (organizations.length === 0) {
        await loadOrganizations();
      }
      
      if (departments.length === 0) {
        await loadDepartments();
      }
      
      if (jobs.length === 0) {
        await loadJobs();
      }
      
      // Reset and initialize expanded jobs
      const initialExpandedState = {};
      jobs.forEach(job => {
        initialExpandedState[job.job_id] = true; // Expand all job groups by default
      });
      // Also expand the "unassigned" group
      initialExpandedState['unassigned'] = true;
      
      setExpandedJobs(initialExpandedState);
    setAssignDialogOpen(true);
    setSelectedCandidates([]);
    setPage(1);
    loadAvailableCandidates(1);
    } catch (error) {
      console.error("Error loading reference data:", error);
      toast.error("Failed to load some reference data. Organization information might be incomplete.");
      
      // Open the dialog anyway
      setAssignDialogOpen(true);
      setSelectedCandidates([]);
      setPage(1);
      loadAvailableCandidates(1);
    }
  };
  
  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedCandidates([]);
    setShowSelectedOnly(false);
    setSelectAll(false);
  };
  
  const handleCandidateSelection = (candidate) => {
    console.log("Selecting candidate:", candidate._id, candidate.cand_name);
    console.log("Current selection:", selectedCandidates.map(c => ({ id: c._id, name: c.cand_name })));
    
    setSelectedCandidates(prev => {
      const isSelected = prev.some(c => c._id === candidate._id);
      console.log("Is already selected:", isSelected);
      
      if (isSelected) {
        // Remove from selection
        const newSelection = prev.filter(c => c._id !== candidate._id);
        console.log("New selection after removal:", newSelection.map(c => ({ id: c._id, name: c.cand_name })));
        return newSelection;
      } else {
        // Add to selection
        const newSelection = [...prev, candidate];
        console.log("New selection after addition:", newSelection.map(c => ({ id: c._id, name: c.cand_name })));
        return newSelection;
      }
    });
  };
  
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    console.log("Select All clicked, checked:", checked);
    setSelectAll(checked);
    
    if (checked) {
      console.log("Adding all visible candidates to selection");
      const allCandidates = [...selectedCandidates];
      
      // Add all currently visible candidates that aren't already selected
      availableCandidates.forEach(candidate => {
        if (!allCandidates.some(c => c._id === candidate._id)) {
          allCandidates.push(candidate);
        }
      });
      
      console.log("New selection after select all:", allCandidates.length, "candidates");
      setSelectedCandidates(allCandidates);
    } else {
      // If showing selected only, clear selection
      // Otherwise, just deselect current page
      if (showSelectedOnly) {
        console.log("Clearing all selections");
        setSelectedCandidates([]);
      } else {
        console.log("Deselecting only visible candidates");
        // Create a set of IDs of visible candidates for faster lookup
        const visibleIds = new Set(availableCandidates.map(c => c._id));
        console.log("Visible candidate IDs:", [...visibleIds]);
        
        // Keep only candidates that are not currently visible
        setSelectedCandidates(prev => {
          const filtered = prev.filter(c => !visibleIds.has(c._id));
          console.log("Remaining selected candidates:", filtered.length);
          return filtered;
        });
      }
    }
  };
  
  const handleAssignCandidates = async () => {
    if (selectedCandidates.length === 0) {
      toast.warn('Please select at least one candidate to assign');
      return;
    }
    
    setAssigning(true);
    try {
      const candidateIds = selectedCandidates.map(candidate => candidate._id);
      await assignCandidatesToBoard(boardId, candidateIds);
      toast.success(`${selectedCandidates.length} candidates assigned to board`);
      handleCloseAssignDialog();
      loadBoardData(); // Refresh data
    } catch (err) {
      console.error('Error assigning candidates:', err);
      toast.error('Failed to assign candidates to board');
    } finally {
      setAssigning(false);
    }
  };
  
  const handleRemoveCandidate = async (candidateId) => {
    if (window.confirm('Are you sure you want to remove this candidate from the board?')) {
      try {
        await removeCandidateFromBoard(boardId, candidateId);
        toast.success('Candidate removed from board');
        // Update candidates list
        setCandidates(candidates.filter(c => c._id !== candidateId));
      } catch (err) {
        console.error('Error removing candidate:', err);
        toast.error('Failed to remove candidate from board');
      }
    }
  };
  
  const handleViewAssessment = (candidateId) => {
    navigate(`/boards/${boardId}/candidates/${candidateId}/assessment`);
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    
    if (!showSelectedOnly) {
      loadAvailableCandidates(newPage);
    }
  };

  const toggleShowSelected = () => {
    setShowSelectedOnly(!showSelectedOnly);
    
    if (!showSelectedOnly) {
      // Switching to show selected only
      setSelectAll(true);
    } else {
      // Switching back to all candidates
      setSelectAll(false);
      loadAvailableCandidates(1);
      setPage(1);
    }
  };
  
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'completed':
        return <Chip label="Assessed" color="success" size="small" />;
      case 'in_progress':
        return <Chip label="In Progress" color="info" size="small" />;
      default:
        return <Chip label="Not Started" color="default" size="small" />;
    }
  };
  
  const getGenderIcon = (gender) => {
    if (gender === 'M') return <MaleIcon fontSize="small" sx={{ color: 'primary.main' }} />;
    if (gender === 'F') return <FemaleIcon fontSize="small" sx={{ color: 'secondary.main' }} />;
    return null;
  };

  // Helper function to get entity name by ID
  const getEntityName = (id, entityArray, idField, nameField) => {
    if (!id || !entityArray || entityArray.length === 0) return null;
    // Convert ID to number for numeric comparison if possible
    const numericId = !isNaN(Number(id)) ? Number(id) : id;
    const entity = entityArray.find(e => e[idField] === id || e[idField] === numericId);
    return entity ? entity[nameField] : null;
  };

  // Get job title by job ID
  const getJobTitle = (jobId) => {
    if (!jobId) return null;
    
    // First check if jobId is an object with job_title
    if (typeof jobId === 'object' && jobId !== null) {
      return jobId.job_title || jobId.job_name;
    }
    
    // Convert to number for comparison if it's numeric
    const numericId = !isNaN(Number(jobId)) ? Number(jobId) : jobId;
    
    // Find by job_id or _id
    const job = jobs.find(j => 
      (j.job_id !== undefined && j.job_id === numericId) || 
      (j._id !== undefined && j._id === jobId)
    );
    
    return job ? (job.job_title || job.job_name) : null;
  };
  
  // Get organization name by org ID
  const getOrgName = (orgId) => getEntityName(orgId, organizations, 'org_id', 'org_name') || 
    getEntityName(orgId, organizations, '_id', 'org_name');
  
  // Get department name by dept ID
  const getDeptName = (deptId) => getEntityName(deptId, departments, 'dept_id', 'dept_name') || 
    getEntityName(deptId, departments, '_id', 'dept_name');
  
  // Get institute name by inst ID
  const getInstName = (instId) => getEntityName(instId, institutes, 'inst_id', 'inst_name') || 
    getEntityName(instId, institutes, '_id', 'inst_name');
  
  // Get category name by cat ID
  const getCatName = (catId) => {
    if (!catId) return null;
    
    // First check if catId is an object with cat_name
    if (typeof catId === 'object' && catId !== null) {
      return catId.cat_name;
    }
    
    // Handle special case for 'mto' which appears to be a category type
    if (catId === 'mto') {
      return 'MTO';
    }
    
    // Convert to number for comparison if it's numeric
    const numericId = !isNaN(Number(catId)) ? Number(catId) : catId;
    
    // Find by cat_id or _id
    const category = categories.find(c => 
      (c.cat_id !== undefined && c.cat_id === numericId) || 
      (c._id !== undefined && c._id === catId)
    );
    
    return category ? category.cat_name : null;
  };

  const loadAvailableCandidates = async (newPage = page, currentFilters = filters) => {
    try {
      setLoadingCandidates(true);
      setNoResults(false);
      
      // Make sure organizations, departments, and other reference data is loaded
      if (organizations.length === 0) {
        await loadOrganizations();
      }
      
      if (departments.length === 0) {
        await loadDepartments();
      }
      
      if (jobs.length === 0) {
        await loadJobs();
      }
      
      // Special case for job filtering
      if (currentFilters.job_id) {
        // When job_id is specified, use the dedicated job candidates endpoint
        const jobId = !isNaN(Number(currentFilters.job_id)) ? 
          Number(currentFilters.job_id) : currentFilters.job_id;
        
        console.log(`Using job candidates endpoint with job ID: ${jobId}`);
        
        // Other filters that need to be passed alongside
        const otherParams = {
          page: newPage,
          limit: limit,
          include_details: true // Request to include organization and department details
        };
        
        if (searchTerm) {
          otherParams.search = searchTerm;
        }
        
        // Get candidates for the specific job
        try {
          const response = await getCandidatesByJob(jobId, otherParams);
          
          if (response.data.success) {
            console.log('Job candidates API response:', response.data);
            setTotalCandidates(response.data.count || 0);
            
            // Exclude candidates already assigned to this board
            const assignedIds = new Set(candidates.map(c => c._id));
            const filteredCandidates = response.data.data.filter(c => !assignedIds.has(c._id));
            
            // Ensure all candidates have expanded data
            const candidatesWithDetails = await enrichCandidatesWithDetails(filteredCandidates);
            
            setAvailableCandidates(candidatesWithDetails);
            setNoResults(candidatesWithDetails.length === 0);
          }
        } catch (jobErr) {
          console.error('Error fetching candidates by job:', jobErr);
          toast.error('Failed to filter by job position');
          
          // Fallback to regular candidates endpoint
          await fetchWithRegularEndpoint();
        }
      } else {
        // When no job_id filter, use the regular candidates endpoint
        await fetchWithRegularEndpoint();
      }
    } catch (err) {
      console.error('Error loading available candidates:', err);
      toast.error('Failed to load available candidates');
    } finally {
      setLoadingCandidates(false);
    }
    
    // Helper function to fetch with the regular candidates endpoint
    async function fetchWithRegularEndpoint() {
      // Build params object for filtering
      const params = { 
        ...currentFilters, 
        page: newPage, 
        limit: limit,
        include_details: true // Request to include organization and department details
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Remove job_id parameter since it's not supported in the main candidates endpoint
      if (params.job_id) {
        delete params.job_id;
      }
      
      console.log('Sending filter params to regular API:', params);
      const response = await getCandidates(params);
      
      if (response.data.success) {
        console.log('Regular API response:', response.data);
        setTotalCandidates(response.data.total);
        
        // Exclude candidates already assigned to this board
        const assignedIds = new Set(candidates.map(c => c._id));
        const filteredCandidates = response.data.data.filter(c => !assignedIds.has(c._id));
        
        // Ensure all candidates have expanded data
        const candidatesWithDetails = await enrichCandidatesWithDetails(filteredCandidates);
        
        setAvailableCandidates(candidatesWithDetails);
        setNoResults(candidatesWithDetails.length === 0);
      }
    }
  };
  
  // Helper function to ensure candidates have all required details
  const enrichCandidatesWithDetails = async (candidatesList) => {
    // If the list is empty, return it as is
    if (!candidatesList || candidatesList.length === 0) {
      return candidatesList;
    }
    
    // Create sets of all organization and department IDs that need to be loaded
    const orgIds = new Set();
    const deptIds = new Set();
    
    candidatesList.forEach(candidate => {
      if (candidate.org_id) {
        orgIds.add(candidate.org_id);
      }
      if (candidate.dept_id) {
        deptIds.add(candidate.dept_id);
      }
    });
    
    // If we have missing organizations, load them
    if (orgIds.size > 0 && organizations.length === 0) {
      await loadOrganizations();
    }
    
    // If we have missing departments, load them
    if (deptIds.size > 0 && departments.length === 0) {
      await loadDepartments();
    }
    
    // Return the original list, now that we've loaded the necessary reference data
    return candidatesList;
  };

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };
  
  // Add a function to filter candidates based on search term
  const filterCandidates = (candidates, searchTerm) => {
    if (!searchTerm) return candidates;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return candidates.filter(candidate => 
      (candidate.cand_name && candidate.cand_name.toLowerCase().includes(lowerSearchTerm)) ||
      (candidate.cand_email && candidate.cand_email.toLowerCase().includes(lowerSearchTerm)) ||
      (candidate.cand_mobile_no && candidate.cand_mobile_no.toLowerCase().includes(lowerSearchTerm)) ||
      (candidate.cand_whatsapp_no && candidate.cand_whatsapp_no.toLowerCase().includes(lowerSearchTerm)) ||
      (getJobTitle(candidate.current_job_id || candidate.applied_job_id) && 
       getJobTitle(candidate.current_job_id || candidate.applied_job_id).toLowerCase().includes(lowerSearchTerm)) ||
      (getOrgName(candidate.org_id) && 
       getOrgName(candidate.org_id).toLowerCase().includes(lowerSearchTerm)) ||
      (getDeptName(candidate.dept_id) && 
       getDeptName(candidate.dept_id).toLowerCase().includes(lowerSearchTerm))
    );
  };

  // Modify the groupCandidatesByJob function to handle unassigned job candidates
  const groupCandidatesByJob = () => {
    const filteredCandidates = filterCandidates(candidates, candidateSearchTerm);
    const groupedCandidates = {};
    const unassignedCandidates = [];
    
    filteredCandidates.forEach(candidate => {
      const jobId = candidate.current_job_id || candidate.applied_job_id;
      if (!jobId) {
        unassignedCandidates.push(candidate);
        return;
      }
      
      if (!groupedCandidates[jobId]) {
        groupedCandidates[jobId] = {
          jobId,
          jobTitle: getJobTitle(jobId),
          candidates: []
        };
      }
      
      groupedCandidates[jobId].candidates.push(candidate);
    });
    
    // Add unassigned candidates as a separate group
    if (unassignedCandidates.length > 0) {
      groupedCandidates['unassigned'] = {
        jobId: 'unassigned',
        jobTitle: 'Unassigned Job',
        candidates: unassignedCandidates
      };
    }
    
    return Object.values(groupedCandidates);
  };

  // Add a function to check if there are any candidates matching the search term
  const hasSearchResults = () => {
    return filterCandidates(candidates, candidateSearchTerm).length > 0;
  };

  // Add useEffect to auto-expand job groups when search term changes
  useEffect(() => {
    if (candidateSearchTerm) {
      // Get all job groups that have matching candidates
      const jobGroups = groupCandidatesByJob();
      
      // Auto-expand all job groups that have matching candidates
      const newExpandedState = {};
      jobGroups.forEach(group => {
        if (group.candidates.length > 0) {
          newExpandedState[group.jobId] = true;
        }
      });
      
      setExpandedJobs(prev => ({
        ...prev,
        ...newExpandedState
      }));
    }
  }, [candidateSearchTerm]);

  // Add a function to group available candidates by job for the assign dialog
  const groupAvailableCandidatesByJob = () => {
    const groupedCandidates = {};
    const unassignedCandidates = [];
    
    // Filter candidates if there's a search term
    const candidatesToGroup = searchTerm 
      ? availableCandidates.filter(candidate => 
          (candidate.cand_name && candidate.cand_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (candidate.cand_email && candidate.cand_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (getJobTitle(candidate.current_job_id || candidate.applied_job_id) && 
           getJobTitle(candidate.current_job_id || candidate.applied_job_id).toLowerCase().includes(searchTerm.toLowerCase())) ||
          (getOrgName(candidate.org_id) && 
           getOrgName(candidate.org_id).toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : availableCandidates;
    
    // Skip if showing only selected
    if (showSelectedOnly) {
      const selectedGroups = {};
      const selectedUnassigned = [];
      
      selectedCandidates.forEach(candidate => {
        const jobId = candidate.current_job_id || candidate.applied_job_id;
        if (!jobId) {
          selectedUnassigned.push(candidate);
          return;
        }
        
        if (!selectedGroups[jobId]) {
          selectedGroups[jobId] = {
            jobId,
            jobTitle: getJobTitle(jobId),
            candidates: []
          };
        }
        
        selectedGroups[jobId].candidates.push(candidate);
      });
      
      // Add unassigned candidates as a separate group
      if (selectedUnassigned.length > 0) {
        selectedGroups['unassigned'] = {
          jobId: 'unassigned',
          jobTitle: 'Unassigned Job',
          candidates: selectedUnassigned
        };
      }
      
      return Object.values(selectedGroups);
    }
    
    // Group by job
    candidatesToGroup.forEach(candidate => {
      const jobId = candidate.current_job_id || candidate.applied_job_id;
      if (!jobId) {
        unassignedCandidates.push(candidate);
        return;
      }
      
      if (!groupedCandidates[jobId]) {
        groupedCandidates[jobId] = {
          jobId,
          jobTitle: getJobTitle(jobId),
          candidates: []
        };
      }
      
      groupedCandidates[jobId].candidates.push(candidate);
    });
    
    // Add unassigned candidates as a separate group
    if (unassignedCandidates.length > 0) {
      groupedCandidates['unassigned'] = {
        jobId: 'unassigned',
        jobTitle: 'Unassigned Job',
        candidates: unassignedCandidates
      };
    }
    
    return Object.values(groupedCandidates);
  };

  // Add useEffect to expand job groups when assign dialog opens
  useEffect(() => {
    if (assignDialogOpen && availableCandidates.length > 0) {
      // Get all job IDs from available candidates
      const jobIds = new Set();
      availableCandidates.forEach(candidate => {
        const jobId = candidate.current_job_id || candidate.applied_job_id;
        if (jobId) {
          jobIds.add(jobId);
        }
      });
      
      // Create initial expanded state with all jobs expanded
      const initialExpandedState = {};
      jobIds.forEach(jobId => {
        initialExpandedState[jobId] = true;
      });
      
      // Also expand the "unassigned" group
      initialExpandedState['unassigned'] = true;
      
      // Update expanded jobs state
      setExpandedJobs(prev => ({
        ...prev,
        ...initialExpandedState
      }));
    }
  }, [assignDialogOpen, availableCandidates]);

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  const candidatesToDisplay = showSelectedOnly ? selectedCandidates : availableCandidates;

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title={`${board?.board_name || 'Board'} Candidates`}
          subtitle={`Manage candidates for ${board?.board_type === 'probation' ? 'probation' : 'initial'} evaluation board`}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Evaluation Boards', path: '/boards' },
            { label: board?.board_name || 'Board' }
          ]}
          actionLabel="Assign Candidates"
          actionIcon={<AddIcon />}
          onActionClick={handleOpenAssignDialog}
          backButton={{
            label: 'Back to Boards',
            path: '/boards',
            icon: <ArrowBackIcon />
          }}
        />
        
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">
              {candidates.length} Candidates Assigned
              {candidateSearchTerm && (
                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                  ({filterCandidates(candidates, candidateSearchTerm).length} found)
                </Typography>
              )}
              </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined"
                color="primary" 
                onClick={() => navigate(`/boards/edit/${boardId}`)}
              >
                Edit Board
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={`Type: ${board?.board_type === 'probation' ? 'Probation Evaluation' : 'Initial Assessment'}`} 
              color="info" 
                variant="outlined"
            />
            <Chip 
              label={`Status: ${board?.status.charAt(0).toUpperCase() + board?.status.slice(1)}`} 
              color={board?.status === 'active' ? 'success' : board?.status === 'completed' ? 'primary' : 'default'} 
              variant="outlined"
              />
            <Chip 
              label={`Date: ${new Date(board?.board_date).toLocaleDateString()}`} 
              color="secondary" 
              variant="outlined"
            />
            <Chip 
              label={`Panel: ${board?.panel_members?.length || 0} Members`} 
              color="warning" 
              variant="outlined"
            />
          </Box>
          
          {/* Add this after the board information chips and before the candidate list */}
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search candidates by name, email, job, organization..."
              value={candidateSearchTerm}
              onChange={(e) => setCandidateSearchTerm(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: candidateSearchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setCandidateSearchTerm('')}
                    >
                      ×
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          {/* Add this after the search field and before the job groups */}
          {candidates.length > 0 && candidateSearchTerm && !hasSearchResults() && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              No candidates match your search criteria.
            </Alert>
          )}
          
          {candidates.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No candidates are currently assigned to this board. 
              Click "Assign Candidates" to add candidates for evaluation.
            </Alert>
          ) : (
            <>
              {/* Job-grouped candidates view */}
              {groupCandidatesByJob().map(jobGroup => (
                <Paper 
                  key={jobGroup.jobId} 
                  variant="outlined" 
                  sx={{ mb: 2, overflow: 'hidden' }}
                >
                  {/* Job Header Row */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      backgroundColor: theme.palette.background.default,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                    onClick={() => toggleJobExpansion(jobGroup.jobId)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        {jobGroup.jobTitle || `Job ID: ${jobGroup.jobId}`}
                      </Typography>
                      <Chip 
                        label={`${jobGroup.candidates.length} Candidates`} 
                        size="small" 
                        color="primary"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    {expandedJobs[jobGroup.jobId] ? 
                      <KeyboardArrowUpIcon /> : 
                      <KeyboardArrowDownIcon />
                    }
                  </Box>
                  
                  {/* Collapsible Candidates Table */}
                  {expandedJobs[jobGroup.jobId] && (
              <TableContainer>
          <Table>
            <TableHead>
                          <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>Test Status</TableCell>
                      <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                          {jobGroup.candidates.map(candidate => (
                            <TableRow key={candidate._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" fontWeight="medium">
                                {candidate.cand_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {getGenderIcon(candidate.cand_gender)}
                            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                              {candidate.cand_gender === 'M' ? 'Male' : 
                                candidate.cand_gender === 'F' ? 'Female' : 'Other'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {candidate.cand_email || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {candidate.cand_mobile_no || candidate.cand_whatsapp_no || 'No contact'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getOrgName(candidate.org_id)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getDeptName(candidate.dept_id)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {candidate.test_scores && candidate.test_scores.completion_status === 'completed' ? (
                                <Chip 
                                  label="Completed" 
                                  color="success" 
                                  size="small" 
                                  icon={<QuizIcon />}
                                />
                              ) : candidate.test_scores ? (
                                <Chip 
                                  label={candidate.test_scores.completion_status === 'started' ? 'In Progress' : 'Pending'} 
                                  color="warning" 
                                  size="small" 
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="Not Assigned" 
                                  color="default" 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleViewAssessment(candidate._id)}
                                startIcon={<AssessmentIcon />}
                              >
                                Assessment
                              </Button>
                              <IconButton 
                                color="error"
                                size="small"
                                onClick={() => handleRemoveCandidate(candidate._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                    ))}
            </TableBody>
          </Table>
        </TableContainer>
                  )}
                </Paper>
              ))}
            </>
          )}
        </Paper>

        {/* The Assign Candidates Dialog */}
      <Dialog 
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
            <Typography variant="h6">Assign Candidates to Board</Typography>
        </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {/* Filter accordion */}
              <Accordion elevation={0} sx={{ mb: 2, border: `1px solid ${theme.palette.divider}` }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterListIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Filters</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Job Position</InputLabel>
                    <Select
                      name="job_id"
                      value={filters.job_id}
                      onChange={handleFilterChange}
                      label="Job Position"
                    >
                          <MenuItem value="">All Jobs</MenuItem>
                      {jobs.map(job => (
                            <MenuItem key={job.job_id} value={job.job_id}>
                              {job.job_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={filters.gender}
                      onChange={handleFilterChange}
                      label="Gender"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="M">Male</MenuItem>
                      <MenuItem value="F">Female</MenuItem>
                          <MenuItem value="O">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Organization</InputLabel>
                        <Select
                          name="org_id"
                          value={filters.org_id}
                          onChange={handleFilterChange}
                          label="Organization"
                        >
                          <MenuItem value="">All</MenuItem>
                          {organizations.map(org => (
                            <MenuItem key={org.org_id} value={org.org_id}>
                              {org.org_name}
                            </MenuItem>
                          ))}
                        </Select>
                  </FormControl>
                </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      label="Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="1">Active</MenuItem>
                      <MenuItem value="0">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleResetFilters}
                        size="small"
                  >
                    Reset Filters
                  </Button>
                      <Button 
                        variant="contained" 
                        onClick={handleSearchCandidates}
                        startIcon={<SearchIcon />}
                        size="small"
                      >
                        Search
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
              {/* Search and control bar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSearchTerm('');
                            loadAvailableCandidates(1);
                          }}
                        >
                          ×
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ width: { xs: '100%', sm: '300px' } }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadAvailableCandidates(1);
                    }
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showSelectedOnly}
                        onChange={toggleShowSelected}
                        color="primary"
                        size="small"
                      />
                    }
                    label="Show Selected Only"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        color="primary"
                        indeterminate={selectedCandidates.length > 0 && selectedCandidates.length < availableCandidates.length}
                      />
                    }
                    label="Select All"
                  />
            </Box>
              </Box>
              
              {/* Loading indicator */}
              {loadingCandidates && (
                <LinearProgress sx={{ mb: 2 }} />
              )}
              
              {/* Available candidates table */}
              {noResults ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  No candidates found matching your criteria.
            </Alert>
          ) : (
            <>
                  {/* Group candidates by job */}
                  {groupAvailableCandidatesByJob().map(jobGroup => (
                    <Paper 
                      key={jobGroup.jobId} 
                      variant="outlined" 
                      sx={{ mb: 2, overflow: 'hidden' }}
                    >
                      {/* Job Header Row */}
                      <Box 
                        sx={{ 
                          p: 2, 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          backgroundColor: theme.palette.background.default,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover
                          }
                        }}
                        onClick={() => toggleJobExpansion(jobGroup.jobId)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WorkIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          <Typography variant="subtitle1" fontWeight="medium">
                            {jobGroup.jobTitle || `Job ID: ${jobGroup.jobId}`}
                          </Typography>
                          <Chip 
                            label={`${jobGroup.candidates.length} Candidates`} 
                            size="small" 
                            color="primary"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        {expandedJobs[jobGroup.jobId] ? 
                          <KeyboardArrowUpIcon /> : 
                          <KeyboardArrowDownIcon />
                        }
                      </Box>
                      
                      {/* Collapsible Candidates Table */}
                      {expandedJobs[jobGroup.jobId] && (
                        <TableContainer>
                  <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                                    checked={jobGroup.candidates.every(c => 
                                      selectedCandidates.some(sc => sc._id === c._id)
                                    )}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      if (checked) {
                                        // Add all candidates in this job group that aren't already selected
                                        const newSelected = [...selectedCandidates];
                                        jobGroup.candidates.forEach(candidate => {
                                          if (!newSelected.some(c => c._id === candidate._id)) {
                                            newSelected.push(candidate);
                                          }
                                        });
                                        setSelectedCandidates(newSelected);
                                      } else {
                                        // Remove all candidates in this job group
                                        setSelectedCandidates(prev => 
                                          prev.filter(c => !jobGroup.candidates.some(gc => gc._id === c._id))
                                        );
                                      }
                                    }}
                                    indeterminate={
                                      jobGroup.candidates.some(c => selectedCandidates.some(sc => sc._id === c._id)) &&
                                      !jobGroup.candidates.every(c => selectedCandidates.some(sc => sc._id === c._id))
                                    }
                          />
                        </TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Gender</TableCell>
                          <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                              {jobGroup.candidates.map(candidate => {
                                const isSelected = selectedCandidates.some(c => c._id === candidate._id);
                            
                          return (
                            <TableRow 
                              key={candidate._id}
                              hover
                              selected={isSelected}
                              onClick={() => handleCandidateSelection(candidate)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleCandidateSelection(candidate);
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                                      {candidate.cand_name}
                                    </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {candidate.cand_email || 'No email'}
                                    </Typography>
                              </TableCell>
                              <TableCell>
                                {getGenderIcon(candidate.cand_gender)}
                                <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                  {candidate.cand_gender === 'M' ? 'Male' : 
                                    candidate.cand_gender === 'F' ? 'Female' : 'Other'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {getStatusChip(candidate.cand_status)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
                      )}
                    </Paper>
                  ))}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCandidates.length} of {totalCandidates} candidates selected
                    </Typography>
                  <Pagination 
                    count={Math.ceil(totalCandidates / limit)} 
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                      size="small"
                  />
                </Box>
            </>
          )}
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseAssignDialog}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            color="primary"
              onClick={handleAssignCandidates}
              disabled={selectedCandidates.length === 0 || assigning}
              startIcon={assigning ? <CircularProgress size={20} /> : <CheckIcon />}
          >
              {assigning ? 'Assigning...' : `Assign ${selectedCandidates.length} Candidates`}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </MainLayout>
  );
};

export default BoardCandidates; 