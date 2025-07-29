import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  CircularProgress,
  Avatar,
  InputAdornment,
  IconButton,
  useTheme,
  Link,
  Divider
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  Visibility,
  VisibilityOff,
  Save as SaveIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import ThemeToggle from '../common/ThemeToggle';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user_id exists in localStorage
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Session expired, please login again');
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const validate = () => {
    const newErrors = {};
    const { password, confirmPassword } = formData;

    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    const userId = localStorage.getItem('user_id');

    try {
      // Use the AuthContext's resetPassword method
      const response = await resetPassword({
        user_id: userId,
        new_password: formData.password
      });

      if (response.success) {
        // Clear user_id from localStorage
        localStorage.removeItem('user_id');
        
        toast.success('Password reset successful. Please login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Password Reset Error:', error);
      const errorMessage = error.message || 'Password reset failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDarkMode ? 'background.dark' : 'primary.main',
        backgroundImage: isDarkMode 
          ? 'none' 
          : 'linear-gradient(to bottom right, primary.main, primary.dark)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <ThemeToggle />
        </Box>
        
        <Paper
          elevation={12}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Avatar
            sx={{
              mb: 2,
              bgcolor: 'warning.main',
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <LockIcon fontSize="large" />
          </Avatar>
          
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            sx={{ mb: 1 }}
            align="center"
          >
            Reset Password
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 3 }}
            align="center"
          >
            Please set a new password for your account
          </Typography>
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%' }}
          >
            <TextField
              fullWidth
              variant="outlined"
              label="New Password"
                name="password"
              type={showPassword.password ? 'text' : 'password'}
              autoComplete="new-password"
                value={formData.password}
              onChange={handleChange}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
                required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => togglePasswordVisibility('password')}
                      edge="end"
                    >
                      {showPassword.password ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              variant="outlined"
              label="Confirm Password"
                name="confirmPassword"
              type={showPassword.confirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
                value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
                required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      edge="end"
                    >
                      {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                color="secondary"
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 500 }}
              >
                Return to Login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword; 