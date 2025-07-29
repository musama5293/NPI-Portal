import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import FormLayout from '../components/common/FormLayout';
import PageHeader from '../components/common/PageHeader';
import { 
  FormTextField, 
  FormPasswordField, 
  FormSelectField, 
  FormDatePicker,
  FormSection
} from '../components/common/FormFields';
import { Grid, Box, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mobile_no: '',
    role_id: 2,
    org_id: 1000,
    inst_id: '',
    dept_id: '',
    user_status: 1,
    profile: {
      firstName: '',
      lastName: '',
      department: '',
      position: ''
    }
  });

  const [candidateData, setCandidateData] = useState({
    cand_name: '',
    cand_cnic_no: '',
    cand_gender: '',
    cand_nationality: 1,
    cand_mode: 'R',
    cat_id: '',
    candidate_type: 'initial',
    probation_end_date: '',
    cand_status: 1,
    cand_whatsapp_no: '',
    applied_job_id: '',
    current_job_id: '',
    hiring_status: 'applied',
    supervisor_id: ''
  });
  
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const isCandidate = formData.role_id === 4;
  
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/roles`);
        if (res.data.success) {
          setRoles(res.data.data.map(role => ({
            value: role.role_id,
            label: role.role_name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        toast.error('Failed to load roles.');
      }
    };
    
    const fetchOrganizations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/organizations`);
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

    const fetchJobsList = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/jobs`);
        if (res.data.success) {
          setJobs(res.data.data.map(job => ({
            value: job.job_id,
            label: job.job_name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        toast.error('Failed to load jobs list.');
      }
    };

    const fetchSupervisorsList = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`); 
        if (res.data.success) {
          setSupervisors(res.data.data.map(sup => ({
            value: sup._id,
            label: `${sup.profile?.firstName || ''} ${sup.profile?.lastName || ''}`.trim() || sup.username
          })));
        }
      } catch (error) {
        console.error('Failed to fetch supervisors:', error);
        toast.error('Failed to load supervisors list.');
      }
    };
    
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/test/categories`);
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
    
    const fetchUser = async () => {
      if (isEditMode) {
        try {
          const res = await axios.get(`${API_URL}/api/users/${id}`);
          if (res.data.success) {
            const user = res.data.data;
            setFormData({
              email: user.email || '',
              password: '',
              confirmPassword: '',
              mobile_no: user.mobile_no || '',
              role_id: user.role_id || 2,
              org_id: user.org_id || '',
              inst_id: user.inst_id || '',
              dept_id: user.dept_id || '',
              user_status: user.user_status !== undefined ? user.user_status : 1,
              profile: {
                firstName: user.profile?.firstName || '',
                lastName: user.profile?.lastName || '',
                department: user.profile?.department || '',
                position: user.profile?.position || ''
              }
            });

            if (user.role_id === 4 && user.candidate_info) {
              const candidate = user.candidate_info;
              setCandidateData({
                cand_name: candidate.cand_name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username,
                cand_cnic_no: candidate.cand_cnic_no || '',
                cand_gender: candidate.cand_gender || '',
                cand_nationality: candidate.cand_nationality || 1,
                cand_mode: candidate.cand_mode || 'R',
                candidate_type: candidate.candidate_type || 'initial',
                probation_end_date: candidate.probation_end_date ? new Date(candidate.probation_end_date) : null,
                cand_status: candidate.cand_status !== undefined ? candidate.cand_status : 1,
                cand_whatsapp_no: candidate.cand_whatsapp_no || '',
                applied_job_id: candidate.applied_job_id || '',
                current_job_id: candidate.current_job_id || '',
                hiring_status: candidate.hiring_status || 'applied',
                supervisor_id: candidate.supervisor_id || '',
                cat_id: candidate.cat_id || ''
              });
            } else if (user.role_id === 4) {
              setCandidateData(prev => ({
                ...prev,
                cand_name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username,
              }));
            }
            
            if (user.org_id) fetchInstitutes(user.org_id);
            if (user.inst_id) fetchDepartments(user.inst_id);
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          toast.error('Failed to load user data.');
          setError('Failed to load user data. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchRoles();
    fetchOrganizations();
    fetchJobsList();
    fetchSupervisorsList();
    fetchCategories();
    fetchUser();
  }, [id, isEditMode]);
  
  useEffect(() => {
    if (formData.org_id) {
      fetchInstitutes(formData.org_id);
    } else {
      setInstitutes([]);
      setFormData(prev => ({ ...prev, inst_id: '', dept_id: '' }));
    }
  }, [formData.org_id]);
  
  useEffect(() => {
    if (formData.inst_id) {
      fetchDepartments(formData.inst_id);
    } else {
      setDepartments([]);
      setFormData(prev => ({ ...prev, dept_id: '' }));
    }
  }, [formData.inst_id]);

  useEffect(() => {
    if (isCandidate) {
      const derivedCandName = (formData.profile.firstName || formData.profile.lastName)
        ? `${formData.profile.firstName} ${formData.profile.lastName}`.trim()
        : (formData.profile.firstName || formData.profile.lastName || 'New User');

      setCandidateData(prev => ({
        ...prev,
        cand_name: derivedCandName,
      }));
    }
  }, [isCandidate, formData.profile.firstName, formData.profile.lastName]);
  
  const fetchInstitutes = async (orgId) => {
    if (!orgId) return;
    try {
      const res = await axios.get(`${API_URL}/api/institutes?org_id=${orgId}`);
      if (res.data.success) {
        setInstitutes(res.data.data.map(inst => ({
          value: inst.inst_id,
          label: inst.inst_name
        })));
      }
    } catch (error) { 
      console.error('Failed to fetch institutes:', error); 
      toast.error('Failed to load institutes.'); 
    }
  };
  
  const fetchDepartments = async (instId) => {
    if(!instId) return;
    try {
      const res = await axios.get(`${API_URL}/api/departments?inst_id=${instId}`);
      if (res.data.success) {
        setDepartments(res.data.data.map(dept => ({
          value: dept.dept_id,
          label: dept.dept_name
        })));
      }
    } catch (error) { 
      console.error('Failed to fetch departments:', error); 
      toast.error('Failed to load departments.'); 
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('cand_') || ['applied_job_id', 'current_job_id', 'hiring_status', 'supervisor_id', 'candidate_type', 'probation_end_date', 'cat_id'].includes(name)) {
      setCandidateData(prev => ({ ...prev, [name]: value }));
      if (name === 'candidate_type' && value !== 'probation') {
        setCandidateData(prev => ({ ...prev, probation_end_date: null }));
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value }}));
    } else if (name === 'role_id') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else if (name === 'org_id') {
        setFormData(prev => ({ ...prev, [name]: value, inst_id: '', dept_id: ''}));
    } else if (name === 'inst_id') {
        setFormData(prev => ({ ...prev, [name]: value, dept_id: ''}));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.profile.firstName) {
      setError('First Name is required to generate username.');
      setSubmitting(false);
      return;
    }
    
    if (!isEditMode && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }
    
    // For non-candidate users, check password length
    const minPasswordLength = 6;
    if (!isEditMode && !isCandidate && formData.password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters`);
      setSubmitting(false);
      return;
    }
    
    if (isCandidate && !candidateData.cand_cnic_no) {
      setError('CNIC is required for candidate users');
      setSubmitting(false);
      return;
    }
    
    if (isCandidate && candidateData.candidate_type === 'probation' && !candidateData.probation_end_date) {
      setError('Probation End Date is required for candidates on probation.');
      setSubmitting(false);
      return;
    }
    
    try {
      const { confirmPassword, ...userData } = formData;

      let generatedUsername = userData.profile.firstName.toLowerCase();
      if (userData.profile.lastName) {
        generatedUsername += '.' + userData.profile.lastName.toLowerCase();
      }
      generatedUsername += Math.floor(Math.random() * 1000);

      const submissionData = { 
        ...userData,
        username: isEditMode ? formData.username : generatedUsername,
        org_id: Number(userData.org_id) || null,
        inst_id: Number(userData.inst_id) || null,
        dept_id: Number(userData.dept_id) || null,
      };
      
      if (isEditMode && !submissionData.password) delete submissionData.password;
      
      if (isCandidate) {
        submissionData.candidate_data = {
            ...candidateData,
            cand_name: (formData.profile.firstName || formData.profile.lastName) 
                ? `${formData.profile.firstName} ${formData.profile.lastName}`.trim() 
                : generatedUsername,
            cand_email: formData.email,
            cand_mobile_no: formData.mobile_no,
            org_id: submissionData.org_id,
            inst_id: submissionData.inst_id,
            dept_id: submissionData.dept_id,
        };
      }
      
      let res;
      if (isEditMode) {
        res = await axios.put(`${API_URL}/api/users/${id}`, submissionData);
      } else {
        res = await axios.post(`${API_URL}/api/users`, submissionData);
      }
      
      if (res.data.success) {
        setSuccess(`User ${isEditMode ? 'updated' : 'created'} successfully`);
        toast.success(`User ${isEditMode ? 'updated' : 'created'} successfully`);
        setTimeout(() => navigate('/users'), 1500);
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} user:`, error);
      const errorMsg = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user.`;
      if (error.response?.data?.errorDetails) {
        setError(`${errorMsg}: ${error.response.data.errorDetails.map(err => err.msg).join(', ')}`);
      } else {
        setError(errorMsg);
      }
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/users');
  };
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  // Options for select fields
  const statusOptions = [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ];
  
  const genderOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' }
  ];
  
  const nationalityOptions = [
    { value: 1, label: 'Pakistani' },
    { value: 2, label: 'Overseas Pakistani' },
    { value: 3, label: 'Foreign' }
  ];
  
  const modeOptions = [
    { value: 'R', label: 'Regular' },
    { value: 'C', label: 'Contract' },
    { value: 'T', label: 'Temporary' },
    { value: 'P', label: 'Part-time' }
  ];
  
  const candidateTypeOptions = [
    { value: 'initial', label: 'Initial Hiring' },
    { value: 'probation', label: 'On Probation' },
    { value: 'hired', label: 'Hired' }
  ];
  
  const hiringStatusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hired', label: 'Hired' }
  ];
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title={isEditMode ? 'Edit User' : 'Create User'}
          subtitle={isEditMode ? 'Update user information' : 'Add a new user to the system'}
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Users', path: '/users' },
            { label: isEditMode ? 'Edit User' : 'Create User' }
          ]}
          actionIcon={<AddIcon />}
        />
        
        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
          error={error}
          success={success}
          submitLabel={isEditMode ? 'Update User' : 'Create User'}
        >
          <FormSection title="User Information">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="profile.firstName"
                  label="First Name"
                  value={formData.profile.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="profile.lastName"
                  label="Last Name"
                  value={formData.profile.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  type="email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="mobile_no"
                  label="Mobile Number"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormPasswordField
                  name="password"
                  label={isEditMode ? "Password (leave blank to keep current)" : "Password"}
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEditMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormPasswordField
                  name="confirmPassword"
                  label={isEditMode ? "Confirm Password (if changing)" : "Confirm Password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isEditMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="role_id"
                  label="Role"
                  value={formData.role_id}
                  onChange={handleChange}
                  options={roles}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="user_status"
                  label="Status"
                  value={formData.user_status}
                  onChange={handleChange}
                  options={statusOptions}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="org_id"
                  label="Organization"
                  value={formData.org_id}
                  onChange={handleChange}
                  options={organizations}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="inst_id"
                  label="Institute"
                  value={formData.inst_id}
                  onChange={handleChange}
                  options={institutes}
                  disabled={!formData.org_id || institutes.length === 0}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormSelectField
                  name="dept_id"
                  label="Department"
                  value={formData.dept_id}
                  onChange={handleChange}
                  options={departments}
                  disabled={!formData.inst_id || departments.length === 0}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="profile.position"
                  label="Position"
                  value={formData.profile.position}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </FormSection>
            
            {isCandidate && (
            <FormSection title="Candidate Information" description="Additional information required for candidate users">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    name="cand_name"
                    label="Full Name (Candidate)"
                    value={candidateData.cand_name}
                    onChange={handleChange}
                    required
                    disabled
                    helperText="Derived from user's First/Last Name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    name="cand_cnic_no"
                    label="CNIC Number"
                    value={candidateData.cand_cnic_no}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 12345-1234567-1"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="cand_gender"
                    label="Gender"
                    value={candidateData.cand_gender}
                    onChange={handleChange}
                    options={genderOptions}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="cand_nationality"
                    label="Nationality"
                    value={candidateData.cand_nationality}
                    onChange={handleChange}
                    options={nationalityOptions}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="cand_mode"
                    label="Mode"
                    value={candidateData.cand_mode}
                    onChange={handleChange}
                    options={modeOptions}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="cat_id"
                    label="Category"
                    value={candidateData.cat_id}
                    onChange={handleChange}
                    options={categories}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="candidate_type"
                    label="Candidate Type"
                    value={candidateData.candidate_type}
                    onChange={handleChange}
                    options={candidateTypeOptions}
                  />
                </Grid>
                  {candidateData.candidate_type === 'probation' && (
                  <Grid item xs={12} sm={6}>
                    <FormDatePicker
                      name="probation_end_date"
                      label="Probation End Date"
                      value={candidateData.probation_end_date}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    name="cand_whatsapp_no"
                    label="WhatsApp Number"
                    value={candidateData.cand_whatsapp_no}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="applied_job_id"
                    label="Applied Job"
                    value={candidateData.applied_job_id}
                    onChange={handleChange}
                    options={jobs}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="current_job_id"
                    label="Current Job"
                    value={candidateData.current_job_id}
                    onChange={handleChange}
                    options={jobs}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="hiring_status"
                    label="Hiring Status"
                    value={candidateData.hiring_status}
                    onChange={handleChange}
                    options={hiringStatusOptions}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelectField
                    name="supervisor_id"
                    label="Supervisor"
                    value={candidateData.supervisor_id}
                    onChange={handleChange}
                    options={supervisors}
                  />
                </Grid>
              </Grid>
            </FormSection>
          )}
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default UserForm; 