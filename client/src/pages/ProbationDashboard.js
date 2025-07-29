import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  useTheme,
  Autocomplete,
  Stack,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  HourglassTop as HourglassIcon,
  Business as BusinessIcon,
  SupervisorAccount as SupervisorIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { getProbationEndingCandidates, getSupervisors, getDepartments, getOrganizations, getCandidate, getInstitutes } from '../utils/api';

// Helper function to normalize IDs between API responses
const normalizeId = (id) => {
  if (!id) return null;
  // Handle string IDs or ObjectIDs (which might be returned as objects with an id field)
  if (typeof id === 'object' && id._id) return id._id;
  if (typeof id === 'object' && id.id) return id.id;
  return id;
};

const ProbationDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [timeframe, setTimeframe] = useState(30); // Default to 30 days
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [newBoard, setNewBoard] = useState({
    board_name: '',
    board_description: '',
    board_date: new Date().toISOString().split('T')[0],
    board_type: 'probation',
    supervisors: []
  });
  const [supervisors, setSupervisors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [supervisorMap, setSupervisorMap] = useState({});
  const [departmentMap, setDepartmentMap] = useState({});
  const [organizationMap, setOrganizationMap] = useState({});
  const [institutes, setInstitutes] = useState([]);
  const [instituteMap, setInstituteMap] = useState({});
  
  useEffect(() => {
    loadProbationCandidates();
    loadSupervisors();
    loadDepartments();
    loadOrganizations();
    loadInstitutes();
  }, [timeframe]);
  
  const loadProbationCandidates = async () => {
    try {
      setLoading(true);
      const response = await getProbationEndingCandidates(timeframe);
      if (response.data.success) {
        const candidateData = response.data.data || [];
        console.log("Probation candidates from API:", candidateData);
        
        // Enrich each candidate with complete data
        const detailedCandidates = await Promise.all(
          candidateData.map(async (candidate) => {
            try {
              // Get the correct ID regardless of format
              const candidateId = normalizeId(candidate._id);
              if (!candidateId) {
                console.warn("Candidate has no valid ID:", candidate);
                return candidate;
              }
              
              // Fetch complete candidate data 
              const detailedResponse = await getCandidate(candidateId);
              
              if (detailedResponse.data.success) {
                const detailedData = detailedResponse.data.data;
                console.log(`Detailed data for candidate ${candidateId}:`, detailedData);
                
                // Create properly merged candidate object with all the data we need
                const mergedCandidate = {
                  // Start with detailed data
                  ...detailedData,
                  
                  // Make sure we preserve the correct ID
                  _id: candidateId,
                  
                  // Preserve probation-specific fields
                  probation_start_date: candidate.probation_start_date || detailedData.probation_start_date,
                  probation_end_date: candidate.probation_end_date || detailedData.probation_end_date,
                  
                  // Preserve department, institute and organization data - use objects from probation data if available
                  dept_id: candidate.dept_id || detailedData.dept_id,
                  inst_id: candidate.inst_id || detailedData.inst_id,
                  org_id: candidate.org_id || detailedData.org_id,
                  
                  // Preserve original fields that our helper functions expect
                  department: detailedData.department || candidate.department,
                  department_id: detailedData.department_id || candidate.department_id,
                  institute: detailedData.institute || candidate.institute,
                  institute_id: detailedData.institute_id || candidate.institute_id,
                  organization: detailedData.organization || candidate.organization,
                  
                  // Ensure supervisor data is preserved
                  supervisor: detailedData.supervisor || candidate.supervisor,
                  supervisor_id: candidate.supervisor_id || detailedData.supervisor_id,
                };
                
                console.log(`Merged candidate ${candidateId}:`, mergedCandidate);
                return mergedCandidate;
              }
              console.warn(`No detailed data returned for candidate ${candidateId}`);
              return candidate;
            } catch (err) {
              console.error(`Error fetching details for candidate:`, err);
              return candidate; // Return original candidate data if fetch fails
            }
          })
        );
        
        console.log("Final enriched candidates:", detailedCandidates);
        setCandidates(detailedCandidates);
      } else {
        toast.error('Failed to load probation candidates');
      }
    } catch (err) {
      console.error('Error loading probation candidates:', err);
      toast.error('Error loading probation candidates');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSupervisors = async () => {
    try {
      setLoadingSupervisors(true);
      const response = await getSupervisors();
      if (response.data.success) {
        const supervisorList = response.data.data || [];
        setSupervisors(supervisorList);
        
        console.log("Loaded supervisors:", supervisorList);
        
        // Create a map of supervisor ID to supervisor name for quick lookup
        const map = {};
        supervisorList.forEach(supervisor => {
          // Handle different supervisor data structures
          const name = supervisor.profile
            ? `${supervisor.profile.firstName || ''} ${supervisor.profile.lastName || ''}`.trim() || supervisor.username
            : supervisor.username || "Supervisor " + supervisor._id.substring(0, 5);
          
          // Store with the supervisor ID as key
          if (supervisor._id) {
            map[supervisor._id] = name;
          }
        });
        
        console.log("Supervisor map created:", map);
        setSupervisorMap(map);
      }
    } catch (err) {
      console.error('Error loading supervisors:', err);
      toast.error('Failed to load supervisor list');
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      if (response.data.success) {
        const deptList = response.data.data || [];
        setDepartments(deptList);
        
        // Create a map for quick lookup
        const map = {};
        deptList.forEach(dept => {
          map[dept.dept_id] = dept.dept_name;
        });
        setDepartmentMap(map);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await getOrganizations();
      if (response.data.success) {
        const orgList = response.data.data || [];
        setOrganizations(orgList);
        
        // Create a map for quick lookup
        const map = {};
        orgList.forEach(org => {
          map[org.org_id] = org.org_name;
        });
        setOrganizationMap(map);
      }
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };
  
  const loadInstitutes = async () => {
    try {
      const response = await getInstitutes();
      if (response.data.success) {
        const instList = response.data.data || [];
        setInstitutes(instList);
        
        // Create a map for quick lookup
        const map = {};
        instList.forEach(inst => {
          map[inst.inst_id] = inst.inst_name;
        });
        setInstituteMap(map);
      }
    } catch (err) {
      console.error('Error loading institutes:', err);
    }
  };
  
  const handleCreateBoardOpen = () => {
    setCreateBoardOpen(true);
  };
  
  const handleCreateBoardClose = () => {
    setCreateBoardOpen(false);
  };
  
  const handleTimeframeChange = (event) => {
    setTimeframe(Number(event.target.value));
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBoard({
      ...newBoard,
      [name]: value
    });
  };
  
  const handleCreateBoard = () => {
    // Validate form
    if (!newBoard.board_name) {
      toast.error('Board name is required');
      return;
    }
    
    if (!newBoard.board_date) {
      toast.error('Board date is required');
      return;
    }
    
    // Navigate to board creation page with prefilled data
    navigate('/boards/create', { 
      state: { 
        createBoardData: {
          board_name: newBoard.board_name,
          board_description: newBoard.board_description,
          board_date: newBoard.board_date,
          board_type: 'probation',
          panel_members: [],
          supervisors: newBoard.supervisors
        },
        selectedCandidateIds: selectedCandidates,
        fromProbationDashboard: true
      }
    });
    setCreateBoardOpen(false);
  };
  
  const handleToggleCandidate = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };
  
  const formatTimeRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = Math.abs(end - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Helper function to get supervisor name - completely rewritten
  const getSupervisorName = (candidate) => {
    if (!candidate) return null;
    
    // More detailed debugging output
    console.log("Supervisor raw data:", {
      supervisorData: candidate.supervisor,
      supervisorId: candidate.supervisor_id,
      supervisorType: candidate.supervisor_id ? typeof candidate.supervisor_id : null,
      supervisorIdString: candidate.supervisor_id ? String(candidate.supervisor_id) : null,
      mappedValue: candidate.supervisor_id ? supervisorMap[candidate.supervisor_id] : null
    });
    
    // If supervisor data is an object with a username property
    if (candidate.supervisor && typeof candidate.supervisor === 'object') {
      // Check if it has a profile with names
      if (candidate.supervisor.profile) {
        const firstName = candidate.supervisor.profile.firstName || '';
        const lastName = candidate.supervisor.profile.lastName || '';
        if (firstName || lastName) {
          return `${firstName} ${lastName}`.trim();
        }
      }
      
      // Fall back to username if available
      if (candidate.supervisor.username) {
        return candidate.supervisor.username;
      }
      
      // If it's some other object, try to get a meaningful string
      return "Supervisor";
    }
    
    // If we have a supervisor_id, try to get from the map
    if (candidate.supervisor_id) {
      // If it's in our map, use that
      if (supervisorMap[candidate.supervisor_id]) {
        return supervisorMap[candidate.supervisor_id];
      }
      
      // For string IDs, just show a shortened version
      if (typeof candidate.supervisor_id === 'string') {
        return `sup ${candidate.supervisor_id.substring(0, 5)}`;
      }
      
      // If it's an object with an _id field (common MongoDB format)
      if (typeof candidate.supervisor_id === 'object' && candidate.supervisor_id._id) {
        // Try the map with the _id
        if (supervisorMap[candidate.supervisor_id._id]) {
          return supervisorMap[candidate.supervisor_id._id];
        }
        
        // Otherwise just use a shortened ID
        return `sup ${String(candidate.supervisor_id._id).substring(0, 5)}`;
      }
      
      // As a last resort
      return "Supervisor";
    }
    
    return "No supervisor";
  };

  // Helper function to get department name
  const getDepartmentName = (candidate) => {
    if (!candidate) return null;
    
    // Check for department.dept_name (standard format)
    if (candidate.department && candidate.department.dept_name) {
      return candidate.department.dept_name;
    }
    
    // Check for dept_id object format from API (as seen in console logs)
    if (candidate.dept_id) {
      if (typeof candidate.dept_id === 'object' && candidate.dept_id.dept_name) {
        return candidate.dept_id.dept_name;
      }
    }
    
    // Check for department_id
    const departmentId = candidate.department_id;
    if (departmentId && departmentMap[departmentId]) {
      return departmentMap[departmentId];
    }
    
    return null;
  };

  // Helper function to get organization name
  const getOrganizationName = (candidate) => {
    if (!candidate) return null;
    
    // Check for organization.org_name (standard format)
    if (candidate.organization && candidate.organization.org_name) {
      return candidate.organization.org_name;
    }
    
    // Check for org_id object format from API (as seen in console logs)
    if (candidate.org_id) {
      if (typeof candidate.org_id === 'object' && candidate.org_id.org_name) {
        return candidate.org_id.org_name;
      }
    }
    
    // Check for org_id as string
    const organizationId = typeof candidate.org_id === 'string' ? candidate.org_id : null;
    if (organizationId && organizationMap[organizationId]) {
      return organizationMap[organizationId];
    }
    
    return null;
  };
  
  // Helper function to get institute name
  const getInstituteName = (candidate) => {
    if (!candidate) return null;
    
    // Check for inst_id object format from API (as seen in console logs)
    if (candidate.inst_id) {
      if (typeof candidate.inst_id === 'object' && candidate.inst_id.inst_name) {
        return candidate.inst_id.inst_name;
      }
    }
    
    // Check for institute_id as string
    const instituteId = candidate.institute_id || (typeof candidate.inst_id === 'string' ? candidate.inst_id : null);
    if (instituteId && instituteMap[instituteId]) {
      return instituteMap[instituteId];
    }
    
    return null;
  };
  
  return (
    <MainLayout>
      <Box p={2}>
        <PageHeader
          title="Probation Dashboard"
          subtitle="View candidates whose probation period is ending soon"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Probation Management' }
          ]}
          actionLabel="Create Evaluation Board"
          actionIcon={<AddIcon />}
          onActionClick={handleCreateBoardOpen}
          actionDisabled={selectedCandidates.length === 0}
        />
        
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">
              Show candidates with probation ending within:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={timeframe}
                onChange={handleTimeframeChange}
                displayEmpty
              >
                <MenuItem value={15}>15 days</MenuItem>
                <MenuItem value={30}>30 days</MenuItem>
                <MenuItem value={60}>60 days</MenuItem>
                <MenuItem value={90}>90 days</MenuItem>
              </Select>
            </FormControl>
            
            {selectedCandidates.length > 0 && (
              <Chip 
                label={`${selectedCandidates.length} candidate${selectedCandidates.length > 1 ? 's' : ''} selected`}
                color="primary"
                variant="outlined"
                onDelete={() => setSelectedCandidates([])}
              />
            )}
          </Box>
        </Paper>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress />
          </Box>
        ) : candidates.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No candidates with probation ending within {timeframe} days found.
          </Alert>
        ) : (
          <Paper elevation={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Candidate Name</TableCell>
                    <TableCell>Supervisor</TableCell>
                    <TableCell>Department/Organization</TableCell>
                    <TableCell>Probation Started</TableCell>
                    <TableCell>Probation Ends</TableCell>
                    <TableCell>Time Left</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map(candidate => {
                    const isSelected = selectedCandidates.includes(candidate._id);
                    const supervisorName = getSupervisorName(candidate);
                    const departmentName = getDepartmentName(candidate);
                    const organizationName = getOrganizationName(candidate);
                    
                    return (
                      <TableRow 
                        key={candidate._id}
                        selected={isSelected}
                        sx={{
                          '&:hover': { backgroundColor: theme.palette.action.hover },
                          cursor: 'pointer'
                        }}
                        onClick={() => handleToggleCandidate(candidate._id)}
                      >
                        <TableCell padding="checkbox">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // Handled by row click
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                              {candidate.cand_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {supervisorName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SupervisorIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                              <Typography variant="body2">
                                {supervisorName}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No supervisor assigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {departmentName && (
                            <Typography variant="body2">
                              {departmentName}
                            </Typography>
                          )}
                          {getInstituteName(candidate) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <SchoolIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                              {getInstituteName(candidate)}
                            </Typography>
                          )}
                          {organizationName && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <BusinessIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                              {organizationName}
                            </Typography>
                          )}
                          {!departmentName && !organizationName && !getInstituteName(candidate) && (
                            <Typography variant="body2" color="text.secondary">
                              Not assigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {candidate.probation_start_date ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.info.main }} />
                              <Typography variant="body2">
                                {new Date(candidate.probation_start_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not set
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {candidate.probation_end_date ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.error.main }} />
                              <Typography variant="body2">
                                {new Date(candidate.probation_end_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not set
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {candidate.probation_end_date && (
                            <Chip
                              icon={<AccessTimeIcon />}
                              label={formatTimeRemaining(candidate.probation_end_date)}
                              color="warning"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidates/edit/${candidate._id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
        
        {/* Create Board Dialog */}
        <Dialog 
          open={createBoardOpen} 
          onClose={handleCreateBoardClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            pb: 1, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AddIcon color="primary" />
            Create Probation Evaluation Board
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            {selectedCandidates.length > 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected for evaluation
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  name="board_name"
                  label="Board Name"
                  value={newBoard.board_name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Enter a descriptive name for this evaluation board"
                  InputLabelProps={{ shrink: true }}
                  error={!newBoard.board_name && newBoard.board_name !== undefined}
                  helperText={!newBoard.board_name && newBoard.board_name !== undefined ? "Board name is required" : ""}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="board_date"
                  label="Board Date"
                  type="date"
                  value={newBoard.board_date}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!newBoard.board_date && newBoard.board_date !== undefined}
                  helperText={!newBoard.board_date && newBoard.board_date !== undefined ? "Date is required" : ""}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="board_description"
                  label="Board Description"
                  value={newBoard.board_description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Provide additional details about this board's purpose"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label="Supervisors" />
                </Divider>
                
                <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                  {loadingSupervisors ? (
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Loading supervisors...
                      </Typography>
                    </Box>
                  ) : (
                    <Autocomplete
                      multiple
                      id="supervisors-autocomplete"
                      options={supervisors}
                      value={supervisors.filter(supervisor => newBoard.supervisors.includes(supervisor._id))}
                      getOptionLabel={(supervisor) => {
                        return supervisor.profile
                          ? `${supervisor.profile.firstName || ''} ${supervisor.profile.lastName || ''}`.trim() || supervisor.username
                          : supervisor.username;
                      }}
                      onChange={(event, newValue) => {
                        setNewBoard({
                          ...newBoard,
                          supervisors: newValue.map(supervisor => supervisor._id)
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Supervisors"
                          placeholder="Search for supervisors"
                          helperText="Select supervisors whose candidates will be evaluated"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const name = option.profile
                            ? `${option.profile.firstName || ''} ${option.profile.lastName || ''}`.trim() || option.username
                            : option.username;
                          
                          return (
                            <Chip
                              label={name}
                              size="small"
                              {...getTagProps({ index })}
                              icon={<SupervisorIcon fontSize="small" />}
                            />
                          );
                        })
                      }
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <SupervisorIcon fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2">
                                {option.profile
                                  ? `${option.profile.firstName || ''} ${option.profile.lastName || ''}`.trim() || option.username
                                  : option.username}
                              </Typography>
                              {option.department && (
                                <Typography variant="caption" color="text.secondary">
                                  {typeof option.department === 'object' ? option.department.dept_name : option.department}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </li>
                      )}
                    />
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button 
              onClick={handleCreateBoardClose}
              variant="outlined"
              startIcon={<span className="material-icons-outlined">close</span>}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBoard} 
              variant="contained" 
              color="primary"
              disabled={!newBoard.board_name || !newBoard.board_date}
              startIcon={<span className="material-icons-outlined">arrow_forward</span>}
            >
              Continue to Board Setup
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default ProbationDashboard; 