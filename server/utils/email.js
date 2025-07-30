const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise} - Nodemailer info
 */
exports.sendEmail = async (options) => {
  try {
    console.log('📧 Email Configuration:', {
      host: config.EMAIL_SERVICE,
      port: config.EMAIL_PORT,
      user: config.EMAIL_USER,
      from: config.EMAIL_FROM,
      to: options.to
    });

    // Create transporter with proper Mailtrap configuration
    const transporter = nodemailer.createTransport({
      host: config.EMAIL_SERVICE,
      port: config.EMAIL_PORT,
      secure: false, // Mailtrap uses non-secure connection
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');

    // Email options
    const message = {
      from: config.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text
    };

    console.log('📤 Sending email to:', options.to);
    console.log('📧 Subject:', options.subject);

    // Send email
    const info = await transporter.sendMail(message);
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
    throw error;
  }
}; 