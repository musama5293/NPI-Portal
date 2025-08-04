import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';
import { API_URL } from '../config/config';

// Create context
const AuthContext = createContext();

// Create provider
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Logout user - wrapped in useCallback to prevent dependency warnings
  const logout = useCallback(() => {
    // Cleanup socket and notification services
    try {
      socketService.disconnect();
      notificationService.cleanup();
    } catch (error) {
      console.error('Error cleaning up services:', error);
    }
    
    // Clear state
    setToken(null);
    setUser(null);
    setUserRole(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userRole');
    
    // Redirect to login
    navigate('/login');
    
    // Display success message
    toast.success('Logged out successfully');
  }, [navigate]);

  // Set axios default headers with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for stored user on initial load
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Set axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          if (localStorage.getItem('user')) {
          const storedUser = localStorage.getItem('user');
            setUser(JSON.parse(storedUser));
            
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
              setUserRole(JSON.parse(storedRole));
            } else {
              // If we have user but no role, fetch the role
              const roleRes = await axios.get(`${API_URL}/api/auth/role-data`);
              if (roleRes.data.success) {
                setUserRole(roleRes.data.data);
                localStorage.setItem('userRole', JSON.stringify(roleRes.data.data));
              }
            }
          } else {
            // If token exists but no user data, fetch from API
            const res = await axios.get(`${API_URL}/api/auth/me`);
            if (res.data.success) {
              // Create formatted user object
              const userData = {
                id: res.data.data._id,
                username: res.data.data.username,
                email: res.data.data.email,
                role_id: res.data.data.role_id,
                org_id: res.data.data.org_id
              };
              
              // If user is a candidate (role_id 4), add candidate_id
              if (res.data.data.role_id === 4 && res.data.data.candidate_id) {
                userData.candidate_id = res.data.data.candidate_id._id || res.data.data.candidate_id;
              }
              
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              
              // Fetch user's role data
              const roleRes = await axios.get(`${API_URL}/api/auth/role-data`);
              if (roleRes.data.success) {
                setUserRole(roleRes.data.data);
                localStorage.setItem('userRole', JSON.stringify(roleRes.data.data));
              }
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear localStorage if token is invalid
          logout();
        }
      }
      setLoading(false);
      setInitialized(true);
    };

    initAuth();
  }, [token, logout]);

  // Initialize socket and notification services when user is authenticated
  useEffect(() => {
    if (user && token && !loading) {
      const initializeServices = async () => {
        try {
          // Map role_id to role name for socket
          const getRoleName = (role_id) => {
            switch(role_id) {
              case 1: return 'admin';
              case 3: return 'supervisor';
              case 4: return 'candidate';
              default: return 'user';
            }
          };

          const userName = user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.username;

          const userData = {
            userId: user.id,
            userRole: getRoleName(user.role_id),
            userName: userName
          };

          console.log('🚀 Initializing socket and notification services for user:', userData);
          
          // Connect socket service
          socketService.connect(userData);
          
          // Initialize notification service
          notificationService.initialize(user);
          
        } catch (error) {
          console.error('Failed to initialize services:', error);
        }
      };

      initializeServices();
    }

    // Cleanup when user changes or logs out
    return () => {
      if (!user) {
        try {
          socketService.disconnect();
          notificationService.cleanup();
        } catch (error) {
          console.error('Error cleaning up services:', error);
        }
      }
    };
  }, [user, token, loading]);
  
  // Function to refresh user role data when role is updated
  const refreshRoleData = async () => {
    if (user) {
      try {
        const roleRes = await axios.get(`${API_URL}/api/auth/role-data`);
        if (roleRes.data.success) {
          setUserRole(roleRes.data.data);
          localStorage.setItem('userRole', JSON.stringify(roleRes.data.data));
          return roleRes.data.data;
        }
      } catch (error) {
        console.error('Failed to refresh role data:', error);
      }
    }
    return null;
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Server error' };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      return {
        success: res.data.success,
        message: res.data.message,
        data: res.data.data
      };
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || 'Server error',
        error: error.response?.data?.error
      };
    }
  };

  // Verify OTP
  const verifyOtp = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, formData);
      
      if (res.data.success) {
        // Set token and user in state and localStorage
        setToken(res.data.data.token);
        // Create user object with basic data
        const userData = {
          id: res.data.data.user_id,
          username: res.data.data.username,
          email: res.data.data.email,
          role_id: res.data.data.role_id,
          org_id: res.data.data.org_id
        };
        
        // If user is a candidate (role_id 4), add candidate_id
        if (res.data.data.role_id === 4 && res.data.data.candidate_id) {
          userData.candidate_id = res.data.data.candidate_id;
        }
        
        setUser(userData);
        
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set up axios headers before fetching role data
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
        
        // Fetch user's role data
        const roleRes = await axios.get(`${API_URL}/api/auth/role-data`);
        if (roleRes.data.success) {
          setUserRole(roleRes.data.data);
          localStorage.setItem('userRole', JSON.stringify(roleRes.data.data));
        }
        
        // Remove temporary user_id
        localStorage.removeItem('user_id');
        localStorage.removeItem('login_response');
      }
      
      return {
        success: res.data.success,
        message: res.data.message,
        data: res.data.data
      };
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || 'Server error',
        error: error.response?.data?.error
      };
    }
  };

  // Reset password
  const resetPassword = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/reset-password`, formData);
      return {
        success: res.data.success,
        message: res.data.message,
        data: res.data.data
      };
    } catch (error) {
      throw {
        success: false,
        message: error.response?.data?.message || 'Server error',
        error: error.response?.data?.error
      };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Check if user has a specific role
  const hasRole = (roleId) => {
    if (!user) return false;
    
    // If roleId is an array, check if user's role is in the array
    if (Array.isArray(roleId)) {
      return roleId.includes(user.role_id);
    }
    
    // Otherwise, check for exact role match
    return user.role_id === roleId;
  };
  
  // Check if user has a specific page permission
  const hasPagePermission = (permission) => {
    // Admin (role_id 1) always has access to all pages
    if (user && user.role_id === 1) {
      console.log(`Admin user automatically granted permission: ${permission}`);
      return true;
    }
    
    // If we don't have userRole data, return false
    if (!userRole) {
      console.log(`No userRole data available, denying permission: ${permission}`);
      return false;
    }
    
    const hasPermission = userRole[permission] === true;
    console.log(`Permission check for ${permission}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);
    console.log(`Available permissions for ${user?.username}:`, 
      Object.keys(userRole).filter(key => userRole[key] === true));
    
    // Check if the user has the specific page permission
    return hasPermission;
  };

  // Add a function to refresh user permissions
  const refreshUserPermissions = async () => {
    if (user && token) {
      try {
        const res = await axios.get(`${API_URL}/api/auth/role-data`);
        if (res.data.success) {
          setUserRole(res.data.data);
          localStorage.setItem('userRole', JSON.stringify(res.data.data));
          return res.data.data;
        }
      } catch (error) {
        console.error('Failed to refresh user permissions:', error);
        return null;
      }
    }
    return null;
  };

  // Set up effect to watch for storage changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        setToken(event.newValue);
      }
      if (event.key === 'user') {
        setUser(event.newValue ? JSON.parse(event.newValue) : null);
      }
      if (event.key === 'userRole' || event.key === 'role_update_timestamp') {
        refreshUserPermissions();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Add a refresh interval to periodically check for permission changes
  useEffect(() => {
    // Only check when user is logged in
    if (!user || !token) return;
    
    console.log('Setting up permission refresh interval');
    
    // Check every 10 seconds for permission changes
    const intervalId = setInterval(async () => {
      await refreshUserPermissions();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [user, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initialized,
        userRole,
        register,
        login,
        verifyOtp,
        resetPassword,
        logout,
        isAuthenticated,
        hasRole,
        hasPagePermission,
        refreshRoleData,
        refreshUserPermissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create hook for using context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 