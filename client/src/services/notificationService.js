import axios from 'axios';
import socketService from './socketService';

import { API_URL } from '../config/config';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
  }

  // Initialize notification service with socket listeners
  initialize(user) {
    if (this.isInitialized) return;
    
    console.log('🔔 Initializing Notification Service for user:', user?.name);
    
    // Set up socket listeners for real-time notifications
    this.setupSocketListeners();
    
    // Load initial notifications
    this.loadNotifications();
    
    this.isInitialized = true;
  }

  // Setup socket event listeners
  setupSocketListeners() {
    // Listen for new notifications
    socketService.on('notification:new', (notification) => {
      console.log('📨 New notification received:', notification);
      this.handleNewNotification(notification);
    });

    // Listen for priority notifications
    socketService.on('notification:priority', (notification) => {
      console.log('🚨 Priority notification received:', notification);
      this.handlePriorityNotification(notification);
    });

    // Listen for notification updates
    socketService.on('notification:updated', (notification) => {
      console.log('📝 Notification updated:', notification);
      this.handleNotificationUpdate(notification);
    });
  }

  // Handle new notification received via socket
  handleNewNotification(notification) {
    // Add to local notifications array
    this.notifications.unshift(notification);
    
    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
    }
    
    // Notify listeners
    this.notifyListeners('notification:new', notification);
    this.notifyListeners('notifications:updated', {
      notifications: this.notifications,
      unreadCount: this.unreadCount
    });
    
    // Show browser notification if supported
    if (this.isNotificationSupported() && !notification.read) {
      this.showBrowserNotification(notification);
    }
  }

  // Handle priority notifications with special treatment
  handlePriorityNotification(notification) {
    // Handle same as regular notification but with special UI treatment
    this.handleNewNotification(notification);
    
    // Priority notifications might need special handling
    this.notifyListeners('notification:priority', notification);
  }

  // Handle notification updates
  handleNotificationUpdate(notification) {
    // Update local notification
    const index = this.notifications.findIndex(n => n._id === notification._id);
    if (index !== -1) {
      this.notifications[index] = notification;
    }
    
    // Update unread count
    this.updateUnreadCount();
    
    this.notifyListeners('notifications:updated', {
      notifications: this.notifications,
      unreadCount: this.unreadCount
    });
  }

  // API Methods
  async getNotifications(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.type) params.append('type', options.type);
      if (options.priority) params.append('priority', options.priority);
      if (options.category) params.append('category', options.category);

      const response = await axios.get(`${API_URL}/api/notifications?${params}`);
      
      if (response.data.success) {
        this.notifications = response.data.data;
        this.unreadCount = response.data.unreadCount;
        
        this.notifyListeners('notifications:loaded', {
          notifications: this.notifications,
          unreadCount: this.unreadCount,
          pagination: response.data.pagination
        });
        
        return response.data;
      }
      
      throw new Error(response.data.message || 'Failed to load notifications');
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/count`);
      
      if (response.data.success) {
        this.unreadCount = response.data.count;
        this.notifyListeners('unread:count:updated', this.unreadCount);
        return response.data.count;
      }
      
      throw new Error('Failed to get unread count');
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await axios.put(`${API_URL}/api/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local notification
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification && !notification.read) {
          notification.read = true;
          notification.read_at = new Date().toISOString();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        
        this.notifyListeners('notification:read', notification);
        this.notifyListeners('notifications:updated', {
          notifications: this.notifications,
          unreadCount: this.unreadCount
        });
        
        return response.data;
      }
      
      throw new Error('Failed to mark notification as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await axios.put(`${API_URL}/api/notifications/read-all`);
      
      if (response.data.success) {
        // Update all local notifications to read
        this.notifications.forEach(notification => {
          if (!notification.read) {
            notification.read = true;
            notification.read_at = new Date().toISOString();
          }
        });
        
        this.unreadCount = 0;
        
        this.notifyListeners('notifications:all:read');
        this.notifyListeners('notifications:updated', {
          notifications: this.notifications,
          unreadCount: this.unreadCount
        });
        
        return response.data;
      }
      
      throw new Error('Failed to mark all notifications as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${API_URL}/api/notifications/${notificationId}`);
      
      if (response.data.success) {
        // Remove from local notifications
        const notification = this.notifications.find(n => n._id === notificationId);
        this.notifications = this.notifications.filter(n => n._id !== notificationId);
        
        // Update unread count if it was unread
        if (notification && !notification.read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        
        this.notifyListeners('notification:deleted', notificationId);
        this.notifyListeners('notifications:updated', {
          notifications: this.notifications,
          unreadCount: this.unreadCount
        });
        
        return response.data;
      }
      
      throw new Error('Failed to delete notification');
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Load initial notifications
  async loadNotifications() {
    try {
      await this.getNotifications({ limit: 20 });
    } catch (error) {
      console.error('Failed to load initial notifications:', error);
    }
  }

  // Update unread count from local notifications
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  // Browser notification support
  isNotificationSupported() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  showBrowserNotification(notification) {
    if (!this.isNotificationSupported()) return;
    
    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification._id,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low'
    };
    
    const browserNotification = new Notification(notification.title, options);
    
    browserNotification.onclick = () => {
      window.focus();
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
      browserNotification.close();
    };
    
    // Auto close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  // Getters for current state
  getNotifications() {
    return this.notifications;
  }

  getUnreadCountLocal() {
    return this.unreadCount;
  }

  // Cleanup
  cleanup() {
    this.listeners.clear();
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
    
    // Remove socket listeners
    socketService.off('notification:new');
    socketService.off('notification:priority');
    socketService.off('notification:updated');
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService; 