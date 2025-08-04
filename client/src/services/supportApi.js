import axios from 'axios';

import { API_URL } from '../config/config';

// Create axios instance with default configuration
const supportApi = axios.create({
  baseURL: `${API_URL}/api/support`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
supportApi.interceptors.request.use(
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

// Add response interceptor for error handling
supportApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class SupportApiService {
  // Create a new support ticket
  async createTicket(ticketData) {
    try {
      const response = await supportApi.post('/tickets', ticketData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get current user's tickets
  async getUserTickets(params = {}) {
    try {
      const response = await supportApi.get('/tickets/my', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all tickets (admin only)
  async getAllTickets(params = {}) {
    try {
      const response = await supportApi.get('/tickets', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get specific ticket by ID
  async getTicketById(ticketId) {
    try {
      const response = await supportApi.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update ticket (admin only)
  async updateTicket(ticketId, updateData) {
    try {
      const response = await supportApi.put(`/tickets/${ticketId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add message to ticket
  async addMessage(ticketId, messageData) {
    try {
      const response = await supportApi.post(`/tickets/${ticketId}/messages`, messageData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mark messages as read
  async markMessagesRead(ticketId, messageIds) {
    try {
      const response = await supportApi.post(`/tickets/${ticketId}/messages/read`, {
        messageIds
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get support analytics (admin only)
  async getAnalytics(timeframe = '30d') {
    try {
      const response = await supportApi.get('/analytics', {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search tickets
  async searchTickets(searchParams) {
    try {
      const response = await supportApi.get('/tickets', { params: searchParams });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get ticket statistics for dashboard
  async getTicketStats() {
    try {
      const response = await supportApi.get('/analytics', {
        params: { timeframe: '7d' }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload file attachment (if needed)
  async uploadAttachment(file, ticketId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);

      const response = await supportApi.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get ticket categories and priorities for form options
  getTicketOptions() {
    return {
      categories: [
        { value: 'technical', label: 'Technical Support' },
        { value: 'account', label: 'Account Issues' },
        { value: 'test_related', label: 'Test Related' },
        { value: 'general', label: 'General Inquiry' },
        { value: 'billing', label: 'Billing & Payment' }
      ],
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ],
      statuses: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'waiting_response', label: 'Waiting for Response' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' }
      ]
    };
  }

  // Get status color for UI
  getStatusColor(status) {
    const colorMap = {
      'open': '#f59e0b',
      'in_progress': '#3b82f6',
      'waiting_response': '#8b5cf6',
      'resolved': '#10b981',
      'closed': '#6b7280'
    };
    return colorMap[status] || '#6b7280';
  }

  // Get priority color for UI
  getPriorityColor(priority) {
    const colorMap = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'urgent': '#dc2626'
    };
    return colorMap[priority] || '#6b7280';
  }

  // Format relative time
  formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Format ticket ID for display
  formatTicketId(ticketId) {
    if (typeof ticketId === 'string' && ticketId.startsWith('TICK-')) {
      return ticketId;
    }
    return `TICK-${ticketId}`;
  }

  // Validate ticket data before submission
  validateTicketData(ticketData) {
    const errors = {};

    if (!ticketData.subject || ticketData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters long';
    }

    if (!ticketData.description || ticketData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    if (!ticketData.category) {
      errors.category = 'Please select a category';
    }

    if (!ticketData.priority) {
      errors.priority = 'Please select a priority level';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }

  // Get connection status for real-time features
  isApiAvailable() {
    return supportApi.defaults.baseURL !== undefined;
  }

  // Test API connection
  async testConnection() {
    try {
      await supportApi.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const supportApiService = new SupportApiService();

export default supportApiService; 