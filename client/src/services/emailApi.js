import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create axios instance for email templates
const emailTemplateApi = axios.create({
  baseURL: `${API_URL}/api/email-templates`,
  timeout: 10000,
});

// Create axios instance for email management
const emailManagementApi = axios.create({
  baseURL: `${API_URL}/api/email-management`,
  timeout: 10000,
});

// Add token to requests for both instances
[emailTemplateApi, emailManagementApi].forEach(api => {
  api.interceptors.request.use(
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
});

class EmailApiService {
  // Email Template Management
  
  // Get all email templates
  async getEmailTemplates(params = {}) {
    try {
      const response = await emailTemplateApi.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw this.handleError(error);
    }
  }

  // Get email template by ID
  async getEmailTemplate(id) {
    try {
      const response = await emailTemplateApi.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching email template:', error);
      throw this.handleError(error);
    }
  }

  // Create new email template
  async createEmailTemplate(templateData) {
    try {
      const response = await emailTemplateApi.post('/', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw this.handleError(error);
    }
  }

  // Update email template
  async updateEmailTemplate(id, templateData) {
    try {
      const response = await emailTemplateApi.put(`/${id}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw this.handleError(error);
    }
  }

  // Delete email template
  async deleteEmailTemplate(id) {
    try {
      const response = await emailTemplateApi.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw this.handleError(error);
    }
  }

  // Get template types
  async getTemplateTypes() {
    try {
      const response = await emailTemplateApi.get('/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching template types:', error);
      throw this.handleError(error);
    }
  }

  // Preview email template
  async previewEmailTemplate(id, variables = {}) {
    try {
      const response = await emailTemplateApi.post(`/${id}/preview`, { variables });
      return response.data;
    } catch (error) {
      console.error('Error previewing email template:', error);
      throw this.handleError(error);
    }
  }

  // Send test email
  async sendTestEmail(id, testEmail, variables = {}) {
    try {
      const response = await emailTemplateApi.post(`/${id}/test-send`, {
        test_email: testEmail,
        variables
      });
      return response.data;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw this.handleError(error);
    }
  }

  // Duplicate email template
  async duplicateEmailTemplate(id, newName) {
    try {
      const response = await emailTemplateApi.post(`/${id}/duplicate`, {
        new_name: newName
      });
      return response.data;
    } catch (error) {
      console.error('Error duplicating email template:', error);
      throw this.handleError(error);
    }
  }

  // Create default email templates
  async createDefaultTemplates() {
    try {
      const response = await emailTemplateApi.post('/create-defaults');
      return response.data;
    } catch (error) {
      console.error('Error creating default templates:', error);
      throw this.handleError(error);
    }
  }

  // Email Management & Logs
  
  // Get email logs
  async getEmailLogs(params = {}) {
    try {
      const response = await emailManagementApi.get('/logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching email logs:', error);
      throw this.handleError(error);
    }
  }

  // Get email log details
  async getEmailLogDetails(id) {
    try {
      const response = await emailManagementApi.get(`/logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching email log details:', error);
      throw this.handleError(error);
    }
  }

  // Get email statistics
  async getEmailStats(params = {}) {
    try {
      const response = await emailManagementApi.get('/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching email statistics:', error);
      throw this.handleError(error);
    }
  }

  // Get delivery report
  async getDeliveryReport(params = {}) {
    try {
      const response = await emailManagementApi.get('/delivery-report', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery report:', error);
      throw this.handleError(error);
    }
  }

  // Resend failed email
  async resendEmail(id) {
    try {
      const response = await emailManagementApi.post(`/logs/${id}/resend`);
      return response.data;
    } catch (error) {
      console.error('Error resending email:', error);
      throw this.handleError(error);
    }
  }

  // Send bulk email
  async sendBulkEmail(bulkData) {
    try {
      const response = await emailManagementApi.post('/send-bulk', bulkData);
      return response.data;
    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw this.handleError(error);
    }
  }

  // Test email configuration
  async testEmailConfig(testEmail = null) {
    try {
      const response = await emailManagementApi.post('/test-config', {
        test_email: testEmail
      });
      return response.data;
    } catch (error) {
      console.error('Error testing email configuration:', error);
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Server error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error - unable to reach server');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

const emailApiService = new EmailApiService();
export default emailApiService; 