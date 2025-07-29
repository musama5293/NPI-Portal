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
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  Add as AddIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import emailApiService from '../services/emailApi';
import { toast } from 'react-toastify';

const EmailTemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [templateTypes, setTemplateTypes] = useState([]);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, template: null });
  const [duplicateDialog, setDuplicateDialog] = useState({ open: false, template: null, newName: '' });
  const [testEmailDialog, setTestEmailDialog] = useState({ open: false, template: null, email: '', variables: {} });

  // Function to extract variables from template content
  const extractVariablesFromTemplate = (template) => {
    if (!template) return [];
    
    const content = `${template.subject} ${template.html_content}`;
    const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
    
    if (!variableMatches) return [];
    
    const uniqueVariables = [...new Set(variableMatches.map(match => match.replace(/[{}]/g, '')))];
    return uniqueVariables;
  };

  useEffect(() => {
    fetchTemplates();
    fetchTemplateTypes();
  }, [page, rowsPerPage, filterType, filterStatus]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(filterType && { template_type: filterType }),
        ...(filterStatus !== '' && { is_active: filterStatus })
      };

      const response = await emailApiService.getEmailTemplates(params);
      setTemplates(response.data);
      setTotal(response.pagination.total);
      setError(null);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(error.message);
      toast.error('Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateTypes = async () => {
    try {
      const response = await emailApiService.getTemplateTypes();
      setTemplateTypes(response.data);
    } catch (error) {
      console.error('Error fetching template types:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await emailApiService.deleteEmailTemplate(deleteDialog.template._id);
      toast.success('Email template deleted successfully');
      setDeleteDialog({ open: false, template: null });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete email template');
    }
  };

  const handleDuplicate = async () => {
    try {
      await emailApiService.duplicateEmailTemplate(
        duplicateDialog.template._id,
        duplicateDialog.newName
      );
      toast.success('Email template duplicated successfully');
      setDuplicateDialog({ open: false, template: null, newName: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate email template');
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const variables = testEmailDialog.variables || {};
      await emailApiService.sendTestEmail(
        testEmailDialog.template._id,
        testEmailDialog.email,
        variables
      );
      toast.success('Email sent successfully');
      setTestEmailDialog({ open: false, template: null, email: '', variables: {} });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await emailApiService.createDefaultTemplates();
      toast.success('Default email templates created successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
      toast.error('Failed to create default templates');
    }
  };

  const getStatusChip = (isActive, isDefault) => {
    if (isDefault) {
      return <Chip label="Default" color="primary" size="small" />;
    }
    return (
      <Chip
        label={isActive ? 'Active' : 'Inactive'}
        color={isActive ? 'success' : 'default'}
        size="small"
      />
    );
  };

  const getTypeLabel = (type) => {
    const typeData = templateTypes.find(t => t.value === type);
    return typeData ? typeData.label : type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Remove Add, Delete, and Duplicate logic, dialogs, and buttons
  // Only show templates with template_type in ['test_assignment', 'probation_feedback_assignment', 'reminder', 'probation_reassignment']
  const ALLOWED_TEMPLATE_TYPES = [
    'test_assignment',
    'probation_feedback_assignment',
    'reminder',
    'probation_reassignment'
  ];

  const filteredTemplates = templates.filter(t => ALLOWED_TEMPLATE_TYPES.includes(t.template_type));

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
        title="Email Templates"
        subtitle="Manage email templates for automated communications"
      />

      <Box sx={{ p: 3 }}>
        {/* Filters and Actions */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Template Type</InputLabel>
            <Select
              value={filterType}
              label="Template Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {templateTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCreateDefaults}
          >
            Create Defaults
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            href="/email-templates/new"
          >
            Add Template
          </Button>
        </Box>

        {/* Templates Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Template Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No email templates found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {template.template_name}
                          </Typography>
                          {template.organization_id && (
                            <Typography variant="caption" color="text.secondary">
                              Org-specific
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getTypeLabel(template.template_type)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {template.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(template.is_active, template.is_default)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(template.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View/Edit">
                            <IconButton
                              size="small"
                              href={`/email-templates/${template._id}/edit`}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Send Email">
                            <IconButton
                              size="small"
                              onClick={() => setTestEmailDialog({
                                open: true,
                                template,
                                email: '',
                                variables: {}
                              })}
                            >
                              <SendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Duplicate">
                            <IconButton
                              size="small"
                              onClick={() => setDuplicateDialog({
                                open: true,
                                template,
                                newName: `${template.template_name} (Copy)`
                              })}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, template })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, template: null })}>
        <DialogTitle>Delete Email Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the template "{deleteDialog.template?.template_name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, template: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Template Dialog */}
      <Dialog open={duplicateDialog.open} onClose={() => setDuplicateDialog({ open: false, template: null, newName: '' })}>
        <DialogTitle>Duplicate Email Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Template Name"
            value={duplicateDialog.newName}
            onChange={(e) => setDuplicateDialog(prev => ({ ...prev, newName: e.target.value }))}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog({ open: false, template: null, newName: '' })}>
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            variant="contained"
            disabled={!duplicateDialog.newName.trim()}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog - User Friendly Version */}
      <Dialog open={testEmailDialog.open} onClose={() => setTestEmailDialog({ open: false, template: null, email: '', variables: {} })}>
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={testEmailDialog.email}
            onChange={(e) => setTestEmailDialog(prev => ({ ...prev, email: e.target.value }))}
            margin="normal"
            required
          />
          
          {/* Individual Variable Fields - No JSON needed! */}
          {testEmailDialog.template && extractVariablesFromTemplate(testEmailDialog.template).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Typography variant="subtitle2" gutterBottom style={{ marginTop: '16px', marginBottom: '8px' }}>
                📝 Fill in the following information for your email:
              </Typography>
              {extractVariablesFromTemplate(testEmailDialog.template).map((variableName) => (
                <TextField
                  key={variableName}
                  fullWidth
                  label={variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={testEmailDialog.variables[variableName] || ''}
                  onChange={(e) => setTestEmailDialog(prev => ({
                    ...prev,
                    variables: {
                      ...prev.variables,
                      [variableName]: e.target.value
                    }
                  }))}
                  margin="normal"
                  placeholder={`Enter ${variableName.replace(/_/g, ' ')}`}
                  helperText={`This will replace {{${variableName}}} in your email`}
                />
              ))}
            </div>
          )}
          
          {testEmailDialog.template && extractVariablesFromTemplate(testEmailDialog.template).length === 0 && (
            <Typography variant="body2" color="text.secondary" style={{ marginTop: '16px' }}>
              ✅ This template has no variables to fill in. Just enter the email address and send!
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestEmailDialog({ open: false, template: null, email: '', variables: {} })}>
            Cancel
          </Button>
          <Button
            onClick={handleSendTestEmail}
            variant="contained"
            disabled={!testEmailDialog.email.trim()}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default EmailTemplateList; 