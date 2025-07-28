const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create a new support ticket
router.post('/tickets', supportController.createTicket);

// Get current user's tickets
router.get('/tickets/my', supportController.getUserTickets);

// Get all tickets (admin only)
router.get('/tickets', supportController.getAllTickets);

// Get specific ticket by ID
router.get('/tickets/:ticketId', supportController.getTicketById);

// Update ticket (admin only)
router.put('/tickets/:ticketId', supportController.updateTicket);

// Add message to ticket
router.post('/tickets/:ticketId/messages', supportController.addMessage);

// Mark messages as read
router.post('/tickets/:ticketId/messages/read', supportController.markMessagesRead);

// Get support analytics (admin only)
router.get('/analytics', supportController.getAnalytics);

module.exports = router; 