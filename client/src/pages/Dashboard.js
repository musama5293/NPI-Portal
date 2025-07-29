import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Alert, AlertTitle, CircularProgress, Paper, Tabs, Tab } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DashboardStats from '../components/common/DashboardStats';
import { useAuth } from '../context/AuthContext';
import dashboardApi from '../services/dashboardApi';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recruitmentData, setRecruitmentData] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard stats...');
        const statsResponse = await dashboardApi.getDashboardStats();
        console.log('Stats received:', statsResponse);
        setStatsData(statsResponse.data);

        console.log('Fetching recent activities...');
        const activitiesResponse = await dashboardApi.getRecentActivities();
        console.log('Activities received:', activitiesResponse);
        setRecentActivities(activitiesResponse.data);

        console.log('Fetching recruitment pipeline...');
        const recruitmentResponse = await dashboardApi.getRecruitmentPipeline();
        console.log('Recruitment received:', recruitmentResponse);
        setRecruitmentData(recruitmentResponse.data);

        console.log('Fetching alerts...');
        const alertsResponse = await dashboardApi.getSystemAlerts();
        console.log('Alerts received:', alertsResponse);
        setAlertsData(alertsResponse.data || []);

      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError(error.message || 'Failed to load dashboard data');
        
        // Set fallback data structure to prevent crashes
        setStatsData({
          candidatesInProbation: 0,
          candidatesByGender: { Male: 0, Female: 0, Other: 0 },
          testMetrics: { totalAssignments: 0, completed: 0, pending: 0, overdue: 0 },
          monthlyChanges: {
            candidates: { value: 0, type: 'increase' },
            completedTests: { value: 0, type: 'increase' },
            users: { value: 0, type: 'increase' },
            probationCandidates: { value: 0, type: 'decrease' }
          },
          common: {
            totalUsers: 0,
            activeUsers: 0,
            totalCandidates: 0,
            activeCandidates: 0,
            totalTests: 0,
            totalBoards: 0,
            totalJobs: 0
          },
          // New comprehensive data structure
          candidatesByType: { initial: 0, probation: 0, hired: 0 },
          supportTickets: { 
            total: 0, 
            byStatus: { open: 0, in_progress: 0, resolved: 0 }, 
            byPriority: { low: 0, medium: 0, high: 0, urgent: 0 } 
          },
          jobMetrics: { 
            summary: { totalJobs: 0, activeJobs: 0, avgPositions: 0 }, 
            withApplications: [] 
          },
          boardsByType: { initial: 0, probation: 0, other: 0 },
          boardsByStatus: { draft: 0, scheduled: 0, active: 0, completed: 0 }
        });
        setRecentActivities([]);
        setRecruitmentData({ pipeline: {}, recentActivity: {} });
        setAlertsData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            {error}
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  // Process data for comprehensive dashboard cards
  const candidatePipeline = {
    initial: statsData.candidatesByType?.initial || 0,
    probation: statsData.candidatesByType?.probation || 0,
    hired: statsData.candidatesByType?.hired || 0
  };

  const supportHealth = {
    total: statsData.supportTickets?.total || 0,
    urgent: statsData.supportTickets?.byPriority?.urgent || 0,
    open: statsData.supportTickets?.byStatus?.open || 0,
    resolved: statsData.supportTickets?.byStatus?.resolved || 0
  };

  const boardActivity = {
    total: statsData.common?.totalBoards || 0,
    draft: statsData.boardsByStatus?.draft || 0,
    scheduled: statsData.boardsByStatus?.scheduled || 0,
    active: statsData.boardsByStatus?.active || 0,
    completed: statsData.boardsByStatus?.completed || 0,
    probationBoards: statsData.boardsByType?.probation || 0
  };

  const jobIntelligence = {
    totalJobs: statsData.jobMetrics?.summary?.totalJobs || 0,
    activeJobs: statsData.jobMetrics?.summary?.activeJobs || 0,
    totalApplicants: statsData.common?.totalCandidates || 0,
    avgApplicationsPerJob: statsData.jobMetrics?.summary?.totalJobs > 0 
      ? Math.round(statsData.common?.totalCandidates / statsData.jobMetrics?.summary?.totalJobs) 
      : 0
  };
  
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title={`Welcome back, ${user?.profile?.firstName || user?.username || 'User'}!`}
          subtitle="Your comprehensive NPI Portal dashboard - Get insights across all modules"
          breadcrumbs={[{ label: 'Dashboard' }]}
        />

          <DashboardStats
          // Main comprehensive metrics
          candidatePipeline={candidatePipeline}
          supportHealth={supportHealth}
          boardActivity={boardActivity}
          jobIntelligence={jobIntelligence}
          
          // Candidate journey tracking
          candidateJourney={{
            initial: candidatePipeline.initial,
            probation: candidatePipeline.probation,
            hired: candidatePipeline.hired,
            totalInSystem: statsData.common?.totalCandidates || 0
          }}

          // Support system insights
          supportInsights={{
            ticketResolutionRate: supportHealth.total > 0 
              ? Math.round((supportHealth.resolved / supportHealth.total) * 100) 
              : 0,
            urgentTickets: supportHealth.urgent,
            openTickets: supportHealth.open
          }}

          // Job application insights
          jobApplicationInsights={{
            jobFillRate: jobIntelligence.totalJobs > 0 
              ? Math.round((jobIntelligence.totalApplicants / (jobIntelligence.totalJobs * 5)) * 100) // Assume 5 positions per job avg
              : 0,
            topJobs: statsData.jobMetrics?.withApplications?.slice(0, 3) || []
          }}

          // Monthly changes with realistic percentages
          monthlyChanges={statsData.monthlyChanges}
          
          // Gender distribution
          candidatesByGender={statsData.candidatesByGender}
          
          // Recent activities from across the portal
          recentActivities={recentActivities}
          
          loading={loading}
        />
      </Box>
    </MainLayout>
  );
};

export default Dashboard; 