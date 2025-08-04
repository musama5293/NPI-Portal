// Centralized configuration for API URLs
const config = {
  // Development (when running locally)
  development: {
    API_URL: 'http://localhost:5000',
    SOCKET_URL: 'http://localhost:5000'
  },
  // Production (when running on server)
  production: {
    // Use relative URLs since we're serving through Nginx proxy
    API_URL: '',  // Same origin, will use current protocol://domain:port
    SOCKET_URL: ''  // Same origin, will use current protocol://domain:port
  }
};

// Determine environment
const isDevelopment = process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost';
const environment = isDevelopment ? 'development' : 'production';

// Export the appropriate configuration
export const API_URL = config[environment].API_URL;
export const SOCKET_URL = config[environment].SOCKET_URL;

// For backward compatibility
export default {
  API_URL,
  SOCKET_URL
}; 