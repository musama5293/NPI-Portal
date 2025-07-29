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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Menu,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Support as SupportIcon,
  Chat as ChatIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  MessageOutlined as MessageIcon,
  CircleNotifications as NotificationIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  AssignmentInd as AssignmentIndIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import supportApiService from '../services/supportApi';
import socketService from '../services/socketService';

// Stats Card Component
const StatsCard = ({ title, value, icon, color, trend, subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[6]
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          {trend && (
            <Chip 
              label={trend}
              size="small"
              sx={{ 
                backgroundColor: trend.startsWith('+') ? theme.palette.success.light : theme.palette.error.light,
                color: trend.startsWith('+') ? theme.palette.success.contrastText : theme.palette.error.contrastText
              }}
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ color, fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Real-time Chat Component for Admin
const AdminChatWindow = ({ ticket, onClose, onStatusUpdate }) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(ticket?.messages || []);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(ticket?.status || 'open');
  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Scroll to bottom helper function
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

  // Setup socket listeners
  useEffect(() => {
    if (!ticket?._id) return;

    socketService.joinTicket(ticket._id);

    const handleNewMessage = (data) => {
      if (data.ticketId === ticket._id) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleStatusUpdate = (data) => {
      if (data.ticketId === ticket._id) {
        setStatus(data.newStatus);
        setMessages(prev => [...prev, data.systemMessage]);
        onStatusUpdate?.(data);
      }
    };

    // Listen for socket errors
    const handleSocketError = (data) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'Connection error');
    };

    socketService.on('message:received', handleNewMessage);
    socketService.on('ticket:status_updated', handleStatusUpdate);
    socketService.on('error', handleSocketError);

    return () => {
      socketService.off('message:received', handleNewMessage);
      socketService.off('ticket:status_updated', handleStatusUpdate);
      socketService.off('error', handleSocketError);
      socketService.leaveTicket(ticket._id);
    };
  }, [ticket?._id, onStatusUpdate]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    const messageText = message.trim();
    setMessage('');
    
    try {
      socketService.sendMessage(ticket._id, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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

  // Update ticket status
  const handleStatusUpdate = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Updating ticket status...');
      
      // Send the update without resolution notes
      await socketService.updateTicketStatus(ticket._id, status, '');
      
      // Update toast to success
      toast.update(loadingToast, { 
        render: `Ticket status updated to ${status}`, 
        type: 'success', 
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status: ' + (error.message || 'Unknown error'));
    }
  };

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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '85vh',
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
        color: 'white'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Admin Support Management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {ticket.ticket_id} - {ticket.subject}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chat Area */}
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
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
                      bgcolor: msgInfo.senderRole === 'candidate' ? theme.palette.secondary.main : theme.palette.primary.main
                    }}>
                      {msgInfo.senderName.charAt(0).toUpperCase()}
                    </Avatar>
                    
                    <Paper sx={{
                      p: 1.5,
                      backgroundColor: msgInfo.isOwnMessage ? theme.palette.primary.main : 'white',
                      color: msgInfo.isOwnMessage ? 'white' : 'inherit',
                      borderRadius: 2
                    }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 600,
                        opacity: 0.8,
                        display: 'block'
                      }}>
                        {msgInfo.senderName} ({msgInfo.senderRole})
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {msg.message}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '10px' }}>
                        {msgInfo.timestamp}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} style={{ marginTop: 'auto', height: 1, width: '100%' }} />
          </Box>

          <Paper sx={{ p: 2, borderRadius: 0 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your response..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                onKeyPress={handleKeyPress}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                sx={{ minWidth: 56, height: 56 }}
              >
                {sending ? <CircularProgress size={24} /> : <SendIcon />}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Ticket Management Panel */}
        <Box sx={{ 
          width: 350, 
          borderLeft: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Ticket Management
            </Typography>
            
            {/* Ticket Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: theme.palette.secondary.main }}>
                  {ticket.user_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ticket.user_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ticket.user_email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Current Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Chip 
                label={ticket.status.replace('_', ' ')}
                sx={{
                  backgroundColor: supportApiService.getStatusColor(ticket.status) + '20',
                  color: supportApiService.getStatusColor(ticket.status),
                  fontWeight: 600
                }}
              />
            </Box>

            {/* Priority & Category */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Priority
                </Typography>
                <Chip 
                  label={ticket.priority}
                  size="small"
                  sx={{
                    backgroundColor: supportApiService.getPriorityColor(ticket.priority) + '20',
                    color: supportApiService.getPriorityColor(ticket.priority),
                    fontWeight: 600
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Category
                </Typography>
                <Chip 
                  label={ticket.category.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Status Update */}
          <Box sx={{ p: 3, flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Update Status
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
                size="small"
              >
                {supportApiService.getTicketOptions().statuses.map(s => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              onClick={handleStatusUpdate}
              disabled={status === ticket.status}
              startIcon={<CheckCircleIcon />}
            >
              Update Status
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

// Main Admin Support Dashboard
const AdminSupportDashboard = () => {
  const theme = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);
  const [realTimeMode, setRealTimeMode] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const ticketOptions = supportApiService.getTicketOptions();

  // Initialize socket connection
  useEffect(() => {
    console.log('🔍 AdminSupportDashboard - Socket initialization effect triggered');
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

      console.log('🚀 Admin attempting to connect socket with data:', userData);
      socketService.connect(userData);

      // Add a small delay to check connection status
      setTimeout(() => {
        console.log('🔍 Admin socket status after connection attempt:', socketService.getDebugInfo());
      }, 2000);

      // Listen for real-time notifications
      socketService.on('notification:new_message', (data) => {
        toast.info(`New message in ticket ${data.ticketNumber}`, {
          position: 'top-right',
          autoClose: 5000
        });
        fetchTickets(); // Refresh tickets
      });

      // Listen for ticket status updates
      socketService.on('ticket:status_updated', (data) => {
        toast.success(`Ticket ${data.ticketId} status updated to ${data.newStatus}`);
        fetchTickets(); // Refresh tickets
      });
    } else {
      console.warn('⚠️ Admin cannot connect socket - user ID is missing:', currentUser);
    }

    return () => {
      socketService.cleanup();
      socketService.disconnect();
    };
  }, [currentUser.id, currentUser._id, currentUser.role_id, currentUser.username]);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const [ticketsResponse, analyticsResponse] = await Promise.all([
        supportApiService.getAllTickets({
          page,
          limit: 50,
          search: searchTerm,
          status: filterStatus,
          priority: filterPriority
        }),
        supportApiService.getAnalytics('7d')
      ]);
      
      if (ticketsResponse.success) {
        setTickets(ticketsResponse.data.tickets);
      }
      
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, searchTerm, filterStatus, filterPriority]);

  // Open chat for ticket
  const handleOpenChat = (ticket) => {
    setSelectedTicket(ticket);
    setChatOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = (data) => {
    fetchTickets(); // Refresh tickets
    toast.success(`Ticket status updated to ${data.newStatus}`);
  };

  // Filter tickets by tab
  const getFilteredTickets = () => {
    switch (tabValue) {
      case 0: // All tickets
        return tickets;
      case 1: // Open tickets
        return tickets.filter(t => ['open', 'in_progress'].includes(t.status));
      case 2: // Waiting response
        return tickets.filter(t => t.status === 'waiting_response');
      case 3: // Resolved
        return tickets.filter(t => ['resolved', 'closed'].includes(t.status));
      default:
        return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();

  // Get counts for tabs
  const getCounts = () => {
    return {
      all: tickets.length,
      open: tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length,
      waiting: tickets.filter(t => t.status === 'waiting_response').length,
      resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length
    };
  };

  const counts = getCounts();

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
                <DashboardIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 700
                }}>
                  Support Management
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: theme.palette.text.secondary,
                  mt: 0.5
                }}>
                  Manage all support tickets and customer interactions
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeMode}
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    color="primary"
                  />
                }
                label="Real-time Updates"
              />
              <IconButton onClick={fetchTickets} sx={{ color: theme.palette.primary.main }}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search tickets, customers, or content..."
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                {ticketOptions.statuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="">All</MenuItem>
                {ticketOptions.priorities.map(priority => (
                  <MenuItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Analytics Cards */}
        {analytics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Tickets"
                value={analytics.overview.total_tickets}
                icon={<SupportIcon />}
                color={theme.palette.primary.main}
                subtitle="All time tickets"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="New This Week"
                value={analytics.overview.recent_tickets}
                icon={<TrendingUpIcon />}
                color={theme.palette.info.main}
                subtitle="Last 7 days"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Resolved"
                value={analytics.overview.recent_resolved}
                icon={<CheckCircleIcon />}
                color={theme.palette.success.main}
                subtitle="This week"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Avg Resolution"
                value={`${analytics.overview.avg_resolution_hours}h`}
                icon={<SpeedIcon />}
                color={theme.palette.warning.main}
                subtitle="Response time"
              />
            </Grid>
          </Grid>
        )}

        {/* Tickets Table */}
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
            <Tab label={`All (${counts.all})`} />
            <Tab label={`Open (${counts.open})`} />
            <Tab label={`Waiting (${counts.waiting})`} />
            <Tab label={`Resolved (${counts.resolved})`} />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Ticket ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <CircularProgress size={48} />
                    </TableCell>
                  </TableRow>
                ) : filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" color="text.secondary">
                        No tickets found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow 
                      key={ticket._id}
                      sx={{ 
                        '&:hover': { backgroundColor: theme.palette.grey[50] },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenChat(ticket)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {ticket.ticket_id}
                          </Typography>
                          {ticket.unread_count > 0 && (
                            <Badge badgeContent={ticket.unread_count} color="error" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: theme.palette.secondary.main }}>
                            {ticket.user_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {ticket.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ticket.user_email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {ticket.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ticket.category.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ticket.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            backgroundColor: supportApiService.getStatusColor(ticket.status) + '20',
                            color: supportApiService.getStatusColor(ticket.status),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ticket.priority}
                          size="small"
                          sx={{
                            backgroundColor: supportApiService.getPriorityColor(ticket.priority) + '20',
                            color: supportApiService.getPriorityColor(ticket.priority),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {supportApiService.formatRelativeTime(ticket.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Open Chat">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat(ticket);
                            }}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <ChatIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Admin Chat Window */}
        {chatOpen && selectedTicket && (
          <AdminChatWindow 
            ticket={selectedTicket}
            onClose={() => setChatOpen(false)}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default AdminSupportDashboard; 