import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  Grid, 
  LinearProgress,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import { FormTextField, FormSelectField, FormSection } from '../components/common/FormFields';

const API_URL = 'http://localhost:5000';

const CandidateImport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('job');
  
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [job, setJob] = useState(null);
  const [manualCandidates, setManualCandidates] = useState([{ 
    firstName: '', 
    lastName: '', 
    email: '', 
    cnic_no: '', 
    mobile_no: '',
    whatsapp_no: '',
    gender: '',
    org_id: '',
    inst_id: '',
    dept_id: '',
    applied_job_id: '',
    cat_id: '',
    candidate_type: 'initial',
    hiring_status: 'applied',
    mode: 'R'
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);
  const [jobCandidates, setJobCandidates] = useState([]);

  useEffect(() => {
    // Fetch reference data for dropdowns
    fetchOrganizations();
    fetchJobs();
    fetchCategories();
    
    // If jobId is provided, fetch job details
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/organizations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setOrganizations(res.data.data.map(org => ({
          value: org.org_id,
          label: org.org_name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations.');
    }
  };

  const fetchInstitutes = async (orgId, candidateIndex) => {
    if (!orgId) return;
    try {
      const res = await axios.get(`${API_URL}/api/institutes?org_id=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setInstitutes(res.data.data.map(inst => ({
          value: inst.inst_id,
          label: inst.inst_name
        })));
        
        // Only reset if the user manually changed the organization
        // (not when called from fetchJobDetailsForCandidate)
        const isDirectOrgChange = new Error().stack.includes('onChange');
        
        if (isDirectOrgChange) {
          const updatedCandidates = [...manualCandidates];
          const currentCandidate = updatedCandidates[candidateIndex];
          updatedCandidates[candidateIndex] = {
            ...currentCandidate,
            inst_id: '',
            dept_id: ''
          };
          setManualCandidates(updatedCandidates);
        }
      }
    } catch (error) {
      console.error('Failed to fetch institutes:', error);
      toast.error('Failed to load institutes.');
    }
  };

  const fetchDepartments = async (instId, candidateIndex) => {
    if (!instId) return;
    try {
      const res = await axios.get(`${API_URL}/api/departments?inst_id=${instId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setDepartments(res.data.data.map(dept => ({
          value: dept.dept_id,
          label: dept.dept_name
        })));
        
        // Only reset if the user manually changed the institute
        // (not when called from fetchJobDetailsForCandidate)
        const isDirectInstChange = new Error().stack.includes('onChange');
        
        if (isDirectInstChange) {
          // Reset department for this candidate
          const updatedCandidates = [...manualCandidates];
          updatedCandidates[candidateIndex] = {
            ...updatedCandidates[candidateIndex],
            dept_id: ''
          };
          setManualCandidates(updatedCandidates);
        }
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments.');
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setJobs(res.data.data.map(job => ({
          value: job.job_id,
          label: job.job_name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs.');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/test/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setCategories(res.data.data.map(cat => ({
          value: cat.cat_id,
          label: cat.cat_name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories.');
    }
  };

  const fetchJobDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        const jobData = res.data.data;
        setJob(jobData);
        
        // Pre-fill organization, institute, department and category from job
        const initialCandidate = { ...manualCandidates[0] };
        initialCandidate.org_id = jobData.org_id;
        initialCandidate.inst_id = jobData.inst_id || '';
        initialCandidate.dept_id = jobData.dept_id || '';
        initialCandidate.applied_job_id = jobData.job_id;
        initialCandidate.cat_id = jobData.cat_id || '';
        
        setManualCandidates([initialCandidate]);
        
        // Fetch institutes and departments based on job's org and inst
        if (jobData.org_id) {
          fetchInstitutes(jobData.org_id, 0);
        }
        if (jobData.inst_id) {
          fetchDepartments(jobData.inst_id, 0);
        }
        
        // Also fetch candidates for this job to check vacancy count
        fetchJobCandidates(jobData.job_id);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details.');
    }
  };
  
  const fetchJobCandidates = async (jobId) => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}/candidates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        setJobCandidates(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job candidates:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if file is Excel
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // Add job details to the request if we're importing for a specific job
      let requestUrl = `${API_URL}/api/users/import-template`;
      if (job) {
        requestUrl += `?job_id=${job.job_id}&org_id=${job.org_id || ''}&inst_id=${job.inst_id || ''}&dept_id=${job.dept_id || ''}&cat_id=${job.cat_id || ''}`;
      }
      
      const response = await axios.get(requestUrl, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'candidate_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    
    if (jobId && job && (job.vacancy_count || 0) <= (jobCandidates.length || 0)) {
      toast.error('No vacancies available for this job. Cannot import more candidates.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add job details to the request if importing for a specific job
    if (jobId) {
      formData.append('job_id', job.job_id);
      formData.append('org_id', job.org_id);
      if (job.inst_id) formData.append('inst_id', job.inst_id);
      if (job.dept_id) formData.append('dept_id', job.dept_id);
      if (job.cat_id) formData.append('cat_id', job.cat_id);
    }
    
    try {
      const res = await axios.post(
        `${API_URL}/api/users/upload-import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      if (res.data.success) {
        toast.success(res.data.message);
        setImportResults(res.data.data);
        setActiveTab(2); // Switch to results tab
        
        // Refresh job candidates if importing for a specific job
        if (jobId) {
          fetchJobCandidates(jobId);
        }
      } else {
        toast.error(res.data.message || 'Import failed.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCandidate = () => {
    const newCandidate = { 
      firstName: '', 
      lastName: '', 
      email: '', 
      cnic_no: '', 
      mobile_no: '',
      whatsapp_no: '',
      gender: '',
      org_id: job?.org_id || '',
      inst_id: job?.inst_id || '',
      dept_id: job?.dept_id || '',
      applied_job_id: job?.job_id || '',
      cat_id: job?.cat_id || '',
      candidate_type: 'initial',
      hiring_status: 'applied',
      mode: 'R'
    };
    
    setManualCandidates([...manualCandidates, newCandidate]);
  };

  const handleRemoveCandidate = (index) => {
    const updatedCandidates = [...manualCandidates];
    updatedCandidates.splice(index, 1);
    setManualCandidates(updatedCandidates);
  };

  const handleCandidateChange = (index, field, value) => {
    const updatedCandidates = [...manualCandidates];
    updatedCandidates[index] = {
      ...updatedCandidates[index],
      [field]: value
    };
    
    // If the job field is being changed, fetch job details and apply them
    if (field === 'applied_job_id' && value) {
      fetchJobDetailsForCandidate(value, index);
    }
    
    setManualCandidates(updatedCandidates);
  };
  
  // Function to fetch job details and apply them to a candidate
  const fetchJobDetailsForCandidate = async (jobId, candidateIndex) => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        const jobData = res.data.data;
        
        // First, fetch institutes for the job's organization without resetting values
        if (jobData.org_id) {
          try {
            const instRes = await axios.get(`${API_URL}/api/institutes?org_id=${jobData.org_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            if (instRes.data.success) {
              setInstitutes(instRes.data.data.map(inst => ({
                value: inst.inst_id,
                label: inst.inst_name
              })));
            }
          } catch (error) {
            console.error('Failed to fetch institutes:', error);
          }
        }
        
        // Then, fetch departments for the job's institute without resetting values
        if (jobData.inst_id) {
          try {
            const deptRes = await axios.get(`${API_URL}/api/departments?inst_id=${jobData.inst_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            if (deptRes.data.success) {
              setDepartments(deptRes.data.data.map(dept => ({
                value: dept.dept_id,
                label: dept.dept_name
              })));
            }
          } catch (error) {
            console.error('Failed to fetch departments:', error);
          }
        }
        
        // Finally, update the candidate with job-related information
        const updatedCandidates = [...manualCandidates];
        updatedCandidates[candidateIndex] = {
          ...updatedCandidates[candidateIndex],
          org_id: jobData.org_id || '',
          inst_id: jobData.inst_id || '',
          dept_id: jobData.dept_id || '',
          cat_id: jobData.cat_id || '',
          applied_job_id: jobData.job_id
        };
        
        setManualCandidates(updatedCandidates);
        
        // Show success message
        toast.info(`Applied job details: ${jobData.job_name}`);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const handleManualSubmit = async () => {
    // Validate required fields
    const invalidCandidates = manualCandidates.filter(candidate => {
      if (!candidate.firstName) return true;
      if (!candidate.email) return true;
      if (!candidate.cnic_no) return true;
      if (!jobId && !candidate.org_id) return true;
      return false;
    });
    
    if (invalidCandidates.length > 0) {
      toast.error('Please fill in all required fields for all candidates.');
      return;
    }
    
    if (jobId && job && (job.vacancy_count || 0) <= (jobCandidates.length || 0)) {
      toast.error('No vacancies available for this job. Cannot import more candidates.');
      return;
    }
    
    if (jobId && job && (job.vacancy_count || 0) < (jobCandidates.length + manualCandidates.length)) {
      toast.error(`Only ${Math.max(0, (job.vacancy_count || 0) - (jobCandidates.length || 0))} vacancies available. Cannot add ${manualCandidates.length} candidates.`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process each candidate
      const results = {
        success: [],
        failed: []
      };
      
      for (const candidate of manualCandidates) {
        try {
          // If importing for a specific job, use job details
          const candidateData = { ...candidate };
          if (jobId && job) {
            candidateData.applied_job_id = job.job_id;
            candidateData.org_id = job.org_id;
            candidateData.inst_id = job.inst_id || null;
            candidateData.dept_id = job.dept_id || null;
            candidateData.cat_id = job.cat_id || null;
          }
          
          const res = await axios.post(
            `${API_URL}/api/users/register-candidate`,
            candidateData,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (res.data.success) {
            results.success.push({
              username: res.data.data.username,
              email: candidate.email,
              password: res.data.data.password,
              userId: res.data.data.userId,
              candidateId: res.data.data.candidateId
            });
          } else {
            results.failed.push({
              data: candidate,
              error: res.data.message
            });
          }
        } catch (error) {
          console.error('Error adding candidate:', error);
          results.failed.push({
            data: candidate,
            error: error.response?.data?.message || error.message
          });
        }
      }
      
      setImportResults(results);
      setActiveTab(2); // Switch to results tab
      
      // Reset form if all candidates were added successfully
      if (results.failed.length === 0) {
        setManualCandidates([{ 
          firstName: '', 
          lastName: '', 
          email: '', 
          cnic_no: '', 
          mobile_no: '',
          whatsapp_no: '',
          gender: '',
          org_id: jobId && job ? job.org_id : '',
          inst_id: jobId && job && job.inst_id ? job.inst_id : '',
          dept_id: jobId && job && job.dept_id ? job.dept_id : '',
          applied_job_id: jobId && job ? job.job_id : '',
          cat_id: jobId && job && job.cat_id ? job.cat_id : '',
          candidate_type: 'initial',
          hiring_status: 'applied',
          mode: 'R'
        }]);
      }
      
      // Refresh job candidates if importing for a specific job
      if (jobId) {
        fetchJobCandidates(jobId);
      }
      
      toast.success(`Successfully added ${results.success.length} candidates. Failed to add ${results.failed.length} candidates.`);
    } catch (error) {
      console.error('Error submitting candidates:', error);
      toast.error('Error submitting candidates.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearResults = () => {
    setImportResults(null);
  };
  
  const handleDone = () => {
    // If we came from a job page, go back there
    if (jobId) {
      navigate(`/jobs/candidates/${jobId}`);
    } else {
      navigate('/users');
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title={job ? `Import Candidates for ${job.job_name}` : "Candidate Import"}
          subtitle={job ? `Import multiple candidates for job: ${job.job_name}` : "Import multiple candidates into the system"}
          breadcrumbs={[
            { label: 'Administration' },
            job ? { label: 'Jobs', path: '/jobs' } : { label: 'Users', path: '/users' },
            job ? { label: job.job_name, path: `/jobs/candidates/${job.job_id}` } : null,
            { label: 'Candidate Import' }
          ].filter(Boolean)}
          actionLabel="Done"
          actionIcon={<ArrowBackIcon />}
          onActionClick={handleDone}
        />

        {jobId && job && (
          <Box mb={3}>
            <Alert severity="info">
              <AlertTitle>Importing candidates for job: {job.job_name}</AlertTitle>
              <Typography variant="body2">
                Organization: {job.organization?.org_name || 'N/A'}
                {job.institute && ` • Institute: ${job.institute.inst_name}`}
                {job.department && ` • Department: ${job.department.dept_name}`}
                {job.category && ` • Category: ${job.category.cat_name}`}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Vacancies: {job.vacancy_count || 0} • 
                Currently Assigned: {jobCandidates.length || 0} • 
                Available: {Math.max(0, (job.vacancy_count || 0) - (jobCandidates.length || 0))}
              </Typography>
              {(job.vacancy_count || 0) <= (jobCandidates.length || 0) && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Warning: No vacancies available for this job. You cannot import more candidates.
                </Typography>
              )}
            </Alert>
          </Box>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Excel Import" />
            <Tab label="Manual Entry" />
            {importResults && <Tab label="Results" />}
          </Tabs>

          {/* Excel Import Tab */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Download Template
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {job 
                          ? `Download our Excel template pre-configured for job: ${job.job_name}. 
                             Organization, institute, department, and job details will be automatically applied.`
                          : `Download our Excel template with the required format for importing candidates.
                             The template includes reference sheets with available options for organizations,
                             institutes, departments, jobs, and more.`
                        }
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadTemplate}
                      >
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Upload Excel File
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {job 
                          ? `Upload your completed Excel file with candidate information. 
                             All candidates will be automatically assigned to ${job.job_name} with the corresponding
                             organization, institute, and department details.`
                          : `Upload your completed Excel file with candidate information.
                             Make sure to follow the template format.`
                        }
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button
                            variant="contained"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                            disabled={isUploading}
                          >
                            Select File
                          </Button>
                        </label>
                        {file && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Selected: {file.name}
                          </Typography>
                        )}
                      </Box>
                      {isUploading && (
                        <Box sx={{ width: '100%', mb: 2 }}>
                          <LinearProgress variant="determinate" value={uploadProgress} />
                          <Typography variant="body2" align="center">
                            {uploadProgress}%
                          </Typography>
                        </Box>
                      )}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFileUpload}
                        disabled={!file || isUploading}
                        sx={{ mt: 1 }}
                      >
                        Upload & Import
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Manual Entry Tab */}
          {activeTab === 1 && (
            <Box>
              <FormSection title={job ? 
                "Add Multiple Candidates (Required: First Name, Email, CNIC)" : 
                "Add Multiple Candidates (Required: First Name, Email, CNIC, Organization)"
              }>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddCandidate}
                  >
                    Add Another Candidate
                  </Button>
                </Box>
                
                {manualCandidates.map((candidate, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 2, mb: 2, position: 'relative' }}
                  >
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      {manualCandidates.length > 1 && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveCandidate(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Candidate #{index + 1}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormTextField
                          name={`firstName-${index}`}
                          label="First Name"
                          value={candidate.firstName}
                          onChange={(e) => handleCandidateChange(index, 'firstName', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormTextField
                          name={`lastName-${index}`}
                          label="Last Name"
                          value={candidate.lastName}
                          onChange={(e) => handleCandidateChange(index, 'lastName', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormTextField
                          name={`email-${index}`}
                          label="Email"
                          value={candidate.email}
                          onChange={(e) => handleCandidateChange(index, 'email', e.target.value)}
                          required
                          type="email"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormTextField
                          name={`cnic_no-${index}`}
                          label="CNIC Number"
                          value={candidate.cnic_no}
                          onChange={(e) => handleCandidateChange(index, 'cnic_no', e.target.value)}
                          required
                          placeholder="e.g., 12345-1234567-1"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormTextField
                          name={`mobile_no-${index}`}
                          label="Mobile Number"
                          value={candidate.mobile_no}
                          onChange={(e) => handleCandidateChange(index, 'mobile_no', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormTextField
                          name={`whatsapp_no-${index}`}
                          label="WhatsApp Number"
                          value={candidate.whatsapp_no}
                          onChange={(e) => handleCandidateChange(index, 'whatsapp_no', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormSelectField
                          name={`gender-${index}`}
                          label="Gender"
                          value={candidate.gender}
                          onChange={(e) => handleCandidateChange(index, 'gender', e.target.value)}
                          options={[
                            { value: 'M', label: 'Male' },
                            { value: 'F', label: 'Female' },
                            { value: 'O', label: 'Other' }
                          ]}
                        />
                      </Grid>
                      
                      {/* Only show organization, institute, department, and job fields if not importing for a specific job */}
                      {!job && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <FormSelectField
                              name={`applied_job_id-${index}`}
                              label="Applied Job"
                              value={candidate.applied_job_id}
                              onChange={(e) => handleCandidateChange(index, 'applied_job_id', e.target.value)}
                              options={jobs}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormSelectField
                              name={`org_id-${index}`}
                              label="Organization"
                              value={candidate.org_id}
                              onChange={(e) => {
                                handleCandidateChange(index, 'org_id', e.target.value);
                                fetchInstitutes(e.target.value, index);
                              }}
                              options={organizations}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormSelectField
                              name={`inst_id-${index}`}
                              label="Institute"
                              value={candidate.inst_id}
                              onChange={(e) => {
                                handleCandidateChange(index, 'inst_id', e.target.value);
                                fetchDepartments(e.target.value, index);
                              }}
                              options={institutes}
                              disabled={!candidate.org_id}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormSelectField
                              name={`dept_id-${index}`}
                              label="Department"
                              value={candidate.dept_id}
                              onChange={(e) => handleCandidateChange(index, 'dept_id', e.target.value)}
                              options={departments}
                              disabled={!candidate.inst_id}
                            />
                          </Grid>
                        </>
                      )}
                      
                      {/* If importing for a specific job, show a message with the job details */}
                      {job && (
                        <Grid item xs={12}>
                          <Box sx={{ 
                            p: 2, 
                            mb: 2, 
                            bgcolor: 'rgba(0, 150, 136, 0.1)', 
                            borderRadius: 1,
                            border: '1px solid rgba(0, 150, 136, 0.3)'
                          }}>
                            <Typography variant="subtitle2" color="primary">
                              This candidate will be imported for:
                            </Typography>
                            <Typography variant="body2">
                              <strong>Job:</strong> {job.job_name}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Organization:</strong> {job.organization?.org_name || job.org_id}
                            </Typography>
                            {job.institute && (
                              <Typography variant="body2">
                                <strong>Institute:</strong> {job.institute?.inst_name || job.inst_id}
                              </Typography>
                            )}
                            {job.department && (
                              <Typography variant="body2">
                                <strong>Department:</strong> {job.department?.dept_name || job.dept_id}
                              </Typography>
                            )}
                            {job.category && (
                              <Typography variant="body2">
                                <strong>Category:</strong> {job.category?.cat_name || job.cat_id}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                              * Required fields: First Name, Email, CNIC
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      {/* Only show category field if not importing for a specific job with a category */}
                      {(!job || !job.cat_id) && (
                        <Grid item xs={12} sm={6}>
                          <FormSelectField
                            name={`cat_id-${index}`}
                            label="Category"
                            value={candidate.cat_id}
                            onChange={(e) => handleCandidateChange(index, 'cat_id', e.target.value)}
                            options={categories}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={4}>
                        <FormSelectField
                          name={`candidate_type-${index}`}
                          label="Candidate Type"
                          value={candidate.candidate_type}
                          onChange={(e) => handleCandidateChange(index, 'candidate_type', e.target.value)}
                          options={[
                            { value: 'initial', label: 'Initial Hiring' },
                            { value: 'probation', label: 'On Probation' },
                            { value: 'hired', label: 'Hired' }
                          ]}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormSelectField
                          name={`hiring_status-${index}`}
                          label="Hiring Status"
                          value={candidate.hiring_status}
                          onChange={(e) => handleCandidateChange(index, 'hiring_status', e.target.value)}
                          options={[
                            { value: 'applied', label: 'Applied' },
                            { value: 'screening', label: 'Screening' },
                            { value: 'interview', label: 'Interview' },
                            { value: 'selected', label: 'Selected' },
                            { value: 'rejected', label: 'Rejected' },
                            { value: 'hired', label: 'Hired' }
                          ]}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormSelectField
                          name={`mode-${index}`}
                          label="Mode"
                          value={candidate.mode}
                          onChange={(e) => handleCandidateChange(index, 'mode', e.target.value)}
                          options={[
                            { value: 'R', label: 'Regular' },
                            { value: 'C', label: 'Contract' },
                            { value: 'T', label: 'Temporary' },
                            { value: 'P', label: 'Part-time' }
                          ]}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleManualSubmit}
                    disabled={isSubmitting}
                    size="large"
                  >
                    {isSubmitting ? 'Processing...' : 'Submit All Candidates'}
                  </Button>
                </Box>
              </FormSection>
            </Box>
          )}

          {/* Results Tab */}
          {activeTab === 2 && importResults && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Import Results</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleClearResults}
                    sx={{ mr: 1 }}
                  >
                    Clear Results
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDone}
                  >
                    Done
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <AlertTitle>Successfully Imported: {importResults.success.length}</AlertTitle>
                  </Alert>
                  
                  {importResults.success.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Password</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importResults.success.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.username}</TableCell>
                              <TableCell>{item.email}</TableCell>
                              <TableCell>{item.password}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Failed to Import: {importResults.failed.length}</AlertTitle>
                  </Alert>
                  
                  {importResults.failed.length > 0 && (
                    <List>
                      {importResults.failed.map((item, index) => (
                        <ListItem key={index} divider>
                          <ListItemText
                            primary={`${item.data.firstName || ''} ${item.data.lastName || ''} (${item.data.email || 'No email'})`}
                            secondary={`Error: ${item.error}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default CandidateImport; 