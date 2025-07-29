import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress, 
  Chip, 
  Avatar, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Badge,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Work as WorkIcon,
  SupportAgent as SupportAgentIcon,
  Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Psychology as PsychologyIcon,
  EmojiEvents as TrophyIcon,
  ContactSupport as ContactSupportIcon,
  Group as GroupIcon,
  PersonOutline as PersonOutlineIcon,
  WorkOutline as WorkOutlineIcon,
  RocketLaunch as RocketIcon,
  TrendingFlat as TrendingFlatIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Navigation as NavigationIcon,
  DraftsOutlined as DraftsIcon,
  EventAvailable as EventAvailableIcon,
  PlayArrow as PlayArrowIcon,
  TaskAlt as TaskAltIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Simple StatCard component without gradients
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary', 
  change, 
  onClick,
  children,
  badge = null
}) => {
  const navigate = useNavigate();
  
  const getChangeIcon = () => {
    if (!change) return null;
    if (change.type === 'increase') return <TrendingUpIcon fontSize="small" />;
    if (change.type === 'decrease') return <TrendingDownIcon fontSize="small" />;
    return <TrendingFlatIcon fontSize="small" />;
  };

  const getChangeColor = () => {
    if (!change) return 'text.secondary';
    if (change.type === 'increase') return 'success.main';
    if (change.type === 'decrease') return 'error.main';
    return 'warning.main';
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out'
        } : {},
        position: 'relative'
      }}
      onClick={onClick}
    >
      {badge && (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          {badge}
        </Box>
      )}
      
      <CardContent sx={{ flexGrow: 1, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0.5,
                color: `${color}.main`
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 'medium'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mt: 0.5
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Avatar 
            sx={{ 
              bgcolor: `${color}.main`,
              color: 'white',
              width: 56, 
              height: 56 
            }}
          >
            {icon}
          </Avatar>
        </Box>

        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: getChangeColor() }}>
              {getChangeIcon()}
              <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                {change.value}% vs. last month
              </Typography>
            </Box>
          </Box>
        )}

        {children && (
          <Box sx={{ mt: 2 }}>
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Candidate Pipeline Card
const CandidatePipelineCard = ({ candidateJourney, monthlyChanges }) => {
  const navigate = useNavigate();
  const total = candidateJourney.totalInSystem;

  return (
    <StatCard
      title="Candidate Pipeline"
      value={total}
      subtitle="Total candidates in system"
      icon={<TimelineIcon />}
      color="primary"
      change={monthlyChanges?.candidates}
      onClick={() => navigate('/candidates')}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {candidateJourney.initial}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Initial
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              {candidateJourney.probation}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Probation
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {candidateJourney.hired}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hired
            </Typography>
          </Box>
        </Box>
      </Stack>
    </StatCard>
  );
};

// Enhanced Support Health Card with real-time features
const SupportHealthCard = ({ supportInsights, supportHealth }) => {
  const navigate = useNavigate();
  
  const hasUrgentTickets = supportInsights.urgentTickets > 0;
  const hasNewMessages = supportHealth.newMessages > 0; // Assuming this comes from backend
  
  const badge = (hasUrgentTickets || hasNewMessages) ? (
    <Badge 
      badgeContent={supportInsights.urgentTickets + (supportHealth.newMessages || 0)} 
      color="error"
      sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
    >
      <NotificationsIcon color="error" />
    </Badge>
  ) : null;

  return (
    <StatCard
      title="Support System"
      value={supportHealth.total}
      subtitle={hasNewMessages ? `${supportHealth.newMessages} new messages` : "Active support tickets"}
      icon={<ContactSupportIcon />}
      color={hasUrgentTickets ? "error" : supportInsights.ticketResolutionRate > 80 ? "success" : "warning"}
      onClick={() => navigate('/admin-support')}
      badge={badge}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Resolution Rate
          </Typography>
          <Chip 
            label={`${supportInsights.ticketResolutionRate}%`}
            size="small"
            color={supportInsights.ticketResolutionRate > 80 ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>
              {supportInsights.urgentTickets}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Urgent
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              {supportInsights.openTickets}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Open
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {supportHealth.resolved}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Resolved
            </Typography>
          </Box>
        </Box>
        
        {hasNewMessages && (
          <Box sx={{ 
            p: 1, 
            bgcolor: 'info.light', 
            borderRadius: 1, 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <MessageIcon sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
            <Typography variant="body2" color="info.dark">
              {supportHealth.newMessages} new message(s) received
            </Typography>
          </Box>
        )}
      </Stack>
    </StatCard>
  );
};

// Enhanced Board Activity Card with all statuses
const BoardActivityCard = ({ boardActivity }) => {
  const navigate = useNavigate();
  const total = boardActivity.total;

  return (
    <StatCard
      title="Evaluation Boards"
      value={total}
      subtitle="Total evaluation boards"
      icon={<GroupsIcon />}
      color="info"
      onClick={() => navigate('/boards')}
    >
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <DraftsIcon sx={{ color: 'grey.600', fontSize: 18, mr: 0.5 }} />
              <Typography variant="h6" sx={{ color: 'grey.700', fontWeight: 'bold' }}>
                {boardActivity.draft || 0}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Draft
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'warning.light', color: 'warning.dark' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <EventAvailableIcon sx={{ fontSize: 18, mr: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {boardActivity.scheduled || 0}
              </Typography>
            </Box>
            <Typography variant="caption">
              Scheduled
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'info.light', color: 'info.dark' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <PlayArrowIcon sx={{ fontSize: 18, mr: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {boardActivity.active}
              </Typography>
            </Box>
            <Typography variant="caption">
              Active
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'success.light', color: 'success.dark' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <TaskAltIcon sx={{ fontSize: 18, mr: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {boardActivity.completed}
              </Typography>
            </Box>
            <Typography variant="caption">
              Completed
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </StatCard>
  );
};

// Job Intelligence Card
const JobIntelligenceCard = ({ jobIntelligence, jobApplicationInsights }) => {
  const navigate = useNavigate();
  
  return (
    <StatCard
      title="Job Intelligence"
      value={jobIntelligence.activeJobs}
      subtitle={`${jobIntelligence.totalJobs} total job openings`}
      icon={<WorkOutlineIcon />}
      color="success"
      onClick={() => navigate('/jobs')}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Application Rate
          </Typography>
          <Chip 
            label={`${jobApplicationInsights.jobFillRate}%`}
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {jobIntelligence.totalApplicants}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Applicants
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 'bold' }}>
              {jobIntelligence.avgApplicationsPerJob}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg per Job
            </Typography>
          </Box>
        </Box>
      </Stack>
    </StatCard>
  );
};

// Enhanced Recent Activities with diverse portal activities
const RecentActivitiesCard = ({ recentActivities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_created': return <PersonAddIcon />;
      case 'candidate_registered': return <PersonOutlineIcon />;
      case 'test_assigned': return <AssignmentIcon />;
      case 'test_completed': return <CheckCircleIcon />;
      case 'board_created': return <GroupsIcon />;
      case 'support_ticket': return <SupportAgentIcon />;
      case 'job_posted': return <WorkIcon />;
      case 'status_change': return <TrendingUpIcon />;
      default: return <RocketIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_created': return 'primary';
      case 'candidate_registered': return 'success';
      case 'test_assigned': return 'info';
      case 'test_completed': return 'success';
      case 'board_created': return 'secondary';
      case 'support_ticket': return 'warning';
      case 'job_posted': return 'info';
      case 'status_change': return 'success';
      default: return 'default';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RocketIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Portal Activity Feed
          </Typography>
        </Box>
        
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {recentActivities.length > 0 ? recentActivities.slice(0, 8).map((activity, index) => (
            <React.Fragment key={activity.id || index}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getActivityColor(activity.type)}.main`,
                      width: 40, 
                      height: 40 
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(activity.time)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          )) : (
            <ListItem>
              <ListItemText
                primary="No recent activities"
                secondary="Check back later for updates"
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

// Main DashboardStats component
const DashboardStats = ({
  candidatePipeline,
  supportHealth,
  boardActivity,
  jobIntelligence,
  candidateJourney,
  supportInsights,
  jobApplicationInsights,
  monthlyChanges,
  candidatesByGender,
  recentActivities,
  loading = false
}) => {
  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Top Row - Main Comprehensive Metrics */}
      <Grid item xs={12} sm={6} lg={3}>
        <CandidatePipelineCard 
          candidateJourney={candidateJourney} 
          monthlyChanges={monthlyChanges}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} lg={3}>
        <SupportHealthCard 
          supportInsights={supportInsights} 
          supportHealth={supportHealth}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} lg={3}>
        <BoardActivityCard boardActivity={boardActivity} />
      </Grid>
      
      <Grid item xs={12} sm={6} lg={3}>
        <JobIntelligenceCard 
          jobIntelligence={jobIntelligence} 
          jobApplicationInsights={jobApplicationInsights}
        />
      </Grid>

      {/* Bottom Row - Gender Distribution and Activities */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              Candidate Demographics
            </Typography>
            
            <Stack spacing={2} sx={{ mt: 2 }}>
              {Object.entries(candidatesByGender || {}).map(([gender, count]) => {
                const total = Object.values(candidatesByGender || {}).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <Box key={gender}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{gender}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {count} ({Math.round(percentage)}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': { 
                          bgcolor: gender === 'Male' ? 'primary.main' : 
                                  gender === 'Female' ? 'secondary.main' : 'info.main'
                        }
                      }} 
                    />
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <RecentActivitiesCard recentActivities={recentActivities} />
      </Grid>
    </Grid>
  );
};

export default DashboardStats; 