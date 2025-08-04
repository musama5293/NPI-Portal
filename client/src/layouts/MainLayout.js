import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip,
  Badge,
  Popover,
  Paper,
  ListItemButton,
  useMediaQuery,
  Collapse,
  Breadcrumbs,
  Container,
  Button,
  Fade,
  useTheme,
  alpha,
  styled,
  Stack,
  Drawer
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  ExpandLess,
  ExpandMore,
  DashboardOutlined as DashboardIcon,
  PeopleOutline as PeopleIcon,
  AssignmentOutlined as AssignmentIcon,
  QuizOutlined as QuizIcon,
  BusinessOutlined as BusinessIcon,
  CategoryOutlined as CategoryIcon,
  TimerOutlined as TimerIcon,
  WorkOutline as WorkIcon,
  AssessmentOutlined as AssessmentIcon,
  DomainOutlined as DomainIcon,
  ExtensionOutlined as ExtensionIcon,
  SupervisorAccountOutlined as SupervisorIcon,
  SchoolOutlined as SchoolIcon,
  ApartmentOutlined as ApartmentIcon,
  AccountBalanceOutlined as AccountBalanceIcon,
  Folder as FolderIcon,
  Home as HomeIcon,
  ArrowForward as ArrowForwardIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Close as CloseIcon,
  Support as SupportIcon,
  SupportAgent as SupportAgentIcon,
  Email as EmailIcon,
  EmailOutlined as EmailOutlinedIcon,
  MailOutline as MailOutlineIcon
} from '@mui/icons-material';
import ThemeToggle from '../components/common/ThemeToggle';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.95)}, ${alpha(theme.palette.primary.main, 0.85)})`
    : `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.contrastText,
  position: 'fixed',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['background-color', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  color: theme.palette.common.white,
  fontSize: '0.95rem',
  textTransform: 'none',
  fontWeight: active ? 600 : 500,
  minHeight: 64,
  borderRadius: 0,
  padding: theme.spacing(1.5, 2.5),
  marginRight: theme.spacing(0.5),
  borderBottom: active ? `3px solid ${theme.palette.secondary.main}` : '3px solid transparent',
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: theme.transitions.duration.short,
  }),
  position: 'relative', // For dropdown positioning
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    borderBottom: active ? `3px solid ${theme.palette.secondary.main}` : `3px solid ${alpha(theme.palette.secondary.main, 0.7)}`,
  },
  '& .MuiButton-endIcon': {
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shorter,
    }),
  },
  '&:hover .MuiButton-endIcon': {
    transform: 'rotate(180deg)',
  }
}));

const NavDropdown = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: 220,
  zIndex: theme.zIndex.drawer + 1,
  display: 'none',
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  animation: 'fadeIn 0.2s ease-in-out',
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(10px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}));

const NavItemWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&:hover': {
    '& .nav-dropdown': {
      display: 'block'
    }
  }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  backgroundColor: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  display: 'flex',
  flexDirection: 'column',
  marginTop: 64, // AppBar height
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.standard,
  }),
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  overflowY: 'auto',
  minHeight: 0,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const Footer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  textAlign: 'center',
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: 'auto',
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const NotificationItem = styled(Box)(({ theme, read }) => ({
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: read ? 'transparent' : alpha(theme.palette.primary.light, 0.08),
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.5),
  },
  cursor: 'pointer'
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    fontWeight: 'bold',
    boxShadow: `0 0 0 2px ${alpha(theme.palette.common.white, 0.2)}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  minWidth: 100,
  marginRight: theme.spacing(3),
}));

const StyledLogo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  textDecoration: 'none',
  color: theme.palette.common.white,
  display: 'flex',
  alignItems: 'center',
  transition: theme.transitions.create('color', {
    duration: theme.transitions.duration.shorter,
  }),
  fontSize: '1.5rem',
  letterSpacing: '0.5px',
  '&:hover': {
    color: theme.palette.secondary.light,
  }
}));

const BreadcrumbContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  transition: theme.transitions.create(['transform', 'background-color'], {
    duration: theme.transitions.duration.shortest,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    transform: 'scale(1.05)',
  },
}));

const MainLayout = ({ children, title, breadcrumbs }) => {
  const theme = useTheme();
  const { user, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState({});
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Completely separate state handling for menu and sections
  const [expandedMenus, setExpandedMenus] = useState({
    'Personality Assessment': false,
    'Organization Management': false
  });
  
  // Add state to track which mobile nav items are expanded
  const [mobileNavExpanded, setMobileNavExpanded] = useState({});
  
  const [collapsedSections, setCollapsedSections] = useState({
    main: false,
    assessment: false,
    candidates: false,
    jobs: false,
    admin: false,
    candidate: false
  });
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile, close sidebar by default
  useEffect(() => {
    if (isMobile) {
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    // Initialize notification service with user data
    if (user) {
      initializeNotificationService();
    }
    
    return () => {
      // Cleanup notification listeners on unmount
      if (window.notificationService) {
        window.notificationService.cleanup();
      }
    };
  }, [user]);

  const initializeNotificationService = async () => {
    try {
      // Dynamic import to avoid circular dependencies
      const { default: notificationService } = await import('../services/notificationService');
      
      // Store in window for cleanup
      window.notificationService = notificationService;
      
      // Initialize with user data
      notificationService.initialize(user);
      
      // Set up listeners for real-time updates
      notificationService.on('notifications:updated', (data) => {
        setNotifications(data.notifications.map(n => ({
          id: n._id,
          title: n.title,
          message: n.message,
          time: n.timeAgo || formatTimeAgo(n.createdAt),
          read: n.read,
          type: n.type,
          priority: n.priority,
          action_url: n.action_url
        })));
        setUnreadCount(data.unreadCount);
      });
      
      notificationService.on('notification:new', (notification) => {
        // Show toast for new notifications
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          toast.success(`🔔 ${notification.title}: ${notification.message}`, {
            autoClose: notification.priority === 'urgent' ? false : 5000
          });
        } else {
          toast.info(`📢 ${notification.title}`, {
            autoClose: 3000
          });
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Fallback to sample data if service fails
      const sampleNotifications = [
        { 
          id: 1, 
          title: 'Service Loading...', 
          message: 'Notification service is initializing.',
          time: 'now',
          read: false,
        }
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(1);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };
  
  const handleMobileNavToggle = useCallback(() => {
    setMobileNavOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleProfileMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleProfileMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleProfileClick = useCallback(() => {
    handleProfileMenuClose();
    navigate('/profile');
  }, [handleProfileMenuClose, navigate]);

  const handleNotificationClick = useCallback((event) => {
    setNotificationAnchorEl(event.currentTarget);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationAnchorEl(null);
  }, []);

  const handleNotificationRead = useCallback(async (id) => {
    try {
      if (window.notificationService) {
        await window.notificationService.markAsRead(id);
      } else {
        // Fallback for when service isn't loaded
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      if (window.notificationService) {
        await window.notificationService.markAllAsRead();
      } else {
        // Fallback for when service isn't loaded
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  const handleNavMenuOpen = useCallback((event, menuId) => {
    setMenuAnchorEl(prev => ({
      ...prev,
      [menuId]: event.currentTarget
    }));
  }, []);

  const handleNavMenuClose = useCallback((menuId) => {
    setMenuAnchorEl(prev => ({
      ...prev,
      [menuId]: null
    }));
  }, []);

  // Memoized toggle functions to prevent recreating on each render
  const toggleExpandMenu = useCallback((menuName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setExpandedMenus(prev => {
      const newState = {...prev};
      newState[menuName] = !prev[menuName];
      return newState;
    });
  }, []);

  const toggleSection = useCallback((sectionName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setCollapsedSections(prev => {
      const newState = {...prev};
      newState[sectionName] = !prev[sectionName];
      return newState;
    });
  }, []);

  // Add function to toggle mobile nav item expansion
  const toggleMobileNavItem = useCallback((navItemId) => {
    setMobileNavExpanded(prev => ({
      ...prev,
      [navItemId]: !prev[navItemId]
    }));
  }, []);

  // Function to get appropriate icon for menu items
  const getMenuIcon = useCallback((name) => {
    switch (name.toLowerCase()) {
      case 'dashboard':
        return <DashboardIcon />;
      case 'my profile':
        return <PersonIcon />;
      case 'candidates':
        return <PeopleIcon />;
      case 'tests':
        return <QuizIcon />;
      case 'categories':
        return <CategoryIcon />;
      case 'test assignments':
        return <AssignmentIcon />;
      case 'jobs':
        return <WorkIcon />;
      case 'evaluation boards':
        return <AssessmentIcon />;
      case 'probation dashboard':
        return <TimerIcon />;
      case 'domains':
        return <DomainIcon />;
      case 'subdomains':
        return <ExtensionIcon />;
      case 'questions':
        return <QuizIcon />;
              case 'my assessments':
        return <AssignmentIcon />;
      case 'results':
        return <AssessmentIcon />;
      case 'results dashboard':
        return <AssessmentIcon />;
      case 'user management':
        return <SupervisorIcon />;
      case 'role management':
        return <BusinessIcon />;
      case 'organizations':
        return <BusinessIcon />;
      case 'institutes':
        return <SchoolIcon />;
      case 'departments':
        return <ApartmentIcon />;
      case 'support':
        return <SupportIcon />;
      case 'admin support':
        return <SupportAgentIcon />;
      case 'email dashboard':
        return <EmailIcon />;
      case 'email templates':
        return <EmailOutlinedIcon />;
      case 'email logs':
        return <MailOutlineIcon />;
      default:
        return <HomeIcon />;
    }
  }, []);

  // Function to check if a route is active
  const isActive = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Check if any child route is active
  const isChildActive = useCallback((children) => {
    if (!children) return false;
    return children.some(child => isActive(child.path));
  }, [isActive]);

  // Groups need to be updated to include permission keys
  const menuGroups = {
    main: [
      { name: 'Dashboard', path: '/', icon: getMenuIcon('Dashboard'), permission: 'access_dashboard' },
      { name: 'My Profile', path: '/profile', icon: getMenuIcon('My Profile'), permission: 'access_user_profile' },
    ],
    assessment: [
      { name: 'Tests', path: '/tests', icon: getMenuIcon('Tests'), permission: 'access_test_management' },
      { name: 'Categories', path: '/categories', icon: getMenuIcon('Categories'), permission: 'access_category_management' },
      { name: 'Test Assignments', path: '/test-assignments', icon: getMenuIcon('Test Assignments'), permission: 'access_test_assignment' },
      { name: 'Results Dashboard', path: '/results-dashboard', icon: getMenuIcon('Results Dashboard'), permission: 'access_results_dashboard' },
      { 
        name: 'Personality Assessment', 
        children: [
          { name: 'Domains', path: '/domains', icon: getMenuIcon('Domains'), permission: 'access_domain_management' },
          { name: 'Subdomains', path: '/subdomains', icon: getMenuIcon('Subdomains'), permission: 'access_subdomain_management' },
          { name: 'Questions', path: '/questions', icon: getMenuIcon('Questions'), permission: 'access_question_management' },
        ]
      },
    ],
    candidates: [
      { name: 'Candidates', path: '/candidates', icon: getMenuIcon('Candidates'), permission: 'access_candidate_management' },
      { name: 'Evaluation Boards', path: '/boards', icon: getMenuIcon('Evaluation Boards'), permission: 'access_evaluation_boards' },
      { name: 'Probation Dashboard', path: '/probation-dashboard', icon: getMenuIcon('Probation Dashboard'), permission: 'access_probation_dashboard' },
    ],
    jobs: [
      { name: 'Jobs', path: '/jobs', icon: getMenuIcon('Jobs'), permission: 'access_job_management' },
    ],
    admin: [
      { name: 'User Management', path: '/users', icon: getMenuIcon('User Management'), permission: 'access_user_management' },
      { name: 'Role Management', path: '/roles', icon: getMenuIcon('Role Management'), permission: 'access_role_management' },
      { name: 'Admin Support', path: '/admin-support', icon: getMenuIcon('Admin Support'), permission: 'access_admin_support' },
      { 
        name: 'Email Management', 
        children: [
          { name: 'Email Dashboard', path: '/email-dashboard', icon: getMenuIcon('Email Dashboard'), permission: 'access_email_dashboard' },
          { name: 'Email Templates', path: '/email-templates', icon: getMenuIcon('Email Templates'), permission: 'access_email_templates' },
          { name: 'Email Logs', path: '/email-logs', icon: getMenuIcon('Email Logs'), permission: 'access_email_logs' },
        ]
      },
      { 
        name: 'Organization Management', 
        children: [
          { name: 'Organizations', path: '/organizations', icon: getMenuIcon('Organizations'), permission: 'access_organization_management' },
          { name: 'Institutes', path: '/institutes', icon: getMenuIcon('Institutes'), permission: 'access_institute_management' },
          { name: 'Departments', path: '/departments', icon: getMenuIcon('Departments'), permission: 'access_department_management' },
        ]
      },
    ],
    candidate: [
              { name: 'My Assessments', path: '/my-assessments', icon: getMenuIcon('My Assessments'), permission: 'access_candidate_tests' },
      { name: 'Support', path: '/support', icon: getMenuIcon('Support'), permission: 'access_support' },
    ],
    supervisor: [
      { name: 'Feedback Forms', path: '/supervisor-tests', icon: getMenuIcon('Test Assignments'), permission: 'access_supervisor_tests' },
      { name: 'Support', path: '/support', icon: getMenuIcon('Support'), permission: 'access_support' },
    ],
  };

  // Create a flat navigation structure for main header navigation with clearer role-focused organization
  const mainNavItems = [
    { 
      id: 'main',
      name: 'Dashboard', 
      items: menuGroups.main,
      requiredPermissions: ['access_dashboard', 'access_user_profile']
    },
    { 
      id: 'assessment',
      name: 'Assessment', 
      items: menuGroups.assessment,
      requiredPermissions: [
        'access_test_management',
        'access_category_management',
        'access_test_assignment',
        'access_results_dashboard',
        'access_domain_management',
        'access_subdomain_management',
        'access_question_management'
      ]
    },
    { 
      id: 'candidates',
      name: 'Candidates', 
      items: menuGroups.candidates,
      requiredPermissions: [
        'access_candidate_management',
        'access_evaluation_boards',
        'access_probation_dashboard'
      ]
    },
    { 
      id: 'jobs',
      name: 'Jobs', 
      items: menuGroups.jobs,
      requiredPermissions: ['access_job_management']
    },
    { 
      id: 'admin',
      name: 'Administration', 
      items: menuGroups.admin,
      requiredPermissions: [
        'access_user_management',
        'access_role_management',
        'access_admin_support',
        'access_email_dashboard',
        'access_email_templates',
        'access_email_logs',
        'access_organization_management',
        'access_institute_management',
        'access_department_management'
      ]
    },
    // Candidate-specific section (only shown to candidates)
    { 
      id: 'candidate',
              name: 'My Assessments', 
      items: menuGroups.candidate,
      requiredPermissions: ['access_candidate_tests', 'access_my_tests', 'access_support'],
      roleSpecific: 'candidate'
    },
    // Supervisor-specific section (only shown to supervisors)
    {
      id: 'supervisor',
      name: 'Feedback Forms', 
      items: menuGroups.supervisor,
      requiredPermissions: ['access_supervisor_tests', 'access_support'],
      roleSpecific: 'supervisor'
    },
    // Support section for all users
    {
      id: 'support',
      name: 'Support',
      items: [
        { name: 'Support', path: '/support', icon: getMenuIcon('Support'), permission: 'access_candidate_tests' }
      ],
      requiredPermissions: ['access_candidate_tests', 'access_supervisor_tests', 'access_user_management']
    }
  ];

  // Function to check if user has permission for an item
  const hasPermissionForItem = useCallback((item) => {
    // Admin has access to everything
    if (user?.role_id === 1) return true;
    
    // If no permission is specified, allow access
    if (!item.permission) return true;
    
    return userRole && userRole[item.permission] === true;
  }, [user, userRole]);

  // Function to check if user has permission to see a menu section
  const hasPermissionForSection = useCallback((section) => {
    // Admin has access to everything except role-specific sections
    if (user?.role_id === 1) {
      // Keep admin interface clean by not showing role-specific sections
      if (section.roleSpecific) {
        return false;
      }
      return true;
    }
    
    // Check if this is a role-specific section that should only be shown to specific roles
    if (section.roleSpecific) {
      if (section.roleSpecific === 'candidate' && user?.role_id !== 4) return false;
      if (section.roleSpecific === 'supervisor' && user?.role_id !== 3) return false;
    }
    
    // Without userRole data, no permissions can be granted
    if (!userRole) return false;
    
    // Check if the user has ANY of the required permissions for this section
    return section.requiredPermissions.some(permission => 
      userRole[permission] === true
    );
  }, [user, userRole]);

  // Render desktop navigation menu
  const renderDesktopNav = () => {
    return (
      <Stack direction="row" spacing={0.5}>
        {mainNavItems
          .filter(item => hasPermissionForSection(item))
          .map((navItem) => {
            // Check if this section has any items the user can access
            const hasPermittedItems = navItem.items.some(item => {
              if (item.children) {
                return item.children.some(child => hasPermissionForItem(child));
              }
              return hasPermissionForItem(item);
            });
            
            // Skip rendering this section if user has no permitted items
            if (!hasPermittedItems) return null;
            
            const active = navItem.items.some(item => {
              if (item.path && hasPermissionForItem(item)) return isActive(item.path);
              if (item.children) {
                return item.children.some(child => 
                  hasPermissionForItem(child) && isActive(child.path)
                );
              }
              return false;
            });
            
            // Determine if this is a role-specific section for styling
            const isRoleSpecific = Boolean(navItem.roleSpecific);
            
            return (
              <NavItemWrapper key={navItem.id}>
                <NavButton
                  active={active ? 1 : 0}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={isRoleSpecific ? {
                    background: theme => active 
                      ? alpha(theme.palette.secondary.main, 0.2) 
                      : 'transparent',
                    fontWeight: 600,
                  } : {}}
                >
                  {navItem.name}
                </NavButton>
                
                <NavDropdown className="nav-dropdown">
                  <List sx={{ p: 0 }}>
                    {navItem.items.map((item, idx) => {
                      if (item.children) {
                        // Filter children by permission
                        const permittedChildren = item.children.filter(
                          child => hasPermissionForItem(child)
                        );
                        
                        // Skip if no children are permitted
                        if (permittedChildren.length === 0) return null;
                        
                        return (
                          <Box key={`${navItem.id}-${idx}`}>
                            <MenuItem sx={{ 
                              color: theme.palette.text.secondary, 
                              fontWeight: 'medium',
                              pointerEvents: 'none',
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                              py: 1.5,
                            }}>
                              <ListItemText 
                                primary={item.name} 
                                primaryTypographyProps={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                }}
                              />
                            </MenuItem>
                            <Divider />
                            {permittedChildren.map((child, childIdx) => (
                              <MenuItem 
                                key={`${navItem.id}-${idx}-${childIdx}`} 
                                component={Link} 
                                to={child.path}
                                selected={isActive(child.path)}
                                sx={{ 
                                  pl: 3,
                                  py: 1.5,
                                  transition: theme.transitions.create('background-color', {
                                    duration: theme.transitions.duration.shortest,
                                  }),
                                  '&.Mui-selected': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                    }
                                  },
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.action.hover, 0.8),
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
                                  {child.icon}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={child.name} 
                                  primaryTypographyProps={{
                                    fontWeight: isActive(child.path) ? 600 : 400,
                                  }}
                                />
                              </MenuItem>
                            ))}
                            {idx < navItem.items.length - 1 && <Divider sx={{ my: 0.5 }} />}
                          </Box>
                        );
    } else {
                        // Skip items without permission
                        if (!hasPermissionForItem(item)) return null;
                        
                        return (
                          <MenuItem 
                            key={`${navItem.id}-${idx}`} 
                            component={Link} 
                            to={item.path}
                            selected={isActive(item.path)}
                            sx={{ 
                              py: 1.5,
                              transition: theme.transitions.create('background-color', {
                                duration: theme.transitions.duration.shortest,
                              }),
                              '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                }
                              },
                            }}
                          >
                            <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.name} 
                              primaryTypographyProps={{
                                fontWeight: isActive(item.path) ? 600 : 400,
                              }}
                            />
                          </MenuItem>
                        );
                      }
                    }).filter(Boolean)}
                  </List>
                </NavDropdown>
              </NavItemWrapper>
            );
          }).filter(Boolean)}
      </Stack>
    );
  };

  // Render mobile navigation
  const renderMobileNav = () => {
  return (
      <>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setMobileNavOpen(true)}
          sx={{
            marginRight: 2,
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <LogoContainer sx={{ flexGrow: 1 }}>
          <StyledLogo
            variant="h6" 
            component={Link} 
            to="/"
          >
            <Box component="span" sx={{ color: theme.palette.secondary.main, mr: 0.5 }}>NPI</Box>
            Admin
          </StyledLogo>
        </LogoContainer>
        
        <Drawer
          anchor="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          PaperProps={{
            sx: { 
              width: 280,
              backgroundColor: '#111827',
              color: 'white',
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
              justifyContent: 'space-between',
            p: 2,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
              <StyledLogo
                variant="h6" 
                component={Link} 
                to="/"
                onClick={() => setMobileNavOpen(false)}
                sx={{ color: 'white', textDecoration: 'none' }}
              >
                <Box component="span" sx={{ color: theme.palette.secondary.main, mr: 0.5 }}>NPI</Box>
                Admin
              </StyledLogo>
              <IconButton 
                onClick={() => setMobileNavOpen(false)}
                sx={{ color: 'white' }}
            >
              <CloseIcon />
              </IconButton>
          </Box>
          
          <Box sx={{ 
            overflowY: 'auto', 
            height: '100%',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.common.white, 0.2),
              borderRadius: 6,
            },
          }}>
            <List>
              {mainNavItems
                .filter(item => hasPermissionForSection(item))
                .map((navItem) => {
                  // Check if this section has any items the user can access
                  const hasPermittedItems = navItem.items.some(item => {
                    if (item.children) {
                      return item.children.some(child => hasPermissionForItem(child));
                    }
                    return hasPermissionForItem(item);
                  });
                  
                  // Skip rendering this section if user has no permitted items
                  if (!hasPermittedItems) return null;
                  
                  // Replace useState with reading from the state object
                  const isOpen = Boolean(mobileNavExpanded[navItem.id]);
                  
                  return (
                    <Box key={navItem.id}>
                      <ListItemButton 
                        onClick={() => setMobileNavExpanded({
                          ...mobileNavExpanded,
                          [navItem.id]: !isOpen
                        })}
                        sx={{ 
                          color: 'white',
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                          }
                        }}
                      >
                        <ListItemText primary={navItem.name} />
                        {isOpen ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {navItem.items.map((item, idx) => {
                            if (item.children) {
                              // Filter children by permission
                              const permittedChildren = item.children.filter(
                                child => hasPermissionForItem(child)
                              );
                              
                              // Skip if no children are permitted
                              if (permittedChildren.length === 0) return null;
                              
                              // Get expanded state for this submenu
                              const isSubmenuOpen = Boolean(expandedMenus[item.name]);
                              
                              return (
                                <Box key={`mobile-${navItem.id}-${idx}`}>
                                  <ListItemButton
                                    sx={{ 
                                      pl: 4, 
                                      color: 'rgba(255,255,255,0.7)',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                      }
                                    }}
                                    onClick={() => setExpandedMenus({
                                      ...expandedMenus,
                                      [item.name]: !isSubmenuOpen
                                    })}
                                  >
                                    <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.7)' }}>
                                      <FolderIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={item.name} />
                                    {isSubmenuOpen ? <ExpandLess /> : <ExpandMore />}
                                  </ListItemButton>
                                  
                                  <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                      {permittedChildren.map((child, childIdx) => (
                                    <ListItemButton
                                          key={`mobile-${navItem.id}-${idx}-${childIdx}`}
                                      component={Link}
                                      to={child.path}
                                          onClick={() => setMobileNavOpen(false)}
                                      sx={{ 
                                        pl: 6,
                                            color: 'rgba(255,255,255,0.7)',
                                            backgroundColor: isActive(child.path) ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            '&:hover': {
                                              backgroundColor: 'rgba(255,255,255,0.05)',
                                            }
                                      }}
                                    >
                                          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.7)' }}>
                                        {child.icon}
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={child.name} 
                                            primaryTypographyProps={{
                                              fontSize: '0.875rem',
                                            }}
                                      />
                                    </ListItemButton>
                                  ))}
                                    </List>
                                  </Collapse>
                                </Box>
                              );
                            } else {
                              // Skip items without permission
                              if (!hasPermissionForItem(item)) return null;
                              
                              return (
                                <ListItemButton
                                  key={`mobile-${navItem.id}-${idx}`}
                                  component={Link}
                  to={item.path}
                                  onClick={() => setMobileNavOpen(false)}
                                  sx={{ 
                                    pl: 4,
                                    color: 'rgba(255,255,255,0.7)',
                                    backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255,255,255,0.05)',
                                    }
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.7)' }}>
                                    {item.icon}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={item.name} 
                                    primaryTypographyProps={{
                                      fontSize: '0.875rem',
                                    }}
                                  />
                                </ListItemButton>
                              );
                            }
                          }).filter(Boolean)}
                        </List>
                      </Collapse>
                    </Box>
                  );
                }).filter(Boolean)}
            </List>
          </Box>
          </Box>
        </Drawer>
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <StyledAppBar>
        <Toolbar sx={{ height: 64, px: { xs: 2, md: 3 } }}>
          {/* Logo for desktop */}
          {!isMobile && (
            <LogoContainer>
              <StyledLogo
                variant="h6" 
                component={Link} 
                to="/"
              >
                <Box component="span" sx={{ color: theme.palette.secondary.main, mr: 0.5 }}>NPI</Box>
                Admin
              </StyledLogo>
            </LogoContainer>
          )}
          
          {/* Mobile navigation toggle */}
          {isMobile ? renderMobileNav() : renderDesktopNav()}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Notifications */}
          <Tooltip 
            title="Notifications" 
            arrow
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 300 }}
          >
            <HeaderIconButton
              onClick={handleNotificationClick}
              sx={{ mx: 1 }}
            >
              <StyledBadge badgeContent={unreadCount} color="secondary" max={9}>
                <NotificationsIcon />
              </StyledBadge>
            </HeaderIconButton>
          </Tooltip>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Profile Menu */}
          <Tooltip 
            title="Account settings" 
            arrow
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 300 }}
          >
            <HeaderIconButton
              onClick={handleProfileMenuOpen}
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              sx={{ ml: 2 }}
            >
              <Avatar sx={{ 
                width: 36, 
                height: 36, 
                backgroundColor: theme.palette.secondary.main,
                border: `2px solid ${alpha(theme.palette.common.white, 0.5)}`,
                fontWeight: 'bold',
                fontSize: '1rem',
              }}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </HeaderIconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 5,
              sx: { 
                minWidth: 220,
                mt: 0.5,
                overflow: 'visible',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              }
            }}
            TransitionComponent={Fade}
            transitionDuration={150}
          >
            <Box sx={{ 
              px: 2, 
              py: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.username || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem 
              onClick={handleProfileClick}
              sx={{
                py: 1.5,
                transition: theme.transitions.create('background-color', {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem 
              onClick={handleProfileMenuClose}
              sx={{
                py: 1.5,
                transition: theme.transitions.create('background-color', {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                transition: theme.transitions.create('background-color', {
                  duration: theme.transitions.duration.shortest,
                }),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.light, 0.1),
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{
                  color: theme.palette.error.main,
                }}
              />
            </MenuItem>
          </Menu>
          
          {/* Notifications Popover */}
          <Popover
            open={Boolean(notificationAnchorEl)}
            anchorEl={notificationAnchorEl}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              elevation: 5,
              sx: {
                overflow: 'visible',
                mt: 1.5,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              }
            }}
            TransitionComponent={Fade}
            transitionDuration={200}
          >
            <Paper sx={{ width: 320, maxHeight: 400 }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              }}>
                <Typography variant="h6" fontWeight={600}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Button 
                    size="small" 
                    onClick={handleMarkAllAsRead}
                    variant="text"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Mark all as read
                  </Button>
                )}
              </Box>
              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      read={notification.read}
                      onClick={() => handleNotificationRead(notification.id)}
                    >
                      <Typography variant="subtitle2" fontWeight={notification.read ? 400 : 600}>
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 1, 
                          display: 'block',
                          fontStyle: 'italic',
                        }}
                      >
                        {notification.time}
                      </Typography>
                    </NotificationItem>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No notifications
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ 
                p: 1.5, 
                display: 'flex',
                justifyContent: 'center',
                borderTop: `1px solid ${theme.palette.divider}`
              }}>
                <Button 
                  size="small" 
                  onClick={handleNotificationClose}
                  fullWidth
                  variant="text"
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  View all notifications
                </Button>
              </Box>
            </Paper>
          </Popover>
        </Toolbar>
      </StyledAppBar>
      
      {/* Main Content */}
      <ContentContainer>
        {/* Breadcrumbs */}
        {breadcrumbs && (
          <BreadcrumbContainer>
            <Breadcrumbs aria-label="breadcrumb">
              <Link 
                to="/" 
                style={{
                  textDecoration: 'none', 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              >
                Home
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <Box key={index}>
                  {index === breadcrumbs.length - 1 ? (
                    <Typography 
                      color="text.primary" 
                      fontWeight={600}
                    >
                      {crumb.label}
                    </Typography>
                  ) : (
                    <Link 
                      to={crumb.path || '#'} 
                      style={{
                        textDecoration: 'none', 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: theme.palette.primary.main,
                        }
                      }}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </Box>
              ))}
            </Breadcrumbs>
          </BreadcrumbContainer>
        )}
        
        <MainContent>
          {children}
        </MainContent>
        
        {/* Footer */}
        <Footer>
          <Typography variant="body2">
            © {new Date().getFullYear()} NUST Personality Index Admin Portal
          </Typography>
        </Footer>
      </ContentContainer>
    </Box>
  );
};

export default MainLayout; 