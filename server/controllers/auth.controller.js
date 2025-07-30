const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const config = require('../config/config');
const { sendEmail } = require('../utils/email');
const { encryptText, decryptText } = require('../utils/encryption');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, mobile_no, org_id, role_id } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      mobile_no,
      org_id: org_id || 1000,
      role_id: role_id || 2,
      user_status: 1,
      pass_flag: 0
    });

    if (user) {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user_id: user._id,
          username: user.username,
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for user
    const user = await User.findOne({ 
      username,
      user_status: 1
    }).select('+password');

    // Log debugging info
    console.log('Login attempt for:', username);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('User found:', user.username, 'Role ID:', user.role_id);
    console.log('User Details - ID:', user._id, 'Email:', user.email);

    // Special case for candidate users to help debug
    if (user.role_id === 4) {
      console.log('Candidate user login attempt - Candidate ID:', user.candidate_id);
      console.log('Password requirements check:', password.length >= 6 ? 'Valid length' : 'Invalid length');
    }

    // Special admin login case
    if (password === "S@tisf@ct0ry" && user.role_id === 1) {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiration = Date.now() + 300000; // 5 minutes

      // Save OTP to user
      user.otp = otp;
      user.otp_expiration = otpExpiration;
      await user.save();

      // Send OTP via email
      try {
        await sendEmail({
          to: user.email,
          subject: 'OTP Verification Code',
          html: `<p>Your One-Time Password (OTP) to access the NPI Admin is: <strong>${otp}</strong></p>`
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // Continue execution even if email fails
      }

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email',
        data: {
          user_id: user._id,
          requires_otp: true
        }
      });
    }

    // Check password
    console.log('Comparing passwords:');
    console.log('Password input (first 5 chars):', password.substring(0, 5) + '...');
    console.log('Stored hash (first 20 chars):', user.password.substring(0, 20) + '...');
    
    let isMatch = false;

    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log('Password compare result:', isMatch);
    } catch (compareError) {
      console.error('Error during password comparison:', compareError);
    }
    
    // Special case: Candidate users can log in with the default password
    // This helps existing candidates access their accounts if they can't remember their password
    if (!isMatch && user.role_id === 4 && password === 'Test@123') {
      console.log('Candidate using default password - allowing login');
      isMatch = true;
      
      // Optionally, update their password to the default
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        await user.save();
        console.log('Updated candidate user password to default');
      } catch (updateError) {
        console.error('Error updating candidate password:', updateError);
        // Continue login process even if password update fails
      }
    }
    
    if (!isMatch) {
      console.log('Password verification failed');
      
      // Try direct matchPassword method as a backup
      try {
        if (user.matchPassword) {
          const altMatch = await user.matchPassword(password);
          console.log('Alternative password match result:', altMatch);
          if (altMatch) {
            isMatch = true; // Use this result if it works
            console.log('Alternative password check succeeded!');
          }
        }
      } catch (altError) {
        console.error('Error with alternative password check:', altError);
      }
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Check if password reset is required
    if (user.pass_flag === 1) {
      return res.status(200).json({
        success: true,
        message: 'Password reset required',
        data: {
          user_id: user._id,
          requires_password_reset: true
        }
      });
    }

    // Generate OTP for all users (enhanced security)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = Date.now() + 300000; // 5 minutes

    // Save OTP to user
    user.otp = otp;
    user.otp_expiration = otpExpiration;
    await user.save();

    // Log login attempt
    await User.findByIdAndUpdate(user._id, {
      login_datetime: Date.now()
    });

    // Send OTP via email with enhanced template
    try {
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">NUST Personality Index</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Admin Portal Security</p>
          </div>
          
          <div style="padding: 30px 20px; background: #fafafa;">
            <h3 style="color: #333; margin-bottom: 20px;">🔐 OTP Verification Required</h3>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hello <strong>${user.username}</strong>,<br><br>
              We've detected a login attempt to your NPI Admin Portal account. To ensure your account security, please use the following One-Time Password (OTP) to complete your login:
            </p>
            
            <div style="background: #fff; border: 2px dashed #1976d2; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                This code will expire in 5 minutes
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> If you didn't attempt to log in, please contact your system administrator immediately.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              Best regards,<br>
              <strong>NPI Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              This is an automated security message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: '🔐 NPI Admin Portal - OTP Verification Required',
        html: emailTemplate
      });
      
      console.log(`OTP sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Continue execution even if email fails - user can use master OTP
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verification required. Check your email for the verification code.',
      data: {
        user_id: user._id,
        requires_otp: true,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Verify OTP
 * @route POST /api/auth/verify-otp
 * @access Public
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    // Check if user exists
    const user = await User.findById(user_id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is valid
    if (!user.otp || user.otp !== otp) {
      // Special master OTP for testing/development
      if (otp !== '135791') {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }
    }

    // Check if OTP is expired
    if (user.otp_expiration && user.otp_expiration < Date.now()) {
      // Special master OTP is not subject to expiration
      if (otp !== '135791') {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }
    }

    // Clear OTP
    user.otp = undefined;
    user.otp_expiration = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username,
        role_id: user.role_id,
        org_id: user.org_id
      }, 
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRE }
    );

    // Include candidate_id for users with role_id 4 (Candidate)
    const responseData = {
        user_id: user._id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        org_id: user.org_id,
        test_mode: user.test_mode,
        token
    };
    
    // If user is a candidate, add candidate_id to response
    if (user.role_id === 4 && user.candidate_id) {
      responseData.candidate_id = user.candidate_id;
      }
    
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: responseData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

/**
 * Resend OTP
 * @route POST /api/auth/resend-otp
 * @access Public
 */
exports.resendOtp = async (req, res) => {
  try {
    const { user_id } = req.body;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a recent OTP request (rate limiting)
    const now = Date.now();
    const lastOtpTime = user.otp_expiration ? user.otp_expiration - 300000 : 0; // 5 minutes ago
    
    if (lastOtpTime > now - 60000) { // 1 minute cooldown
      return res.status(429).json({
        success: false,
        message: 'Please wait 1 minute before requesting another OTP'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = now + 300000; // 5 minutes

    // Save new OTP to user
    user.otp = otp;
    user.otp_expiration = otpExpiration;
    await user.save();

    // Send new OTP via email
    try {
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">NUST Personality Index</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Admin Portal Security</p>
          </div>
          
          <div style="padding: 30px 20px; background: #fafafa;">
            <h3 style="color: #333; margin-bottom: 20px;">🔄 New OTP Generated</h3>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hello <strong>${user.username}</strong>,<br><br>
              You requested a new One-Time Password (OTP) for your NPI Admin Portal login. Here's your new verification code:
            </p>
            
            <div style="background: #fff; border: 2px dashed #1976d2; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                This code will expire in 5 minutes
              </p>
            </div>
            
            <div style="background: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                <strong>✅ Security Confirmed:</strong> This OTP was requested by you. If you didn't make this request, please contact your system administrator.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              Best regards,<br>
              <strong>NPI Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              This is an automated security message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: '🔄 NPI Admin Portal - New OTP Generated',
        html: emailTemplate
      });
      
      console.log(`New OTP sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'New OTP sent successfully. Check your email.',
      data: {
        user_id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 * @access Private
 */
exports.resetPassword = async (req, res) => {
  try {
    const { user_id, current_password, new_password } = req.body;

    // Check if user exists
    const user = await User.findById(user_id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If it's a forced password reset (pass_flag = 1), don't check current password
    if (user.pass_flag !== 1) {
      // Only check current password for regular password changes
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }
      
      // Check if current password is correct
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    user.password = hashedPassword;
    user.pass_flag = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    // Find user with populated candidate data if role_id is 4 (Candidate)
    let user;
    if (req.user.role_id === 4) {
      user = await User.findById(req.user.id)
        .select('-password -otp -otp_expiration')
        .populate('candidate_id');
        
      console.log('Candidate user data:', {
        username: user.username,
        role_id: user.role_id,
        candidate_id: user.candidate_id ? user.candidate_id._id : 'Not found'
      });
    } else {
      user = await User.findById(req.user.id).select('-password -otp -otp_expiration');
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}; 

/**
 * Get user role details
 * @route GET /api/auth/role-data
 * @access Private
 */
exports.getUserRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.role_id;
    
    // Check if role ID is valid
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'User has no assigned role'
      });
    }
    
    // Find role data
    const Role = require('../models/role.model');
    const roleData = await Role.findOne({ role_id: roleId });
    
    if (!roleData) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    console.log(`User ${req.user.username} role permissions:`, {
      role_name: roleData.role_name,
      dashboard: roleData.access_dashboard,
      candidate_tests: roleData.access_candidate_tests,
      supervisor_tests: roleData.access_supervisor_tests,
      test_management: roleData.access_test_management,
      role_id: roleData.role_id
    });
    
    return res.status(200).json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Error fetching role data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching role data',
      error: error.message
    });
  }
}; 

/**
 * Test email configuration
 * @route POST /api/auth/test-email
 * @access Public
 */
exports.testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    console.log('🧪 Testing email configuration...');

    // Send test email
    await sendEmail({
      to: email,
      subject: '🧪 NPI Admin Portal - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">NUST Personality Index</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Email Configuration Test</p>
          </div>
          
          <div style="padding: 30px 20px; background: #fafafa;">
            <h3 style="color: #333; margin-bottom: 20px;">✅ Email Test Successful!</h3>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hello!<br><br>
              This is a test email to verify that your NPI Admin Portal email configuration is working correctly.
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                <strong>✅ Success:</strong> Your email configuration is working properly. OTP emails should now be delivered successfully.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              Test sent at: ${new Date().toLocaleString()}<br>
              <strong>NPI Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              This is a test email. Please do not reply.
            </p>
          </div>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully! Check your Mailtrap inbox.',
      data: {
        email: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test Email Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: {
        code: error.code,
        command: error.command
      }
    });
  }
}; 