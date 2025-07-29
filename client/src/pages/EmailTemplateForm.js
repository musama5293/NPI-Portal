import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import PageHeader from '../components/common/PageHeader';
import emailApiService from '../services/emailApi';
import { toast } from 'react-toastify';

const EmailTemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateTypes, setTemplateTypes] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    html_content: '',
    text_content: '',
  });

  // Preview state
  const [previewDialog, setPreviewDialog] = useState({
    open: false,
    preview: null,
    variables: {}
  });

  // Send email state
  const [sendEmailDialog, setSendEmailDialog] = useState({
    open: false,
    sending: false,
    email: '',
    variables: {}
  });

  // Common variables available for all templates
  const commonVariables = [
    { name: 'candidate_name', description: 'Candidate full name', category: 'Candidate Info' },
    { name: 'candidate_email', description: 'Candidate email address', category: 'Candidate Info' },
    { name: 'organization_name', description: 'Organization name', category: 'Organization' },
    { name: 'test_name', description: 'Test/Assessment name', category: 'Test Info' },
    { name: 'test_date', description: 'Test scheduled date', category: 'Test Info' },
    { name: 'score', description: 'Test score achieved', category: 'Results' },
    { name: 'percentage', description: 'Percentage scored', category: 'Results' },
    { name: 'max_score', description: 'Maximum possible score', category: 'Results' },
    { name: 'board_date', description: 'Board/Interview date', category: 'Board Info' },
    { name: 'board_time', description: 'Board/Interview time', category: 'Board Info' },
    { name: 'board_location', description: 'Board/Interview location', category: 'Board Info' },
    { name: 'job_title', description: 'Job position title', category: 'Job Info' },
    { name: 'department', description: 'Department name', category: 'Job Info' },
    { name: 'login_url', description: 'Portal login URL', category: 'System' },
    { name: 'username', description: 'Login username', category: 'System' },
    { name: 'password', description: 'Login password', category: 'System' }
  ];

  // Function to insert variable into content
  const insertVariable = (variableName, fieldName = 'html_content') => {
    const variable = `{{${variableName}}}`;
    const currentContent = formData[fieldName];
    const newContent = currentContent + variable;
    handleInputChange(fieldName, newContent);
    toast.success(`Added ${variableName} to ${fieldName === 'subject' ? 'subject' : 'content'}`);
  };

  // Predefined email templates for easy starting
  const emailSamples = {
    test_assignment: {
      subject: 'Test Assignment - {{test_name}} for {{candidate_name}}',
      content: `Dear {{candidate_name}},

We are pleased to inform you that you have been assigned a test for the position at {{organization_name}}.

Test Details:
- Test Name: {{test_name}}
- Scheduled Date: {{test_date}}

To access your test, please login to our portal:
- Login URL: {{login_url}}
- Username: {{username}}
- Password: {{password}}

Please make sure to complete the test by the specified deadline.

Best regards,
{{organization_name}} HR Team`
    },
    candidate_registration: {
      subject: 'Welcome to {{organization_name}} - Your Account Details',
      content: `Dear {{candidate_name}},

Welcome to {{organization_name}}! Your candidate account has been created successfully.

Your login details:
- Portal URL: {{login_url}}
- Email: {{candidate_email}}
- Username: {{username}}
- Password: {{password}}

Please login to access your dashboard and view any assigned tests or interviews.

We look forward to your participation in our recruitment process.

Best regards,
{{organization_name}} HR Team`
    },
    board_assignment: {
      subject: 'Interview Scheduled - {{job_title}} Position',
      content: `Dear {{candidate_name}},

Congratulations! You have been shortlisted for the {{job_title}} position at {{organization_name}}.

Interview Details:
- Date: {{board_date}}
- Time: {{board_time}}
- Location: {{board_location}}
- Department: {{department}}

Please arrive 15 minutes before your scheduled time and bring:
- Valid ID
- Resume copies
- Any required documents

For any queries, please contact our HR department.

Best regards,
{{organization_name}} HR Team`
    },
    result_notification: {
      subject: 'Test Results - {{test_name}}',
      content: `Dear {{candidate_name}},

Your test results for {{test_name}} are now available.

Results Summary:
- Score: {{score}} out of {{max_score}}
- Percentage: {{percentage}}%

You can view detailed results by logging into your portal at {{login_url}}.

Thank you for participating in our assessment process.

Best regards,
{{organization_name}} HR Team`
    }
  };

  // Function to load sample template
  const loadSample = (sampleKey) => {
    const sample = emailSamples[sampleKey];
    if (sample) {
      handleInputChange('subject', sample.subject);
      handleInputChange('html_content', sample.content);
      toast.success(`Loaded ${sampleKey.replace('_', ' ')} template sample`);
    }
  };

  // Function to extract variables from template content
  const extractVariablesFromContent = (content, subject = '') => {
    const combinedContent = `${subject} ${content}`;
    const variableMatches = combinedContent.match(/\{\{([^}]+)\}\}/g);
    if (!variableMatches) return [];
    
    const uniqueVariables = [...new Set(variableMatches.map(match => match.replace(/[{}]/g, '')))];
    return uniqueVariables;
  };

  const handlePreview = async () => {
    if (!id) {
      toast.error('Please save the template first to preview');
      return;
    }

    try {
      // Extract variables from current content
      const usedVariables = extractVariablesFromContent(formData.html_content, formData.subject);
      const variables = {};
      
      usedVariables.forEach(variableName => {
        variables[variableName] = getSampleValue('string', variableName);
      });

      const response = await emailApiService.previewEmailTemplate(id, variables);
      setPreviewDialog({
        open: true,
        preview: response.data.rendered,
        variables
      });
    } catch (error) {
      console.error('Error previewing template:', error);
      toast.error('Failed to preview template');
    }
  };

  const getSampleValue = (type, name) => {
    const sampleValues = {
      string: {
        candidate_name: 'John Doe',
        test_name: 'Programming Assessment',
        organization_name: 'NUST',
        subject: 'Sample Subject',
        default: 'Sample Text'
      },
      number: {
        score: 85,
        max_score: 100,
        percentage: 85,
        default: 42
      },
      date: new Date().toLocaleDateString(),
      boolean: true
    };

    if (type === 'string') {
      return sampleValues.string[name] || sampleValues.string.default;
    }
    return sampleValues[type] || sampleValues.string.default;
  };

  useEffect(() => {
    fetchTemplateTypes();
    if (isEdit) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplateTypes = async () => {
    try {
      const response = await emailApiService.getTemplateTypes();
      setTemplateTypes(response.data);
    } catch (error) {
      console.error('Error fetching template types:', error);
    }
  };

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await emailApiService.getEmailTemplate(id);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to fetch email template');
      navigate('/email-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    
    if (!formData.html_content.trim()) {
      toast.error('HTML content is required');
      return;
    }

    try {
      setSaving(true);
      
      if (isEdit) {
        await emailApiService.updateEmailTemplate(id, formData);
        toast.success('Email template updated successfully');
      } else {
        // This block is now unreachable as the form is edit-only
        // await emailApiService.createEmailTemplate(formData);
        // toast.success('Email template created successfully');
      }
      
      navigate('/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} email template`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendEmailDialog.email) {
      toast.error('Recipient email is required');
      return;
    }

    if (Object.keys(sendEmailDialog.variables || {}).length === 0) {
      toast.error('No dynamic variables to replace. Cannot send email.');
      return;
    }

    try {
      setSendEmailDialog(prev => ({ ...prev, sending: true }));
      const variables = sendEmailDialog.variables;
      const response = await emailApiService.sendEmailTemplate(id, sendEmailDialog.email, variables);
      toast.success('Email sent successfully!');
      console.log('Email sent successfully:', response.data);
      setSendEmailDialog({ open: false, sending: false, email: '', variables: {} });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
      setSendEmailDialog({ open: false, sending: false, email: '', variables: {} });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={isEdit ? 'Edit Email Template' : 'Create Email Template'}
        subtitle="Design and configure email templates for automated communications"
      />

      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Main Form */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Template Details" />
                    <Tab label="Content" />
                  </Tabs>

                  <Box sx={{ mt: 3 }}>
                    {/* Template Details Tab */}
                    {activeTab === 0 && (
                      <Grid container spacing={3}>
                        {/* Helpful Guidance Box */}
                        <Grid item xs={12}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              📋 How to Create Email Templates (Easy Steps):
                            </Typography>
                            <Box component="ol" sx={{ pl: 2, mb: 0 }}>
                              <Typography component="li" variant="body2">
                                <strong>Step 1:</strong> Fill in the template name and choose the type
                              </Typography>
                              <Typography component="li" variant="body2">
                                <strong>Step 2:</strong> Go to "Content" tab and click "Quick Start Templates" to load a ready-made template
                              </Typography>
                              <Typography component="li" variant="body2">
                                <strong>Step 3:</strong> Use the variable buttons on the right to add candidate info, test details, etc.
                              </Typography>
                              <Typography component="li" variant="body2">
                                <strong>Step 4:</strong> Preview your email and save - No coding needed! 🎉
                              </Typography>
                            </Box>
                          </Alert>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Subject Line"
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            required
                          />
                        </Grid>
                      </Grid>
                    )}

                    {/* Content Tab */}
                    {activeTab === 1 && (
                      <Grid container spacing={3}>
                        {/* Email Content Editor */}
                        <Grid item xs={12} md={8}>
                          {/* Sample Template Selector */}
                          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              🚀 Quick Start Templates
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Choose a ready-made template to get started quickly:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => loadSample('test_assignment')}
                                sx={{ textTransform: 'none' }}
                              >
                                📝 Test Assignment Email
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => loadSample('candidate_registration')}
                                sx={{ textTransform: 'none' }}
                              >
                                👋 Welcome/Registration Email
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => loadSample('board_assignment')}
                                sx={{ textTransform: 'none' }}
                              >
                                📅 Interview Schedule Email
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => loadSample('result_notification')}
                                sx={{ textTransform: 'none' }}
                              >
                                📊 Test Results Email
                              </Button>
                            </Box>
                          </Box>

                          <Typography variant="h6" gutterBottom>
                            📝 Email Content
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Write your email content below. Use the variable buttons on the right to add dynamic content.
                          </Typography>
                          <TextField
                            fullWidth
                            label="Email Content"
                            multiline
                            rows={20}
                            value={formData.html_content}
                            onChange={(e) => handleInputChange('html_content', e.target.value)}
                            required
                            helperText="Type your email content here. Click variable buttons to insert dynamic data."
                            sx={{
                              '& .MuiInputBase-root': {
                                fontFamily: 'monospace',
                                fontSize: '14px'
                              }
                            }}
                          />
                        </Grid>

                        {/* Variable Picker Sidebar */}
                        <Grid item xs={12} md={4}>
                          <Typography variant="h6" gutterBottom>
                            🏷️ Add Dynamic Content
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Click any button below to add that information to your email:
                          </Typography>
                          
                          {/* Group variables by category */}
                          {['Candidate Info', 'Test Info', 'Results', 'Board Info', 'Job Info', 'System'].map(category => {
                            const categoryVars = commonVariables.filter(v => v.category === category);
                            return (
                              <Box key={category} sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  📂 {category}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {categoryVars.map(variable => (
                                    <Button
                                      key={variable.name}
                                      variant="outlined"
                                      size="small"
                                      startIcon={<AddIcon />}
                                      onClick={() => insertVariable(variable.name)}
                                      sx={{ 
                                        justifyContent: 'flex-start',
                                        textAlign: 'left',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <Box>
                                        <Box sx={{ fontWeight: 'bold' }}>
                                          {variable.name.replace(/_/g, ' ')}
                                        </Box>
                                        <Box sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                          {variable.description}
                                        </Box>
                                      </Box>
                                    </Button>
                                  ))}
                                </Box>
                              </Box>
                            );
                          })}
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Text Content (Optional)"
                            multiline
                            rows={8}
                            value={formData.text_content}
                            onChange={(e) => handleInputChange('text_content', e.target.value)}
                            helperText="Plain text fallback content"
                          />
                        </Grid>
                      </Grid>
                    )}


                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Actions Sidebar */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Actions
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      type="submit"
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Saving...' : (isEdit ? 'Update Template' : 'Create Template')}
                    </Button>

                    {isEdit && (
                      <Button
                        variant="outlined"
                        startIcon={<PreviewIcon />}
                        onClick={handlePreview}
                        fullWidth
                      >
                        Preview Template
                      </Button>
                    )}

                    {isEdit && (
                      <Button
                        variant="outlined"
                        startIcon={<SendIcon />}
                        onClick={() => {
                          const usedVariables = extractVariablesFromContent(formData.html_content, formData.subject);
                          const variables = {};
                          usedVariables.forEach(varName => {
                            variables[varName] = '';
                          });
                          setSendEmailDialog({
                            open: true,
                            sending: false,
                            email: '',
                            variables
                          });
                        }}
                        fullWidth
                        color="primary"
                      >
                        Send Email
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      startIcon={<BackIcon />}
                      onClick={() => navigate('/email-templates')}
                      fullWidth
                    >
                      Back to List
                    </Button>
                  </Box>

                  {/* Template Type Info */}
                  {/* This section is removed as template_type is no longer a form field */}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, preview: null, variables: {} })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {previewDialog.preview && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Subject:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                {previewDialog.preview.subject}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                HTML Content:
              </Typography>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 400,
                  overflow: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: previewDialog.preview.html }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, preview: null, variables: {} })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog
        open={sendEmailDialog.open}
        onClose={() => setSendEmailDialog({ open: false, sending: false, email: '', variables: {} })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📧 Send Email</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Recipient Email"
              type="email"
              value={sendEmailDialog.email}
              onChange={(e) => setSendEmailDialog(prev => ({ ...prev, email: e.target.value }))}
              sx={{ mb: 3 }}
              required
            />

            {Object.keys(sendEmailDialog.variables || {}).length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  📝 Fill in Template Information:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This template uses the following dynamic content. Please provide the actual values:
                </Typography>
                
                {Object.entries(sendEmailDialog.variables || {}).map(([varName, value]) => (
                  <TextField
                    key={varName}
                    fullWidth
                    label={varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={value}
                    onChange={(e) => setSendEmailDialog(prev => ({
                      ...prev,
                      variables: { ...prev.variables, [varName]: e.target.value }
                    }))}
                    sx={{ mb: 2 }}
                    placeholder={`Enter ${varName.replace(/_/g, ' ')}`}
                    helperText={`This will replace {{${varName}}} in your email`}
                  />
                ))}
              </Box>
            )}

            {Object.keys(sendEmailDialog.variables || {}).length === 0 && (
              <Alert severity="info">
                This template doesn't use any dynamic variables. The email will be sent as-is.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendEmailDialog({ open: false, sending: false, email: '', variables: {} })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSendEmail}
            disabled={sendEmailDialog.sending}
            startIcon={<SendIcon />}
          >
            {sendEmailDialog.sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default EmailTemplateForm; 