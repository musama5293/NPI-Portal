import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create axios instance with default config
const dashboardApi = axios.create({
  baseURL: `${API_URL}/api/dashboard`,
  timeout: 10000,
});

// Add token to requests
dashboardApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class DashboardApiService {
  // Get dashboard statistics based on user role
  async getDashboardStats() {
    try {
      const response = await dashboardApi.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw this.handleError(error);
    }
  }

  // Get recruitment pipeline analytics
  async getRecruitmentPipeline(timeframe = '30d') {
    try {
      const response = await dashboardApi.get('/recruitment', {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recruitment pipeline:', error);
      throw this.handleError(error);
    }
  }

  // Get recent activities
  async getRecentActivities(limit = 10) {
    try {
      const response = await dashboardApi.get('/activities', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw this.handleError(error);
    }
  }

  // Get system alerts
  async getSystemAlerts() {
    try {
      const response = await dashboardApi.get('/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        message: error.response.data?.message || 'Server error',
        status: error.response.status
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        message: 'Network error - please check your connection',
        status: 0
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
        status: 0
      };
    }
  }
}

// Export singleton instance
export default new DashboardApiService(); 