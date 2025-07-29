import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import emailApiService from '../services/emailApi';
import { toast } from 'react-toastify';

const EmailLogsList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    template_type: '',
    email_status: '',
    recipient_email: '',
    date_from: null,
    date_to: null
  });

  // Dialogs
  const [detailsDialog, setDetailsDialog] = useState({ open: false, log: null });
  const [resendDialog, setResendDialog] = useState({ open: false, log: null });

  const statusColors = {
    sent: 'success',
    failed: 'error',
    pending: 'warning',
    delivered: 'primary',
    bounced: 'error',
    opened: 'info'
  };

  const templateTypes = [
    'candidate_registration',
    'test_assignment',
    'test_completion',
    'board_assignment',
    'result_notification',
    'hiring_confirmation',
    'rejection_notification',
    'reminder'
  ];

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => {
            if (key === 'date_from' || key === 'date_to') {
              return value !== null;
            }
            return value !== '';
          })
        )
      };

      // Format dates
      if (params.date_from) {
        params.date_from = params.date_from.toISOString().split('T')[0];
      }
      if (params.date_to) {
        params.date_to = params.date_to.toISOString().split('T')[0];
      }

      const response = await emailApiService.getEmailLogs(params);
      setLogs(response.data);
      setTotal(response.pagination.total);
      setError(null);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      setError(error.message);
      toast.error('Failed to fetch email logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      template_type: '',
      email_status: '',
      recipient_email: '',
      date_from: null,
      date_to: null
    });
    setPage(0);
  };

  const handleViewDetails = async (log) => {
    try {
      const response = await emailApiService.getEmailLogDetails(log._id);
      setDetailsDialog({ open: true, log: response.data });
    } catch (error) {
      console.error('Error fetching log details:', error);
      toast.error('Failed to fetch email details');
    }
  };

  const handleResendEmail = async () => {
    try {
      await emailApiService.resendEmail(resendDialog.log._id);
      toast.success('Email resent successfully');
      setResendDialog({ open: false, log: null });
      fetchLogs();
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend email');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

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
        title="Email Logs"
        subtitle="View email history and delivery status"
      />

      <Box sx={{ p: 3 }}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                <Typography>Filters</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Template Type</InputLabel>
                    <Select
                      value={filters.template_type}
                      label="Template Type"
                      onChange={(e) => handleFilterChange('template_type', e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {templateTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.email_status}
                      label="Status"
                      onChange={(e) => handleFilterChange('email_status', e.target.value)}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                      <MenuItem value="bounced">Bounced</MenuItem>
                      <MenuItem value="opened">Opened</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Recipient Email"
                    value={filters.recipient_email}
                    onChange={(e) => handleFilterChange('recipient_email', e.target.value)}
                    placeholder="Search by email..."
                  />
                </Grid>

                <Grid item xs={12} md={1.5}>
                  <DatePicker
                    label="From Date"
                    value={filters.date_from}
                    onChange={(date) => handleFilterChange('date_from', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={1.5}>
                  <DatePicker
                    label="To Date"
                    value={filters.date_to}
                    onChange={(date) => handleFilterChange('date_to', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleApplyFilters}
                      disabled={loading}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchLogs}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Email Logs Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Template Type</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent Date</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No email logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {log.recipient_email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.recipient_type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.template_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {log.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(log.email_status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(log.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.delivery_attempts}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(log)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {log.email_status === 'failed' && (
                            <Tooltip title="Resend Email">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setResendDialog({ open: true, log })}
                              >
                                <SendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </Card>
      </Box>

      {/* Email Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Email Details</DialogTitle>
        <DialogContent>
          {detailsDialog.log && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Recipient:</Typography>
                <Typography variant="body2" gutterBottom>
                  {detailsDialog.log.recipient_email}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Status:</Typography>
                {getStatusChip(detailsDialog.log.email_status)}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2">Subject:</Typography>
                <Typography variant="body2" gutterBottom>
                  {detailsDialog.log.subject}
                </Typography>
              </Grid>

              {detailsDialog.log.message_id && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Message ID:</Typography>
                  <Typography variant="body2" gutterBottom fontFamily="monospace">
                    {detailsDialog.log.message_id}
                  </Typography>
                </Grid>
              )}

              {detailsDialog.log.error_message && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Error Message:</Typography>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {detailsDialog.log.error_message}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Created:</Typography>
                <Typography variant="body2">
                  {formatDate(detailsDialog.log.created_at)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Delivery Attempts:</Typography>
                <Typography variant="body2">
                  {detailsDialog.log.delivery_attempts}
                </Typography>
              </Grid>

              {Object.keys(detailsDialog.log.variables_used || {}).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Variables Used:</Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      overflow: 'auto'
                    }}
                  >
                    {JSON.stringify(detailsDialog.log.variables_used, null, 2)}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, log: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resend Email Dialog */}
      <Dialog
        open={resendDialog.open}
        onClose={() => setResendDialog({ open: false, log: null })}
      >
        <DialogTitle>Resend Email</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to resend this email to{' '}
            <strong>{resendDialog.log?.recipient_email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResendDialog({ open: false, log: null })}>
            Cancel
          </Button>
          <Button onClick={handleResendEmail} variant="contained">
            Resend
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default EmailLogsList; 