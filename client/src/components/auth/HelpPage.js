import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  HelpOutline,
  Email,
  Phone,
  ArrowBack,
  ErrorOutline,
  CheckCircleOutline,
  LockOpen
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';
import ThemeToggle from '../common/ThemeToggle';

const HelpPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();

  const helpItems = [
    {
      title: 'Forgot Password',
      description: 'If you forgot your password, contact your administrator to reset it.',
      icon: <LockOpen color="primary" />
    },
    {
      title: 'Account Locked',
      description: 'After multiple failed login attempts, your account may be locked. Wait 30 minutes or contact support.',
      icon: <ErrorOutline color="error" />
    },
    {
      title: 'OTP Issues',
      description: 'If you did not receive the OTP or it expired, you can request a new one by attempting to login again.',
      icon: <CheckCircleOutline color="success" />
    }
  ];

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
              bgcolor: 'info.main',
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <HelpOutline fontSize="large" />
          </Avatar>
          
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            sx={{ mb: 1 }}
            align="center"
          >
            Help & Support
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 3 }}
            align="center"
          >
            Need assistance with the NUST Personality Index Admin Portal?
          </Typography>
          
          <Divider sx={{ width: '100%', mb: 3 }} />
          
          <List sx={{ width: '100%' }}>
            {helpItems.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="h6" color="text.primary">
                        {item.title}
                      </Typography>
                    }
                    secondary={item.description}
                  />
                </ListItem>
                {index < helpItems.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
          
          <Divider sx={{ width: '100%', my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Contact Support
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Email color="primary" sx={{ mr: 2 }} />
              <Typography variant="body1">
                support@nust.edu.pk
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Phone color="primary" sx={{ mr: 2 }} />
              <Typography variant="body1">
                +92-51-1234567
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/login')}
            sx={{ 
              py: 1,
              px: 3,
              fontWeight: 600
            }}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default HelpPage; 