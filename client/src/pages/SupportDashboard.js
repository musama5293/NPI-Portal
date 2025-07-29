import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Badge,
  Fade,
  Zoom,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  useTheme,
  InputAdornment,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Support as SupportIcon,
  Chat as ChatIcon,
  History as HistoryIcon,
  Flag as PriorityIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  MessageOutlined as MessageIcon,
  CircleNotifications as NotificationIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import supportApiService from '../services/supportApi';
import socketService from '../services/socketService';

// Custom Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Real-time Chat Component
const ChatWindow = ({ ticket, onClose, onMessageSent }) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [messages, setMessages] = useState(ticket?.messages || []);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto scroll to bottom when component mounts with a slight delay to ensure DOM is ready
  useEffect(() => {
    // Immediate scroll attempt
    scrollToBottom();
    
    // Additional scroll attempt after a short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
    
    // Additional scroll attempt after a short delay for any layout shifts
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    setMessages(ticket?.messages || []);
  }, [ticket]);

  // Setup socket listeners for this ticket
  useEffect(() => {
    if (!ticket?._id) return;

    // Join the ticket room
    socketService.joinTicket(ticket._id);

    // Listen for new messages
    const handleNewMessage = (data) => {
      if (data.ticketId === ticket._id) {
        setMessages(prev => [...prev, data.message]);
        onMessageSent?.();
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      if (data.ticketId === ticket._id && data.success) {
        console.log('Message sent successfully:', data.message);
        // Message already added by handleNewMessage
      }
    };

    // Listen for socket errors
    const handleSocketError = (data) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'Connection error');
    };

    // Listen for typing indicators
    const handleTypingStart = (data) => {
      if (data.userId !== (currentUser.id || currentUser._id)) {
        setTypingUsers(prev => [...prev.filter(user => user.userId !== data.userId), data]);
      }
    };

    const handleTypingStop = (data) => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    };

    socketService.on('message:received', handleNewMessage);
    socketService.on('message:sent', handleMessageSent);
    socketService.on('error', handleSocketError);
    socketService.on('typing:user_started', handleTypingStart);
    socketService.on('typing:user_stopped', handleTypingStop);

    return () => {
      socketService.off('message:received', handleNewMessage);
      socketService.off('message:sent', handleMessageSent);
      socketService.off('error', handleSocketError);
      socketService.off('typing:user_started', handleTypingStart);
      socketService.off('typing:user_stopped', handleTypingStop);
      socketService.leaveTicket(ticket._id);
    };
  }, [ticket?._id, currentUser.id, currentUser._id, onMessageSent]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(ticket._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.stopTyping(ticket._id);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    const messageText = message.trim();
    setMessage(''); // Clear input immediately for better UX
    
    try {
      // Send via socket for real-time delivery
      socketService.sendMessage(ticket._id, messageText);
      
      // Note: We're not using API backup since socket handles persistence
      // and the server already saves messages via socket handler
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore message text if socket fails
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message sender info
  const getMessageInfo = (msg) => {
    const isOwnMessage = msg.sender_id === (currentUser.id || currentUser._id);
    const isSystemMessage = msg.message_type === 'system';
    
    return {
      isOwnMessage,
      isSystemMessage,
      senderName: msg.sender_name,
      senderRole: msg.sender_role,
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Live Support Chat
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {ticket.ticket_id} - {ticket.subject}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 0,
        overflow: 'hidden'
      }}>
        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          backgroundColor: theme.palette.grey[50],
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0 // This is crucial for flex child to scroll properly
        }}>
          {messages.map((msg, index) => {
            const msgInfo = getMessageInfo(msg);
            
            if (msgInfo.isSystemMessage) {
              return (
                <Box key={index} sx={{ textAlign: 'center', my: 2 }}>
                  <Chip 
                    label={msg.message} 
                    size="small" 
                    sx={{ 
                      backgroundColor: theme.palette.info.light,
                      color: theme.palette.info.contrastText
                    }}
                  />
                </Box>
              );
            }

            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msgInfo.isOwnMessage ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Box sx={{ 
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: msgInfo.isOwnMessage ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 1
                }}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: msgInfo.isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main
                  }}>
                    {msgInfo.senderName.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Paper sx={{
                    p: 1.5,
                    backgroundColor: msgInfo.isOwnMessage ? theme.palette.primary.main : 'white',
                    color: msgInfo.isOwnMessage ? 'white' : 'inherit',
                    borderRadius: 2,
                    maxWidth: '100%'
                  }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {msg.message}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7,
                        fontSize: '10px'
                      }}
                    >
                      {msgInfo.timestamp}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            );
          })}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.secondary.main }}>
                <Typography variant="caption">
                  {typingUsers[0].userName.charAt(0)}
                </Typography>
              </Avatar>
              <Paper sx={{ p: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {typingUsers[0].userName} is typing...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} style={{ marginTop: 'auto', height: 1, width: '100%' }} />
        </Box>

        {/* Message Input */}
        <Paper sx={{ p: 2, borderRadius: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              disabled={sending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 3
              }}
            >
              {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </Button>
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

// Support Dashboard Main Component
const SupportDashboard = () => {
  const theme = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });
  const [creating, setCreating] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const ticketOptions = supportApiService.getTicketOptions();

  // Initialize socket connection
  useEffect(() => {
    console.log('🔍 SupportDashboard - Socket initialization effect triggered');
    console.log('👤 Current user data:', currentUser);
    
    if (currentUser.id || currentUser._id) {
      const userId = currentUser.id || currentUser._id;
      
      // Map role_id to role name for socket
      const getRoleName = (role_id) => {
        switch(role_id) {
          case 1: return 'admin';
          case 3: return 'supervisor';
          case 4: return 'candidate';
          default: return 'user';
        }
      };

      const userName = currentUser.profile?.firstName && currentUser.profile?.lastName 
        ? `${currentUser.profile.firstName} ${currentUser.profile.lastName}`
        : currentUser.username;

      const userData = {
        userId: userId,
        userRole: getRoleName(currentUser.role_id),
        userName: userName
      };

      console.log('🚀 Attempting to connect socket with data:', userData);
      socketService.connect(userData);

      // Add a small delay to check connection status
      setTimeout(() => {
        console.log('🔍 Socket status after connection attempt:', socketService.getDebugInfo());
      }, 2000);

      // Listen for real-time notifications
      socketService.on('notification:new_message', (data) => {
        toast.info(`New message in ticket ${data.ticketNumber}`, {
          position: 'top-right',
          autoClose: 5000
        });
        fetchTickets(); // Refresh tickets
      });
    } else {
      console.warn('⚠️ Cannot connect socket - user ID is missing:', currentUser);
    }

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketService.cleanup();
      socketService.disconnect();
    };
  }, [currentUser.id, currentUser._id, currentUser.role_id, currentUser.username]);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportApiService.getUserTickets({
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Create new ticket
  const handleCreateTicket = async () => {
    const validation = supportApiService.validateTicketData(newTicket);
    if (!validation.isValid) {
      Object.values(validation.errors).forEach(error => {
        toast.error(error);
      });
      return;
    }

    try {
      setCreating(true);
      const response = await supportApiService.createTicket(newTicket);
      
      if (response.success) {
        toast.success('Support ticket created successfully!');
        setCreateDialogOpen(false);
        setNewTicket({
          subject: '',
          description: '',
          priority: 'medium',
          category: 'general'
        });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  // Open chat for ticket
  const handleOpenChat = (ticket) => {
    setSelectedTicket(ticket);
    setChatOpen(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    return supportApiService.getStatusColor(status);
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    return supportApiService.getPriorityColor(priority);
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Separate tickets by status
  const activeTickets = filteredTickets.filter(t => 
    ['open', 'in_progress', 'waiting_response'].includes(t.status)
  );
  const resolvedTickets = filteredTickets.filter(t => 
    ['resolved', 'closed'].includes(t.status)
  );

  return (
    <MainLayout>
      <Box sx={{ 
        p: 3,
        backgroundColor: theme.palette.background.default,
        minHeight: 'calc(100vh - 64px)'
      }}>
        {/* Header */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
          border: `1px solid ${theme.palette.primary.main}20`
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ 
                bgcolor: theme.palette.primary.main, 
                mr: 2,
                width: 56,
                height: 56
              }}>
                <SupportIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 700
                }}>
                  Support Center
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: theme.palette.text.secondary,
                  mt: 0.5
                }}>
                  Get help with your questions and issues
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                boxShadow: theme.shadows[4]
              }}
            >
              New Ticket
            </Button>
          </Box>

          {/* Search and Filter */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="">All Status</MenuItem>
                {ticketOptions.statuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={fetchTickets} sx={{ color: theme.palette.primary.main }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Tab 
              icon={<MessageIcon />}
              label={`Active (${activeTickets.length})`}
              sx={{ fontWeight: 600 }}
            />
            <Tab 
              icon={<CheckCircleIcon />}
              label={`Resolved (${resolvedTickets.length})`}
              sx={{ fontWeight: 600 }}
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={48} />
              </Box>
            ) : activeTickets.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.grey[200],
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2
                }}>
                  <SupportIcon sx={{ fontSize: 32, color: theme.palette.grey[500] }} />
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                  No Active Tickets
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                  You don't have any active support tickets at the moment.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First Ticket
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {activeTickets.map((ticket) => (
                  <Grid item xs={12} md={6} lg={4} key={ticket._id}>
                    <Zoom in={true} timeout={300}>
                      <Card sx={{
                        height: '100%',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                      onClick={() => handleOpenChat(ticket)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Chip 
                              label={ticket.ticket_id}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.primary.contrastText
                              }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                label={ticket.status.replace('_', ' ')}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(ticket.status) + '20',
                                  color: getStatusColor(ticket.status),
                                  fontWeight: 600
                                }}
                              />
                              {ticket.unread_count > 0 && (
                                <Badge badgeContent={ticket.unread_count} color="error">
                                  <NotificationIcon color="action" />
                                </Badge>
                              )}
                            </Box>
                          </Box>

                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {ticket.subject}
                          </Typography>

                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.secondary,
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {ticket.description}
                          </Typography>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                icon={<CategoryIcon />}
                                label={ticket.category.replace('_', ' ')}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                icon={<PriorityIcon />}
                                label={ticket.priority}
                                size="small"
                                sx={{
                                  backgroundColor: getPriorityColor(ticket.priority) + '20',
                                  color: getPriorityColor(ticket.priority),
                                  fontWeight: 600
                                }}
                              />
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.text.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <AccessTimeIcon sx={{ fontSize: 14 }} />
                              {supportApiService.formatRelativeTime(ticket.created_at)}
                            </Typography>
                            
                            {ticket.latest_message && (
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.text.secondary,
                                fontStyle: 'italic'
                              }}>
                                Last: {supportApiService.formatRelativeTime(ticket.latest_message.timestamp)}
                              </Typography>
                            )}
                          </Box>

                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ChatIcon />}
                            sx={{ mt: 2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat(ticket);
                            }}
                          >
                            Open Chat
                          </Button>
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={48} />
              </Box>
            ) : resolvedTickets.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.grey[200],
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2
                }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: theme.palette.grey[500] }} />
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                  No Resolved Tickets
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Your resolved tickets will appear here.
                </Typography>
              </Box>
            ) : (
              <List>
                {resolvedTickets.map((ticket, index) => (
                  <React.Fragment key={ticket._id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: theme.palette.grey[50],
                        '&:hover': {
                          backgroundColor: theme.palette.grey[100]
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getStatusColor(ticket.status) }}>
                          <CheckCircleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {ticket.subject}
                            </Typography>
                            <Chip 
                              label={ticket.ticket_id}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {ticket.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip 
                                label={ticket.status.replace('_', ' ')}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(ticket.status) + '20',
                                  color: getStatusColor(ticket.status)
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Resolved {supportApiService.formatRelativeTime(ticket.resolved_at || ticket.updated_at)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < resolvedTickets.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>
        </Paper>

        {/* Create Ticket Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white'
          }}>
            Create New Support Ticket
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  helperText="Brief description of your issue"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    label="Category"
                  >
                    {ticketOptions.categories.map(category => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    label="Priority"
                  >
                    {ticketOptions.priorities.map(priority => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  helperText="Detailed description of your issue or question"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateTicket}
              disabled={creating}
              startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
            >
              Create Ticket
            </Button>
          </DialogActions>
        </Dialog>

        {/* Chat Window */}
        {chatOpen && selectedTicket && (
          <ChatWindow 
            ticket={selectedTicket}
            onClose={() => setChatOpen(false)}
            onMessageSent={fetchTickets}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default SupportDashboard; 