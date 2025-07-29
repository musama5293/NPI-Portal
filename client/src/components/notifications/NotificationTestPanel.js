import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  NotificationsActive as NotificationIcon,
  Science as TestIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NotificationTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const createTestNotifications = async () => {
    setLoading(true);
    setLastResult(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/notifications/test`);
      
      if (response.data.success) {
        setLastResult({
          success: true,
          message: response.data.message,
          count: response.data.data.length
        });
        
        toast.success('Test notifications created successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create test notifications';
      
      setLastResult({
        success: false,
        message: errorMessage
      });
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Notification System Test</Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test the live notification system by creating sample notifications.
      </Typography>

      <Button
        variant="contained"
        onClick={createTestNotifications}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
        sx={{ mb: 2 }}
      >
        {loading ? 'Creating...' : 'Create Test Notifications'}
      </Button>

      {lastResult && (
        <Alert severity={lastResult.success ? 'success' : 'error'}>
          {lastResult.message}
        </Alert>
      )}
    </Paper>
  );
};

export default NotificationTestPanel; 