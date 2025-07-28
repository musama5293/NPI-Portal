const SupportTicket = require('../models/SupportTicket');
const User = require('../models/user.model');

class SupportSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.activeTickets = new Map(); // ticketId -> Set of userIds
    this.typingUsers = new Map(); // ticketId -> Set of userIds
  }

  handleConnection(socket) {
    console.log(`User connected: ${socket.id}`);

    // User authentication and registration
    socket.on('user:register', async (data) => {
      try {
        const { userId, userRole, userName } = data;
        
        // Store user info in socket
        socket.userId = userId;
        socket.userRole = userRole;
        socket.userName = userName;
        
        // Add to connected users map
        this.connectedUsers.set(userId, socket.id);
        
        // Join user to their personal room for direct notifications
        socket.join(`user:${userId}`);
        
        // If admin/supervisor, join admin room for global notifications
        if (userRole === 'admin' || userRole === 'supervisor') {
          socket.join('admin:notifications');
        }
        
        // Join global notifications room for system-wide notifications
        socket.join('global:notifications');
        
        console.log(`User ${userName} (${userRole}) registered with socket ${socket.id}`);
        
        // Send connection confirmation
        socket.emit('user:registered', {
          success: true,
          message: 'Connected to support system',
          userId,
          socketId: socket.id
        });
        
        // Notify admins of user online status
        this.io.to('admin:notifications').emit('user:online', {
          userId,
          userName,
          userRole,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error in user registration:', error);
        socket.emit('user:registered', {
          success: false,
          message: 'Failed to register user'
        });
      }
    });

    // Join a specific support ticket room
    socket.on('ticket:join', async (data) => {
      try {
        const { ticketId } = data;
        const userId = socket.userId;
        
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }
        
        // Verify user has access to this ticket
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }
        
        // Check if user has permission to access this ticket
        const hasAccess = ticket.user_id.toString() === userId || 
                         socket.userRole === 'admin' || 
                         socket.userRole === 'supervisor' ||
                         (ticket.assigned_to && ticket.assigned_to.toString() === userId);
        
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this ticket' });
          return;
        }
        
        // Join the ticket room
        socket.join(`ticket:${ticketId}`);
        
        // Track active users in this ticket
        if (!this.activeTickets.has(ticketId)) {
          this.activeTickets.set(ticketId, new Set());
        }
        this.activeTickets.get(ticketId).add(userId);
        
        console.log(`User ${socket.userName} joined ticket ${ticketId}`);
        
        // Notify others in the ticket room
        socket.to(`ticket:${ticketId}`).emit('ticket:user_joined', {
          userId,
          userName: socket.userName,
          userRole: socket.userRole,
          timestamp: new Date()
        });
        
        // Send confirmation to user
        socket.emit('ticket:joined', {
          success: true,
          ticketId,
          activeUsers: Array.from(this.activeTickets.get(ticketId))
        });
        
      } catch (error) {
        console.error('Error joining ticket:', error);
        socket.emit('error', { message: 'Failed to join ticket' });
      }
    });

    // Leave a ticket room
    socket.on('ticket:leave', (data) => {
      try {
        const { ticketId } = data;
        const userId = socket.userId;
        
        socket.leave(`ticket:${ticketId}`);
        
        // Remove from active users
        if (this.activeTickets.has(ticketId)) {
          this.activeTickets.get(ticketId).delete(userId);
          
          // Clean up empty ticket rooms
          if (this.activeTickets.get(ticketId).size === 0) {
            this.activeTickets.delete(ticketId);
          }
        }
        
        // Notify others in the ticket room
        socket.to(`ticket:${ticketId}`).emit('ticket:user_left', {
          userId,
          userName: socket.userName,
          timestamp: new Date()
        });
        
        console.log(`User ${socket.userName} left ticket ${ticketId}`);
        
      } catch (error) {
        console.error('Error leaving ticket:', error);
      }
    });

    // Send a message in a ticket
    socket.on('message:send', async (data) => {
      try {
        const { ticketId, message, messageType = 'text', attachments = [] } = data;
        const userId = socket.userId;
        
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }
        
        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }
        
        // Find and update the ticket
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }
        
        // Check access permissions
        const hasAccess = ticket.user_id.toString() === userId || 
                         socket.userRole === 'admin' || 
                         socket.userRole === 'supervisor' ||
                         (ticket.assigned_to && ticket.assigned_to.toString() === userId);
        
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this ticket' });
          return;
        }
        
        // Create new message
        const newMessage = {
          sender_id: userId,
          sender_name: socket.userName,
          sender_role: socket.userRole,
          message: message.trim(),
          message_type: messageType,
          attachments,
          timestamp: new Date()
        };
        
        // Add message to ticket
        ticket.messages.push(newMessage);
        ticket.last_activity = new Date();
        
        // Update ticket status if needed
        if (ticket.status === 'waiting_response' && socket.userRole !== 'candidate') {
          ticket.status = 'in_progress';
        } else if (ticket.status === 'open' && socket.userRole !== 'candidate') {
          ticket.status = 'in_progress';
        } else if (socket.userRole === 'candidate' && ticket.status === 'in_progress') {
          ticket.status = 'waiting_response';
        }
        
        await ticket.save();
        
        // Get the saved message with ID
        const savedMessage = ticket.messages[ticket.messages.length - 1];
        
        // Send success confirmation to sender
        socket.emit('message:sent', {
          success: true,
          ticketId,
          message: savedMessage,
          ticket_status: ticket.status
        });
        
        // Broadcast message to all users in the ticket room
        this.io.to(`ticket:${ticketId}`).emit('message:received', {
          ticketId,
          message: savedMessage,
          ticket_status: ticket.status
        });
        
        // Send notification to relevant users
        await this.sendNotification(ticket, savedMessage);
        
        console.log(`Message sent in ticket ${ticketId} by ${socket.userName}`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message', details: error.message });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      try {
        const { ticketId } = data;
        const userId = socket.userId;
        
        if (!this.typingUsers.has(ticketId)) {
          this.typingUsers.set(ticketId, new Set());
        }
        this.typingUsers.get(ticketId).add(userId);
        
        // Broadcast typing indicator to others in the room
        socket.to(`ticket:${ticketId}`).emit('typing:user_started', {
          userId,
          userName: socket.userName,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error in typing start:', error);
      }
    });

    socket.on('typing:stop', (data) => {
      try {
        const { ticketId } = data;
        const userId = socket.userId;
        
        if (this.typingUsers.has(ticketId)) {
          this.typingUsers.get(ticketId).delete(userId);
          
          // Clean up empty typing rooms
          if (this.typingUsers.get(ticketId).size === 0) {
            this.typingUsers.delete(ticketId);
          }
        }
        
        // Broadcast typing stop to others in the room
        socket.to(`ticket:${ticketId}`).emit('typing:user_stopped', {
          userId,
          userName: socket.userName,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error in typing stop:', error);
      }
    });

    // Mark messages as read
    socket.on('messages:mark_read', async (data) => {
      try {
        const { ticketId, messageIds } = data;
        const userId = socket.userId;
        
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return;
        
        // Mark messages as read
        let updated = false;
        ticket.messages.forEach(msg => {
          if (messageIds.includes(msg.message_id)) {
            if (!msg.read_by.some(read => read.user_id.toString() === userId)) {
              msg.read_by.push({
                user_id: userId,
                read_at: new Date()
              });
              updated = true;
            }
          }
        });
        
        if (updated) {
          await ticket.save();
          
          // Notify others about read status
          socket.to(`ticket:${ticketId}`).emit('messages:read_status', {
            ticketId,
            messageIds,
            readBy: userId,
            readByName: socket.userName,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Update ticket status
    socket.on('ticket:update_status', async (data) => {
      try {
        const { ticketId, status, resolutionNotes } = data;
        const userId = socket.userId;
        
        // Only admins/supervisors can update status
        if (socket.userRole !== 'admin' && socket.userRole !== 'supervisor') {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }
        
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }
        
        const oldStatus = ticket.status;
        ticket.status = status;
        
        if (status === 'resolved' || status === 'closed') {
          ticket.resolved_at = new Date();
          if (resolutionNotes) {
            ticket.resolution_notes = resolutionNotes;
          }
        }
        
        await ticket.save();
        
        // Add system message about status change
        const systemMessage = {
          sender_id: userId,
          sender_name: socket.userName,
          sender_role: socket.userRole,
          message: `Ticket status changed from "${oldStatus}" to "${status}"${resolutionNotes ? `. Resolution: ${resolutionNotes}` : ''}`,
          message_type: 'system',
          timestamp: new Date()
        };
        
        ticket.messages.push(systemMessage);
        await ticket.save();
        
        // Broadcast status update to all users in the ticket room
        this.io.to(`ticket:${ticketId}`).emit('ticket:status_updated', {
          ticketId,
          oldStatus,
          newStatus: status,
          updatedBy: socket.userName,
          resolutionNotes,
          systemMessage: ticket.messages[ticket.messages.length - 1],
          timestamp: new Date()
        });
        
        console.log(`Ticket ${ticketId} status updated to ${status} by ${socket.userName}`);
        
      } catch (error) {
        console.error('Error updating ticket status:', error);
        socket.emit('error', { message: 'Failed to update ticket status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        const userId = socket.userId;
        console.log(`User disconnected: ${socket.id}`);
        
        if (userId) {
          // Remove from connected users
          this.connectedUsers.delete(userId);
          
          // Remove from all active tickets
          this.activeTickets.forEach((users, ticketId) => {
            if (users.has(userId)) {
              users.delete(userId);
              
              // Notify others in the ticket room
              socket.to(`ticket:${ticketId}`).emit('ticket:user_left', {
                userId,
                userName: socket.userName,
                timestamp: new Date()
              });
              
              // Clean up empty ticket rooms
              if (users.size === 0) {
                this.activeTickets.delete(ticketId);
              }
            }
          });
          
          // Remove from typing indicators
          this.typingUsers.forEach((users, ticketId) => {
            if (users.has(userId)) {
              users.delete(userId);
              
              // Notify others about typing stop
              socket.to(`ticket:${ticketId}`).emit('typing:user_stopped', {
                userId,
                userName: socket.userName,
                timestamp: new Date()
              });
              
              // Clean up empty typing rooms
              if (users.size === 0) {
                this.typingUsers.delete(ticketId);
              }
            }
          });
          
          // Notify admins of user offline status
          this.io.to('admin:notifications').emit('user:offline', {
            userId,
            userName: socket.userName,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  }

  // Send notification to relevant users
  async sendNotification(ticket, message) {
    try {
      const notificationData = {
        type: 'new_message',
        ticketId: ticket._id,
        ticketNumber: ticket.ticket_id,
        subject: ticket.subject,
        message: {
          sender: message.sender_name,
          preview: message.message.substring(0, 100) + (message.message.length > 100 ? '...' : ''),
          timestamp: message.timestamp
        },
        priority: ticket.priority
      };

      // Notify the ticket creator if message is not from them
      if (message.sender_id.toString() !== ticket.user_id.toString()) {
        this.io.to(`user:${ticket.user_id}`).emit('notification:new_message', notificationData);
      }

      // Notify assigned admin/supervisor if message is not from them
      if (ticket.assigned_to && message.sender_id.toString() !== ticket.assigned_to.toString()) {
        this.io.to(`user:${ticket.assigned_to}`).emit('notification:new_message', notificationData);
      }

      // Notify all admins/supervisors if message is from candidate
      if (message.sender_role === 'candidate') {
        this.io.to('admin:notifications').emit('notification:new_message', notificationData);
      }

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Get statistics for admin dashboard
  getStatistics() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeTickets: this.activeTickets.size,
      typingUsers: Array.from(this.typingUsers.values()).reduce((sum, users) => sum + users.size, 0)
    };
  }
}

module.exports = SupportSocketHandler; 