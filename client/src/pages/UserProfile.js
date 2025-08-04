import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
  Avatar,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  InputAdornment,
  Collapse,
  alpha,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Domain as DomainIcon,
  School as SchoolIcon,
  Apartment as ApartmentIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import { API_URL } from '../config/config';

const UserProfile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordShowType, setPasswordShowType] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/users/profile`);
        if (res.data.success) {
          setProfile(res.data.data);
          setFormData({
            username: res.data.data.username || '',
            email: res.data.data.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords if changing password
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (!formData.currentPassword) {
        toast.error('Please enter your current password');
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const updateData = {
        username: formData.username,
        email: formData.email
      };
      
      // Only include password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const res = await axios.put(`${API_URL}/api/users/profile`, updateData);
      
      if (res.data.success) {
        toast.success('Profile updated successfully');
        // Update auth context
        updateUser({
          ...user,
          username: formData.username,
          email: formData.email
        });
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };
  
  const togglePasswordVisibility = (field) => {
    setPasswordShowType(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 2 }}>
          <PageHeader 
            title="My Profile" 
            subtitle="View and update your profile information"
            breadcrumbs={[{ label: 'My Profile' }]}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader 
          title="My Profile" 
          subtitle="View and update your profile information"
          breadcrumbs={[{ label: 'My Profile' }]}
          {...(user?.role_id === 4 && {
            actionIcon: <EditIcon />,
            actionLabel: "Edit Profile",
            onActionClick: () => navigate('/my-profile/edit')
          })}
        />
        
        <Grid container spacing={3}>
          {/* Profile Information Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
            display: 'flex',
              flexDirection: 'column', 
            alignItems: 'center',
                  mb: 3 
            }}>
                  <Avatar 
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2.5rem',
                      mb: 2
                    }}
                  >
                {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Typography variant="h5" fontWeight={600}>
                {profile?.username || 'User'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {profile?.email || ''}
                  </Typography>
                  <Chip 
                    label={profile?.role?.role_name || 
                          (profile?.role_id === 1 ? 'Admin' : 
                           profile?.role_id === 2 ? 'Staff' : 
                           profile?.role_id === 3 ? 'Faculty' : 
                           profile?.role_id === 4 ? 'Candidate' : 'Role not assigned')}
                    sx={{ mt: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Divider sx={{ mb: 3 }} />
            
            {/* Organization Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                Organization Details
                  </Typography>
              
                  <Paper sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DomainIcon color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Organization</Typography>
                        <Typography variant="body2">
                    {profile?.organization?.org_name || (profile?.org_id ? `Organization ID: ${profile.org_id}` : 'Not assigned')}
                        </Typography>
                      </Box>
                    </Box>
                
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SchoolIcon color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Institute</Typography>
                        <Typography variant="body2">
                    {profile?.institute?.inst_name || (profile?.inst_id ? `Institute ID: ${profile.inst_id}` : 'Not assigned')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ApartmentIcon color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Department</Typography>
                        <Typography variant="body2">
                    {profile?.department?.dept_name || (profile?.dept_id ? `Department ID: ${profile.dept_id}` : 'Not assigned')}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
                
                {/* Account Information */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                Account Information
                  </Typography>
              
                  <Paper sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BadgeIcon color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            size="small"
                            label={profile?.user_status === 1 ? "Active" : "Inactive"}
                            color={profile?.user_status === 1 ? "success" : "error"}
                            variant={profile?.user_status === 1 ? "filled" : "outlined"}
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Last Login</Typography>
                        <Typography variant="body2">
                    {profile?.login_datetime ? new Date(profile.login_datetime).toLocaleString() : 'Never'}
                        </Typography>
                      </Box>
                    </Box>
                
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon color="primary" sx={{ mr: 1.5, opacity: 0.7 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Member Since</Typography>
                        <Typography variant="body2">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Edit Profile Form */}
          <Grid item xs={12} md={8}>
            {user?.role_id === 4 ? (
              // Candidate-specific view with call-to-action
              <Card sx={{ boxShadow: theme.shadows[2] }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Profile Information
                  </Typography>
                  
                  {/* Profile Summary for Candidates */}
                  <Paper 
                    sx={{ 
                      p: 3, 
                      mb: 3,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    <EditIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Keep Your Profile Updated
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      It's important to keep your personal information current. You can update your contact details, 
                      personal information, and password using our dedicated profile editor.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<EditIcon />}
                      onClick={() => navigate('/my-profile/edit')}
                      sx={{ mt: 2 }}
                    >
                      Edit My Profile
                    </Button>
                  </Paper>
                  
                  {/* Current Profile Information Display */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {profile?.profile?.firstName && profile?.profile?.lastName 
                            ? `${profile.profile.firstName} ${profile.profile.lastName}`
                            : profile?.username || 'Not set'
                          }
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {profile?.email || 'Not set'}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Mobile Number
                        </Typography>
                        <Typography variant="body1">
                          {profile?.mobile_no || 'Not set'}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          CNIC
                        </Typography>
                        <Typography variant="body1">
                          {profile?.candidate_info?.cand_cnic_no || 'Not set'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              // Regular edit form for non-candidates
              <Card sx={{ boxShadow: theme.shadows[2] }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Edit Profile
                  </Typography>
            
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                    required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="primary" />
                            </InputAdornment>
                          ),
                    }}
                  />
                    </Grid>
                
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                    required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="primary" />
                            </InputAdornment>
                          ),
                    }}
                  />
                    </Grid>
                
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} display="flex" alignItems="center">
                          <SecurityIcon color="primary" sx={{ mr: 1 }} />
                          Change Password
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={passwordVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                          {passwordVisible ? 'Hide' : 'Show'}
                        </Button>
                      </Box>
                      
                      <Collapse in={passwordVisible}>
                        <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Current Password"
                                type={passwordShowType.current ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => togglePasswordVisibility('current')}
                                        edge="end"
                                      >
                                        {passwordShowType.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="New Password"
                                type={passwordShowType.new ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => togglePasswordVisibility('new')}
                                        edge="end"
                                      >
                                        {passwordShowType.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Confirm New Password"
                                type={passwordShowType.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        edge="end"
                                      >
                                        {passwordShowType.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                    }}
                  />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Collapse>
                    </Grid>
              
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Button
                  type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                  disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default UserProfile; 