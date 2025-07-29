import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import emailApiService from '../services/emailApi';
import { toast } from 'react-toastify';

const EmailDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [error, setError] = useState(null);
  const [testConfigDialog, setTestConfigDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0'];

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await emailApiService.getEmailStats({
        date_from: getDateFromTimeframe(timeframe)
      });
      setStats(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching email stats:', error);
      setError(error.message);
      toast.error('Failed to fetch email statistics');
    } finally {
      setLoading(false);
    }
  };

  const getDateFromTimeframe = (timeframe) => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const daysBack = days[timeframe] || 30;
    const date = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    return date.toISOString().split('T')[0];
  };

  const handleTestConfig = async () => {
    try {
      await emailApiService.testEmailConfig(testEmail);
      toast.success('Email configuration test passed!');
      setTestConfigDialog(false);
      setTestEmail('');
    } catch (error) {
      console.error('Error testing email config:', error);
      toast.error('Email configuration test failed');
    }
  };

  const StatCard = ({ title, value, icon, color, percentage }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}
            </Typography>
            {percentage !== undefined && (
              <Typography variant="body2" color="textSecondary">
                {percentage.toFixed(1)}% of total
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Email Management Dashboard"
        subtitle="Monitor email delivery and performance"
      />

      <Box sx={{ p: 3 }}>
        {/* Controls */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchStats}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setTestConfigDialog(true)}
          >
            Test Config
          </Button>
        </Box>

        {stats && (
          <>
            {/* Overview Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Emails"
                  value={stats.overview.total}
                  icon={<EmailIcon />}
                  color="#2196f3"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Successfully Sent"
                  value={stats.overview.sent}
                  icon={<SuccessIcon />}
                  color="#4caf50"
                  percentage={(stats.overview.sent / stats.overview.total) * 100}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Failed"
                  value={stats.overview.failed}
                  icon={<ErrorIcon />}
                  color="#f44336"
                  percentage={(stats.overview.failed / stats.overview.total) * 100}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Delivered"
                  value={stats.overview.delivered}
                  icon={<SuccessIcon />}
                  color="#4caf50"
                  percentage={(stats.overview.delivered / stats.overview.total) * 100}
                />
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
              {/* Template Breakdown */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Email Types Breakdown
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.templateBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="_id" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [value, name === 'count' ? 'Total' : name]}
                          labelFormatter={(label) => label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                        <Legend />
                        <Bar dataKey="count" fill="#2196f3" name="Total" />
                        <Bar dataKey="sent" fill="#4caf50" name="Sent" />
                        <Bar dataKey="failed" fill="#f44336" name="Failed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Status Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Email Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Sent', value: stats.overview.sent },
                            { name: 'Failed', value: stats.overview.failed },
                            { name: 'Pending', value: stats.overview.pending },
                            { name: 'Delivered', value: stats.overview.delivered },
                            { name: 'Opened', value: stats.overview.opened }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Sent', value: stats.overview.sent },
                            { name: 'Failed', value: stats.overview.failed },
                            { name: 'Pending', value: stats.overview.pending },
                            { name: 'Delivered', value: stats.overview.delivered },
                            { name: 'Opened', value: stats.overview.opened }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Daily Trends */}
              {stats.dailyTrends && stats.dailyTrends.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Daily Email Trends
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.dailyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total" stroke="#2196f3" name="Total" />
                          <Line type="monotone" dataKey="sent" stroke="#4caf50" name="Sent" />
                          <Line type="monotone" dataKey="failed" stroke="#f44336" name="Failed" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Quick Actions */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        href="/email-templates"
                      >
                        Manage Templates
                      </Button>
                      <Button
                        variant="contained"
                        href="/email-logs"
                      >
                        View Email Logs
                      </Button>
                      <Button
                        variant="outlined"
                        href="/email-templates/new"
                      >
                        Create Template
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      {/* Test Configuration Dialog */}
      <Dialog open={testConfigDialog} onClose={() => setTestConfigDialog(false)}>
        <DialogTitle>Test Email Configuration</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Send a test email to verify your email configuration is working correctly.
          </Typography>
          <TextField
            fullWidth
            label="Test Email Address"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            margin="normal"
            placeholder="admin@example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestConfigDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTestConfig}
            variant="contained"
            disabled={!testEmail.trim()}
          >
            Send Test
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default EmailDashboard; 