import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  CircularProgress,
  Avatar,
  useTheme,
  TextField,
  Stack,
  Divider,
  Link
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  KeyOutlined as KeyIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import ThemeToggle from '../common/ThemeToggle';

const OTPVerification = () => {
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs[0].current) {
      setTimeout(() => {
      inputRefs[0].current.focus();
      }, 300);
    }

    // Check if user_id exists in localStorage
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Session expired, please login again');
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;
    
    // Update OTP array
    const newOtp = [...otp];
    
    // If pasting multiple numbers at once
    if (value.length > 1) {
      // Distribute the pasted digits across the OTP fields
      const digits = value.split('').slice(0, 6 - index);
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      
      // Focus on the field after the last filled one or the last field
      const focusIndex = Math.min(index + digits.length, 5);
      setOtp(newOtp);
      
      setTimeout(() => {
        if (inputRefs[focusIndex].current) {
          inputRefs[focusIndex].current.focus();
        }
      }, 0);
    } else {
      // Normal single digit input
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto move to next input field only if the current field is filled
      if (value && index < 5) {
        setTimeout(() => {
          if (inputRefs[index + 1].current) {
            inputRefs[index + 1].current.focus();
          }
        }, 0);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!/^\d+$/.test(pasteData)) return;
    
    const digits = pasteData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, i) => {
      if (i < 6) {
        newOtp[i] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus on the last input or the one after the last digit
    const focusIndex = Math.min(digits.length, 5);
    if (inputRefs[focusIndex].current) {
      inputRefs[focusIndex].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const otpValue = otp.join('');
    const userId = localStorage.getItem('user_id');
    
    // Validate OTP
    if (otpValue.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP');
      setLoading(false);
      return;
    }
    
    try {
      // Use the AuthContext's verifyOtp method
      const response = await verifyOtp({
        user_id: userId,
        otp: otpValue
      });
      
      if (response.success) {
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      const errorMessage = error.message || 'OTP verification failed';
      toast.error(errorMessage);
      
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
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
              bgcolor: 'secondary.main',
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <KeyIcon fontSize="large" />
          </Avatar>
          
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            sx={{ mb: 1 }}
            align="center"
          >
            Verify OTP
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 4 }}
            align="center"
          >
            Please enter the one-time password sent to your email
          </Typography>
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%' }}
          >
            <Stack 
              direction="row" 
              spacing={1} 
              justifyContent="center"
              mb={4}
              sx={{
                '& .MuiTextField-root': {
                  width: '3rem',
                  input: {
                    fontSize: '1.5rem',
                    padding: '0.75rem 0',
                    textAlign: 'center'
                  }
                }
              }}
            >
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  variant="outlined"
                  inputRef={inputRefs[index]}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  inputProps={{
                    maxLength: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'transform 0.2s',
                      ...(digit && {
                        borderColor: 'primary.main',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      }),
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }
                  }}
                />
              ))}
            </Stack>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VerifiedUserIcon />}
              sx={{ 
                mt: 2, 
                mb: 3, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
                {loading ? 'Verifying...' : 'Verify OTP'}
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

export default OTPVerification; 