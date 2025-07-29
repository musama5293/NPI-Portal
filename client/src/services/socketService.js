import io from 'socket.io-client';

console.log('🚀 Socket service module loaded');

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pendingUserData = null;
  }

  // Initialize socket connection
  connect(userData) {
    // Store user data for registration after connection
    this.pendingUserData = userData;
    
    if (this.socket?.connected) {
      console.log('Socket already connected, registering user...');
      this.registerUser(userData);
      return this.socket;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      console.log('Disconnecting existing socket...');
      this.socket.disconnect();
    }

    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('🔌 Attempting to connect to socket server:', serverUrl);
    console.log('📋 User data for registration:', userData);
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
    
    // Add a timeout to check connection status
    setTimeout(() => {
      if (!this.isConnected) {
        console.warn('⚠️ Socket connection timeout - connection not established after 5 seconds');
        console.log('Socket state:', {
          connected: this.socket?.connected,
          disconnected: this.socket?.disconnected,
          id: this.socket?.id
        });
      }
    }, 5000);
    
    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.pendingUserData = null;
      console.log('Socket disconnected');
    }
  }

  // Setup basic event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to support system:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Register user if we have pending user data
      if (this.pendingUserData) {
        console.log('Registering user after connection...');
        this.registerUser(this.pendingUserData);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from support system:', reason);
      this.isConnected = false;
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('Manual disconnect, not attempting to reconnect');
      } else {
        console.log('Unexpected disconnect, will attempt to reconnect...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.isConnected = false;
    });

    this.socket.on('user:registered', (data) => {
      console.log('User registration response:', data);
      if (data.success) {
        console.log('Successfully registered with support system');
      } else {
        console.error('Failed to register with support system:', data.message);
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
      this.isConnected = true;
      
      // Re-register user after reconnection
      if (this.pendingUserData) {
        console.log('Re-registering user after reconnection...');
        this.registerUser(this.pendingUserData);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect... attempt #', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      this.isConnected = false;
    });
  }

  // Register user with the socket server
  registerUser(userData) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.warn('Socket not connected, will register after connection');
      this.pendingUserData = userData;
      return;
    }

    console.log('Registering user:', userData);
    this.socket.emit('user:register', {
      userId: userData.userId,
      userRole: userData.userRole,
      userName: userData.userName
    });
  }

  // Join a support ticket room
  joinTicket(ticketId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Joining ticket room:', ticketId);
    this.socket.emit('ticket:join', { ticketId });
  }

  // Leave a support ticket room
  leaveTicket(ticketId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Leaving ticket room:', ticketId);
    this.socket.emit('ticket:leave', { ticketId });
  }

  // Send a message in a ticket
  sendMessage(ticketId, message, messageType = 'text', attachments = []) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Sending message to ticket:', ticketId, message);
    this.socket.emit('message:send', {
      ticketId,
      message,
      messageType,
      attachments
    });
  }

  // Start typing indicator
  startTyping(ticketId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('typing:start', { ticketId });
  }

  // Stop typing indicator
  stopTyping(ticketId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('typing:stop', { ticketId });
  }

  // Mark messages as read
  markMessagesRead(ticketId, messageIds) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('messages:mark_read', { ticketId, messageIds });
  }

  // Update ticket status (admin only)
  updateTicketStatus(ticketId, status, resolutionNotes = null) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Updating ticket status:', ticketId, status);
    this.socket.emit('ticket:update_status', {
      ticketId,
      status,
      resolutionNotes
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    // Store callback for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.off(event, callback);

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.removeAllListeners(event);
    this.listeners.delete(event);
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }

  // Emit custom event
  emit(event, data) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  // Test connection
  testConnection() {
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('Testing connection to:', serverUrl);
    
    const testSocket = io(serverUrl, {
      autoConnect: true,
      timeout: 5000,
      transports: ['websocket', 'polling']
    });

    testSocket.on('connect', () => {
      console.log('✅ Test connection successful!', testSocket.id);
      testSocket.disconnect();
    });

    testSocket.on('connect_error', (error) => {
      console.error('❌ Test connection failed:', error.message);
      testSocket.disconnect();
    });

    return testSocket;
  }

  // Force reconnection
  forceReconnect() {
    console.log('Forcing socket reconnection...');
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.pendingUserData) {
      this.connect(this.pendingUserData);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,
      pendingUserData: this.pendingUserData,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Get detailed debug info
  getDebugInfo() {
    const status = this.getConnectionStatus();
    console.log('🔍 Socket Debug Info:', status);
    return status;
  }

  // Clean up all listeners
  cleanup() {
    if (this.socket) {
      // Remove all stored listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

// Add to window for debugging in development
if (process.env.NODE_ENV === 'development') {
  window.socketService = socketService;
  console.log('🔧 Socket service available at window.socketService for debugging');
}

export default socketService; 