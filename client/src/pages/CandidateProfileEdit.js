import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import FormLayout from '../components/common/FormLayout';
import PageHeader from '../components/common/PageHeader';
import { 
  FormTextField, 
  FormPasswordField, 
  FormSelectField, 
  FormSection
} from '../components/common/FormFields';
import { Grid, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

import { API_URL } from '../config/config';

const CandidateProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mobile_no: '',
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
    cand_whatsapp_no: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Gender options
  const genderOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' }
  ];

  // Nationality options
  const nationalityOptions = [
    { value: 1, label: 'Pakistani' },
    { value: 2, label: 'Overseas Pakistani' },
    { value: 3, label: 'Foreign' }
  ];

  useEffect(() => {
    // Check if user is a candidate
    if (!user || user.role_id !== 4) {
      toast.error('Access denied. This page is only for candidates.');
      navigate('/');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/users/profile`);
        if (res.data.success) {
          const userData = res.data.data;
          setFormData({
            email: userData.email || '',
            password: '',
            confirmPassword: '',
            mobile_no: userData.mobile_no || '',
            profile: {
              firstName: userData.profile?.firstName || '',
              lastName: userData.profile?.lastName || '',
              department: userData.profile?.department || '',
              position: userData.profile?.position || ''
            }
          });

          // If candidate info exists, populate it
          if (userData.candidate_info) {
            const candidate = userData.candidate_info;
            setCandidateData({
              cand_name: candidate.cand_name || '',
              cand_cnic_no: candidate.cand_cnic_no || '',
              cand_gender: candidate.cand_gender || '',
              cand_nationality: candidate.cand_nationality || 1,
              cand_whatsapp_no: candidate.cand_whatsapp_no || ''
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error('Failed to load profile data.');
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('cand_')) {
      setCandidateData(prev => ({ ...prev, [name]: value }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value }}));
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
      setError('First Name is required.');
      setSubmitting(false);
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setSubmitting(false);
      return;
    }

    if (!candidateData.cand_cnic_no) {
      setError('CNIC is required.');
      setSubmitting(false);
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;

      const submissionData = { 
        ...userData,
        // Handle password change
        ...(userData.password ? { newPassword: userData.password } : {}),
        // Remove password field if empty (don't update password)
        ...(userData.password ? {} : { password: undefined })
      };
      
      // Remove password field if it's empty
      if (!submissionData.password) {
        delete submissionData.password;
      }

      // Add candidate data
      submissionData.candidate_data = {
        ...candidateData,
        cand_name: `${formData.profile.firstName} ${formData.profile.lastName}`.trim(),
        cand_email: formData.email,
        cand_mobile_no: formData.mobile_no
      };

      const res = await axios.put(`${API_URL}/api/users/profile`, submissionData);
      
      if (res.data.success) {
        setSuccess('Profile updated successfully');
        toast.success('Profile updated successfully');
        // Don't navigate away, just show success message
      }
    } catch (error) {
      console.error('Update failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Edit My Profile"
          subtitle="Update your personal information"
          breadcrumbs={[
            { label: 'My Profile', path: '/profile' },
            { label: 'Edit Profile' }
          ]}
          actionIcon={<EditIcon />}
        />

        <FormLayout
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitText="Update Profile"
          loading={submitting}
          error={error}
          success={success}
        >
          {/* Basic Information Section */}
          <FormSection title="Basic Information" description="Update your basic contact information">
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
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                <FormTextField
                  name="cand_whatsapp_no"
                  label="WhatsApp Number"
                  value={candidateData.cand_whatsapp_no}
                  onChange={handleChange}
                  helperText="Optional: WhatsApp number for notifications"
                />
              </Grid>
            </Grid>
          </FormSection>

          {/* Personal Information Section */}
          <FormSection title="Personal Information" description="Update your personal details">
            <Grid container spacing={2}>
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
            </Grid>
          </FormSection>

          {/* Professional Information Section */}
          <FormSection title="Professional Information" description="Update your professional details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  name="profile.department"
                  label="Department"
                  value={formData.profile.department}
                  onChange={handleChange}
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

          {/* Password Change Section */}
          <FormSection title="Change Password" description="Leave blank to keep current password">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormPasswordField
                  name="password"
                  label="New Password"
                  value={formData.password}
                  onChange={handleChange}
                  helperText="Leave blank to keep current password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormPasswordField
                  name="confirmPassword"
                  label="Confirm New Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </FormSection>

          {/* Information Alert */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Some information like your role, organization, and employment status 
              can only be changed by administrators. If you need to update these details, please contact 
              your supervisor or HR department.
            </Typography>
          </Alert>
        </FormLayout>
      </Box>
    </MainLayout>
  );
};

export default CandidateProfileEdit; 