const SupportTicket = require('../models/SupportTicket');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Helper function to get role name from role_id
const getRoleName = (role_id) => {
  switch(role_id) {
    case 1: return 'admin';
    case 3: return 'supervisor';
    case 4: return 'candidate';
    default: return 'user';
  }
};

class SupportController {

  // Create a new support ticket
  async createTicket(req, res) {
    try {
      const { subject, description, priority = 'medium', category = 'general' } = req.body;
      const userId = req.user._id;
      const userName = req.user.profile?.firstName && req.user.profile?.lastName 
        ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
        : req.user.username;
      const userEmail = req.user.email;

      // Validate required fields
      if (!subject || !description) {
        return res.status(400).json({
          success: false,
          message: 'Subject and description are required'
        });
      }

      // Create new ticket
      const ticket = new SupportTicket({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        subject,
        description,
        priority,
        category,
        messages: [{
          sender_id: userId,
          sender_name: userName,
          sender_role: getRoleName(req.user.role_id),
          message: description,
          message_type: 'text'
        }]
      });

      await ticket.save();

      res.status(201).json({
        success: true,
        message: 'Support ticket created successfully',
        data: ticket
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create support ticket',
        error: error.message
      });
    }
  }

  // Get tickets for current user
  async getUserTickets(req, res) {
    try {
      const userId = req.user._id;
      const { status, priority, page = 1, limit = 10 } = req.query;

      // Build query
      const query = { user_id: userId };
      if (status) query.status = status;
      if (priority) query.priority = priority;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get tickets with pagination
      const tickets = await SupportTicket.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await SupportTicket.countDocuments(query);

      // Add virtual fields manually
      const ticketsWithVirtuals = tickets.map(ticket => ({
        ...ticket,
        latest_message: ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null,
        unread_count: ticket.messages.filter(msg => 
          msg.read_by.length === 0 || 
          !msg.read_by.some(read => read.user_id.toString() === userId.toString())
        ).length
      }));

      res.json({
        success: true,
        data: {
          tickets: ticketsWithVirtuals,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting user tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tickets',
        error: error.message
      });
    }
  }

  // Get all tickets (admin only)
  async getAllTickets(req, res) {
    try {
      // Check if user is admin/supervisor
      if (![1, 3].includes(req.user.role_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { 
        status, 
        priority, 
        category,
        assigned_to,
        search,
        page = 1, 
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (assigned_to) query.assigned_to = assigned_to;

      // Add search functionality
      if (search) {
        query.$or = [
          { subject: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { user_name: { $regex: search, $options: 'i' } },
          { user_email: { $regex: search, $options: 'i' } },
          { ticket_id: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build sort object
      const sortObj = {};
      sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

      // Get tickets with pagination
      const tickets = await SupportTicket.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assigned_to', 'name email')
        .lean();

      // Get total count for pagination
      const total = await SupportTicket.countDocuments(query);

      // Add virtual fields manually
      const ticketsWithVirtuals = tickets.map(ticket => ({
        ...ticket,
        latest_message: ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null,
        unread_count: ticket.messages.filter(msg => 
          msg.read_by.length === 0
        ).length
      }));

      res.json({
        success: true,
        data: {
          tickets: ticketsWithVirtuals,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting all tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tickets',
        error: error.message
      });
    }
  }

  // Get single ticket details
  async getTicketById(req, res) {
    try {
      const { ticketId } = req.params;
      const userId = req.user._id;
      const userRoleId = req.user.role_id;

      // Find ticket
      const ticket = await SupportTicket.findById(ticketId)
        .populate('assigned_to', 'name email')
        .lean();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Check access permissions
      const hasAccess = ticket.user_id.toString() === userId.toString() || 
                       [1, 3].includes(userRoleId) ||
                       (ticket.assigned_to && ticket.assigned_to._id.toString() === userId.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this ticket'
        });
      }

      // Add virtual fields manually
      const ticketWithVirtuals = {
        ...ticket,
        latest_message: ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null,
        unread_count: ticket.messages.filter(msg => 
          msg.read_by.length === 0 || 
          !msg.read_by.some(read => read.user_id.toString() === userId.toString())
        ).length
      };

      res.json({
        success: true,
        data: ticketWithVirtuals
      });

    } catch (error) {
      console.error('Error getting ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ticket',
        error: error.message
      });
    }
  }

  // Update ticket (admin only)
  async updateTicket(req, res) {
    try {
      // Check if user is admin/supervisor
      if (![1, 3].includes(req.user.role_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { ticketId } = req.params;
      const { status, priority, assigned_to, resolution_notes, tags } = req.body;

      // Find ticket
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Store old values for system message
      const oldStatus = ticket.status;
      const oldPriority = ticket.priority;
      const oldAssignedTo = ticket.assigned_to_name;

      // Update fields
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (resolution_notes) ticket.resolution_notes = resolution_notes;
      if (tags) ticket.tags = tags;

      // Handle assignment
      if (assigned_to) {
        if (assigned_to === 'unassign') {
          ticket.assigned_to = null;
          ticket.assigned_to_name = null;
        } else {
          const assignedUser = await User.findById(assigned_to);
          if (assignedUser) {
            ticket.assigned_to = assigned_to;
            ticket.assigned_to_name = assignedUser.name;
          }
        }
      }

      // Set resolved timestamp if status changed to resolved/closed
      if ((status === 'resolved' || status === 'closed') && oldStatus !== status) {
        ticket.resolved_at = new Date();
      }

      await ticket.save();

      // Create system message for changes
      const changes = [];
      if (status && status !== oldStatus) changes.push(`Status: ${oldStatus} → ${status}`);
      if (priority && priority !== oldPriority) changes.push(`Priority: ${oldPriority} → ${priority}`);
      if (assigned_to && ticket.assigned_to_name !== oldAssignedTo) {
        changes.push(`Assigned: ${oldAssignedTo || 'Unassigned'} → ${ticket.assigned_to_name || 'Unassigned'}`);
      }

      if (changes.length > 0) {
        const userName = req.user.profile?.firstName && req.user.profile?.lastName 
          ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
          : req.user.username;
          
        const systemMessage = {
          sender_id: req.user._id,
          sender_name: userName,
          sender_role: getRoleName(req.user.role_id),
          message: `Ticket updated: ${changes.join(', ')}${resolution_notes ? `. Resolution: ${resolution_notes}` : ''}`,
          message_type: 'system'
        };
        
        ticket.messages.push(systemMessage);
        await ticket.save();
      }

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
      });

    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ticket',
        error: error.message
      });
    }
  }

  // Add message to ticket
  async addMessage(req, res) {
    try {
      const { ticketId } = req.params;
      const { message, message_type = 'text', attachments = [] } = req.body;
      const userId = req.user._id;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      // Find ticket
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Check access permissions
      const hasAccess = ticket.user_id.toString() === userId.toString() || 
                       [1, 3].includes(req.user.role_id) ||
                       (ticket.assigned_to && ticket.assigned_to.toString() === userId.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this ticket'
        });
      }

      // Create new message
      const userName = req.user.profile?.firstName && req.user.profile?.lastName 
        ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
        : req.user.username;
        
      const newMessage = {
        sender_id: userId,
        sender_name: userName,
        sender_role: getRoleName(req.user.role_id),
        message,
        message_type,
        attachments
      };

      // Add message to ticket
      ticket.messages.push(newMessage);
      ticket.last_activity = new Date();

      // Update ticket status based on who sent the message
      if (ticket.status === 'waiting_response' && req.user.role_id !== 4) {
        ticket.status = 'in_progress';
      } else if (ticket.status === 'open' && req.user.role_id !== 4) {
        ticket.status = 'in_progress';
      } else if (req.user.role_id === 4 && ticket.status === 'in_progress') {
        ticket.status = 'waiting_response';
      }

      await ticket.save();

      // Get the saved message
      const savedMessage = ticket.messages[ticket.messages.length - 1];

      res.json({
        success: true,
        message: 'Message added successfully',
        data: {
          message: savedMessage,
          ticket_status: ticket.status
        }
      });

    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add message',
        error: error.message
      });
    }
  }

  // Get support analytics (admin only)
  async getAnalytics(req, res) {
    try {
      // Check if user is admin/supervisor
      if (![1, 3].includes(req.user.role_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { timeframe = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Aggregate data
      const analytics = await SupportTicket.aggregate([
        {
          $facet: {
            // Total tickets by status
            statusCounts: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            
            // Tickets by priority
            priorityCounts: [
              { $group: { _id: '$priority', count: { $sum: 1 } } }
            ],
            
            // Tickets by category
            categoryCounts: [
              { $group: { _id: '$category', count: { $sum: 1 } } }
            ],
            
            // Recent tickets (within timeframe)
            recentTickets: [
              { $match: { created_at: { $gte: startDate } } },
              { $group: { _id: null, count: { $sum: 1 } } }
            ],
            
            // Resolved tickets (within timeframe)
            recentResolved: [
              { 
                $match: { 
                  resolved_at: { $gte: startDate, $lte: now }
                }
              },
              { $group: { _id: null, count: { $sum: 1 } } }
            ],
            
            // Average resolution time
            avgResolutionTime: [
              {
                $match: {
                  resolved_at: { $exists: true },
                  created_at: { $gte: startDate }
                }
              },
              {
                $project: {
                  resolutionTime: {
                    $subtract: ['$resolved_at', '$created_at']
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  avgTime: { $avg: '$resolutionTime' }
                }
              }
            ],
            
            // Tickets by day (for chart)
            dailyTickets: [
              { $match: { created_at: { $gte: startDate } } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$created_at'
                    }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]);

      const result = analytics[0];

      // Format the response
      const formattedAnalytics = {
        overview: {
          total_tickets: await SupportTicket.countDocuments(),
          recent_tickets: result.recentTickets[0]?.count || 0,
          recent_resolved: result.recentResolved[0]?.count || 0,
          avg_resolution_hours: result.avgResolutionTime[0] ? 
            Math.round(result.avgResolutionTime[0].avgTime / (1000 * 60 * 60)) : 0
        },
        status_distribution: result.statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        priority_distribution: result.priorityCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        category_distribution: result.categoryCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        daily_trends: result.dailyTickets,
        timeframe
      };

      res.json({
        success: true,
        data: formattedAnalytics
      });

    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics',
        error: error.message
      });
    }
  }

  // Mark messages as read
  async markMessagesRead(req, res) {
    try {
      const { ticketId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user._id;

      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({
          success: false,
          message: 'Message IDs array is required'
        });
      }

      // Find ticket
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Check access permissions
      const hasAccess = ticket.user_id.toString() === userId.toString() || 
                       [1, 3].includes(req.user.role_id) ||
                       (ticket.assigned_to && ticket.assigned_to.toString() === userId.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this ticket'
        });
      }

      // Mark messages as read
      let updated = false;
      ticket.messages.forEach(msg => {
        if (messageIds.includes(msg.message_id)) {
          if (!msg.read_by.some(read => read.user_id.toString() === userId.toString())) {
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
      }

      res.json({
        success: true,
        message: 'Messages marked as read',
        updated
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message
      });
    }
  }
}

module.exports = new SupportController(); 
