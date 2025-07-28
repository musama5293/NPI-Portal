const EmailTemplate = require('../models/email-template.model');

const defaultTemplates = [
  {
    template_name: 'Test Assignment Notification',
    template_type: 'test_assignment',
    subject: 'New Test Assigned - {{test_name}}',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Test Assignment Notification</h2>
        </div>
        
        <p>Dear {{candidate_name}},</p>
        
        <p>You have been assigned a new test: <strong>{{test_name}}</strong></p>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Test Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Test Name:</strong> {{test_name}}</li>
            <li><strong>Scheduled Date:</strong> {{scheduled_date}}</li>
            <li><strong>Due Date:</strong> {{expiry_date}}</li>
            <li><strong>Assignment ID:</strong> {{assignment_id}}</li>
          </ul>
        </div>
        
        <p>Please make sure to complete the test before the due date. You can access the test through your portal dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portal_url}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Portal</a>
        </div>
        
        <p>If you have any questions or technical issues, please contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          {{organization_name}}<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text_content: `
Dear {{candidate_name}},

You have been assigned a new test: {{test_name}}

Test Details:
- Test Name: {{test_name}}
- Scheduled Date: {{scheduled_date}}
- Due Date: {{expiry_date}}
- Assignment ID: {{assignment_id}}

Please make sure to complete the test before the due date. You can access the test through your portal dashboard at: {{portal_url}}

If you have any questions or technical issues, please contact our support team.

Best regards,
{{organization_name}}
    `,
    variables: [
      { name: 'candidate_name', description: 'Name of the candidate', type: 'string', required: true },
      { name: 'test_name', description: 'Name of the assigned test', type: 'string', required: true },
      { name: 'scheduled_date', description: 'Test scheduled date', type: 'date', required: true },
      { name: 'expiry_date', description: 'Test expiry date', type: 'date', required: true },
      { name: 'assignment_id', description: 'Test assignment ID', type: 'string', required: true },
      { name: 'portal_url', description: 'Portal URL for accessing the test', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true }
    ],
    is_default: true
  },
  {
    template_name: 'Candidate Registration Welcome',
    template_type: 'candidate_registration',
    subject: 'Welcome to {{organization_name}} - Account Created',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0;">Welcome to {{organization_name}}</h2>
        </div>
        
        <p>Dear {{candidate_name}},</p>
        
        <p>Welcome to the NPI Portal! Your account has been successfully created and you can now access the system.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Your Account Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Username:</strong> {{username}}</li>
            <li><strong>Email:</strong> {{candidate_name}}</li>
            <li><strong>Temporary Password:</strong> {{password}}</li>
            <li><strong>Registration Date:</strong> {{registration_date}}</li>
          </ul>
          <p style="color: #dc3545; font-weight: bold; margin-bottom: 0;">
            🔒 Please change your password after first login for security.
          </p>
        </div>
        
        <p>You can now log in to your account and:</p>
        <ul>
          <li>Complete assigned tests</li>
          <li>View your test results</li>
          <li>Update your profile information</li>
          <li>Track your application status</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portal_url}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Portal</a>
        </div>
        
        <p>If you need any assistance, please contact our support team at {{support_email}}.</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          {{organization_name}} Team<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text_content: `
Dear {{candidate_name}},

Welcome to the NPI Portal! Your account has been successfully created and you can now access the system.

Your Account Details:
- Username: {{username}}
- Email: {{candidate_name}}
- Temporary Password: {{password}}
- Registration Date: {{registration_date}}

🔒 Please change your password after first login for security.

You can now log in to your account and:
- Complete assigned tests
- View your test results
- Update your profile information
- Track your application status

Login to the portal at: {{portal_url}}

If you need any assistance, please contact our support team at {{support_email}}.

Best regards,
{{organization_name}} Team
    `,
    variables: [
      { name: 'candidate_name', description: 'Name of the candidate', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true },
      { name: 'username', description: 'Login username', type: 'string', required: true },
      { name: 'password', description: 'Temporary password', type: 'string', required: true },
      { name: 'registration_date', description: 'Registration date', type: 'date', required: true },
      { name: 'portal_url', description: 'Portal login URL', type: 'string', required: true },
      { name: 'support_email', description: 'Support email address', type: 'string', required: true }
    ],
    is_default: true
  },
  {
    template_name: 'Board Assignment Notification',
    template_type: 'board_assignment',
    subject: 'Board Interview Scheduled - {{board_name}}',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #17a2b8; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0;">Board Interview Scheduled</h2>
        </div>
        
        <p>Dear {{candidate_name}},</p>
        
        <p>You have been scheduled for a board interview: <strong>{{board_name}}</strong></p>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Interview Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Board Name:</strong> {{board_name}}</li>
            <li><strong>Scheduled Date:</strong> {{scheduled_date}}</li>
            <li><strong>Venue:</strong> {{venue}}</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">Important Instructions:</h4>
          <ul>
            <li>Please arrive 15 minutes before the scheduled time</li>
            <li>Bring a valid ID and any required documents</li>
            <li>Dress professionally for the interview</li>
            <li>Check your email for any updates or changes</li>
          </ul>
        </div>
        
        <p>{{contact_info}}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portal_url}}" style="background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          {{organization_name}}<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text_content: `
Dear {{candidate_name}},

You have been scheduled for a board interview: {{board_name}}

Interview Details:
- Board Name: {{board_name}}
- Scheduled Date: {{scheduled_date}}
- Venue: {{venue}}

Important Instructions:
- Please arrive 15 minutes before the scheduled time
- Bring a valid ID and any required documents
- Dress professionally for the interview
- Check your email for any updates or changes

{{contact_info}}

View details in the portal at: {{portal_url}}

Best regards,
{{organization_name}}
    `,
    variables: [
      { name: 'candidate_name', description: 'Name of the candidate', type: 'string', required: true },
      { name: 'board_name', description: 'Name of the board/interview', type: 'string', required: true },
      { name: 'scheduled_date', description: 'Interview scheduled date', type: 'date', required: true },
      { name: 'venue', description: 'Interview venue/location', type: 'string', required: true },
      { name: 'contact_info', description: 'Contact information for queries', type: 'string', required: true },
      { name: 'portal_url', description: 'Portal URL for more details', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true }
    ],
    is_default: true
  },
  {
    template_name: 'Test Result Notification',
    template_type: 'result_notification',
    subject: 'Test Results Available - {{test_name}}',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #6f42c1; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0;">Test Results Available</h2>
        </div>
        
        <p>Dear {{candidate_name}},</p>
        
        <p>Your test results for <strong>{{test_name}}</strong> are now available.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #495057;">Your Score</h3>
          <div style="font-size: 36px; font-weight: bold; color: #6f42c1; margin: 10px 0;">
            {{score}}/{{max_score}}
          </div>
          <div style="font-size: 24px; color: #28a745;">
            {{percentage}}%
          </div>
          <div style="margin-top: 15px; padding: 10px; border-radius: 5px; display: inline-block; 
                      background-color: {{result_status === 'passed' ? '#d4edda' : '#f8d7da'}}; 
                      color: {{result_status === 'passed' ? '#155724' : '#721c24'}};">
            <strong>Status: {{result_status}}</strong>
          </div>
        </div>
        
        <p>You can view your detailed results and analysis in your portal dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portal_url}}" style="background-color: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Detailed Results</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          {{organization_name}}<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    text_content: `
Dear {{candidate_name}},

Your test results for {{test_name}} are now available.

Your Score: {{score}}/{{max_score}} ({{percentage}}%)
Status: {{result_status}}

You can view your detailed results and analysis in your portal dashboard at: {{portal_url}}

Best regards,
{{organization_name}}
    `,
    variables: [
      { name: 'candidate_name', description: 'Name of the candidate', type: 'string', required: true },
      { name: 'test_name', description: 'Name of the test', type: 'string', required: true },
      { name: 'score', description: 'Test score obtained', type: 'number', required: true },
      { name: 'max_score', description: 'Maximum possible score', type: 'number', required: true },
      { name: 'percentage', description: 'Percentage score', type: 'number', required: true },
      { name: 'result_status', description: 'Pass/Fail status', type: 'string', required: true },
      { name: 'portal_url', description: 'Portal URL for detailed results', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true }
    ],
    is_default: true
  },
  {
    template_name: 'Probation Feedback Assignment',
    template_type: 'probation_feedback_assignment',
    subject: 'Probation Feedback Form Assigned for {{candidate_name}}',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Probation Feedback Required</h2>
        <p>Dear {{supervisor_name}},</p>
        <p>A probation feedback form has been assigned for <strong>{{candidate_name}}</strong> (Position: {{candidate_position}}).</p>
        <p>Please fill out the feedback form by <strong>{{feedback_due_date}}</strong> using the link below:</p>
        <div style="margin: 20px 0;"><a href="{{feedback_form_url}}" style="background: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Fill Feedback Form</a></div>
        <p>Thank you!</p>
        <hr><small>This is an automated message from {{organization_name}}.</small>
      </div>
    `,
    text_content: `Dear {{supervisor_name}},\n\nA probation feedback form has been assigned for {{candidate_name}} (Position: {{candidate_position}}).\n\nPlease fill out the feedback form by {{feedback_due_date}} using the link: {{feedback_form_url}}\n\nThank you!\n\n- {{organization_name}}`,
    variables: [
      { name: 'supervisor_name', description: 'Name of the supervisor', type: 'string', required: true },
      { name: 'candidate_name', description: 'Name of the candidate', type: 'string', required: true },
      { name: 'candidate_position', description: 'Position of the candidate', type: 'string', required: true },
      { name: 'feedback_due_date', description: 'Feedback due date', type: 'string', required: true },
      { name: 'feedback_form_url', description: 'URL to the feedback form', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true }
    ],
    is_default: true
  },
  {
    template_name: 'Reminder Email',
    template_type: 'reminder',
    subject: 'Reminder: Pending Action for {{recipient_name}}',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reminder</h2>
        <p>Dear {{recipient_name}},</p>
        <p>This is a reminder to complete the following action: <strong>{{action_item}}</strong>.</p>
        <p>Deadline: <strong>{{due_date}}</strong></p>
        <p>Please complete it as soon as possible. If you have questions, contact support.</p>
        <hr><small>This is an automated message from {{organization_name}}.</small>
      </div>
    `,
    text_content: `Dear {{recipient_name}},\n\nThis is a reminder to complete the following action: {{action_item}}.\nDeadline: {{due_date}}\n\nPlease complete it as soon as possible.\n\n- {{organization_name}}`,
    variables: [
      { name: 'recipient_name', description: 'Name of the recipient', type: 'string', required: true },
      { name: 'action_item', description: 'Action to be completed', type: 'string', required: true },
      { name: 'due_date', description: 'Due date for the action', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true }
    ],
    is_default: true
  },
  {
    template_name: 'Probation Reassignment Notification',
    template_type: 'probation_reassignment',
    subject: 'Probation End: New Test Assigned for {{candidate_name}}',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Probation End - New Test Assigned</h2>
        <p>Dear {{candidate_name}},</p>
        <p>Your probation period is ending soon. You have been assigned a new test as part of the evaluation process.</p>
        <p>Test Name: <strong>{{test_name}}</strong></p>
        <p>Scheduled Date: <strong>{{scheduled_date}}</strong></p>
        <div style="margin: 20px 0;"><a href="{{portal_url}}" style="background: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Access Test</a></div>
        <p>Best of luck!</p>
        <hr><small>This is an automated message from {{organization_name}}.</small>
      </div>
    `,
    text_content: `Dear {{candidate_name}},\n\nYour probation period is ending soon. You have been assigned a new test: {{test_name}}.\nScheduled Date: {{scheduled_date}}\n\nPlease log in to the portal to access your test: {{portal_url}}\n\nBest of luck!\n\n- {{organization_name}}`,
    variables: [
      { name: 'candidate_name', description: 'Name of the candidate', type: 'string', required: true },
      { name: 'test_name', description: 'Name of the new test', type: 'string', required: true },
      { name: 'scheduled_date', description: 'Test scheduled date', type: 'string', required: true },
      { name: 'portal_url', description: 'Portal URL for accessing the test', type: 'string', required: true },
      { name: 'organization_name', description: 'Organization name', type: 'string', required: true }
    ],
    is_default: true
  }
];

async function createDefaultEmailTemplates(createdBy) {
  try {
    console.log('Creating default email templates...');
    
    for (const templateData of defaultTemplates) {
      // Check if template already exists
      const existingTemplate = await EmailTemplate.findOne({
        template_type: templateData.template_type,
        is_default: true,
        organization_id: null
      });

      if (!existingTemplate) {
        // Generate next template_id
        const lastTemplate = await EmailTemplate.findOne().sort({ template_id: -1 });
        const template_id = lastTemplate ? lastTemplate.template_id + 1 : 1;

        await EmailTemplate.create({
          ...templateData,
          template_id,
          organization_id: null, // Global template
          created_by: createdBy
        });

        console.log(`✅ Created default template: ${templateData.template_name}`);
      } else {
        console.log(`⏭️  Template already exists: ${templateData.template_name}`);
      }
    }

    console.log('Default email templates creation completed!');
    return { success: true, message: 'Default email templates created successfully' };
  } catch (error) {
    console.error('Error creating default email templates:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createDefaultEmailTemplates,
  defaultTemplates
}; 