const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise} - Nodemailer info
 */
exports.sendEmail = async (options) => {
  try {
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

    // Email options
    const message = {
      from: config.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html || options.text
    };

    // Send email
    const info = await transporter.sendMail(message);
    return info;
  } catch (error) {
    throw error;
  }
}; 