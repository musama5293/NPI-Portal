import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import ThemeToggle from '../common/ThemeToggle';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { username, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    const newErrors = {};
    
    if (username.length < 4 || username.length > 50) {
      newErrors.username = 'Username must be between 4 and 50 characters';
    }

    if (password.length < 4 || password.length > 12) {
      newErrors.password = 'Password must be between 4 and 12 characters';
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

    try {
      // Use AuthContext login method
      const response = await login({
        username,
        password,
      });

      // Handle response - OTP required
      if (response.success && response.data.requires_otp) {
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('login_response', JSON.stringify({
          email: response.data.email
        }));
        toast.success('OTP sent to your email');
        navigate('/verify-otp');
      } 
      // Handle response - Password reset required
      else if (response.success && response.data.requires_password_reset) {
        localStorage.setItem('user_id', response.data.user_id);
        toast.warning('Password reset required');
        navigate('/reset-password');
      }
    } catch (error) {
      console.error('Login Error:', error);
      const errorMessage = error.message || 'Login failed';
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
      <Container maxWidth="xs">
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
              bgcolor: 'secondary.main',
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
            NUST Personality Index
          </Typography>
          <Typography
            variant="h6"
            component="h2"
            fontWeight={500}
            color="text.secondary"
            gutterBottom
            sx={{ mb: 3 }}
            align="center"
          >
            Admin Portal
          </Typography>
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%' }}
          >
            <TextField
              fullWidth
              variant="outlined"
              label="Username"
                name="username"
              autoComplete="username"
                value={username}
              onChange={handleChange}
              margin="normal"
              error={!!errors.username}
              helperText={errors.username}
                required
              inputProps={{ minLength: 4, maxLength: 50 }}
              autoFocus
            />
            
            <TextField
              fullWidth
              variant="outlined"
              label="Password"
                name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
                value={password}
              onChange={handleChange}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
                required
              inputProps={{ minLength: 4, maxLength: 12 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
                {loading ? 'Signing In...' : 'SIGN IN'}
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Need help? Contact your administrator or visit <Button color="secondary" size="small" onClick={() => navigate('/help')}>help page</Button>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 