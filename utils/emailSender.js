const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter object using SMTP transport
 * @param {Object} credentials - Email credentials object
 * @returns {Object} - Nodemailer transporter object
 */
const createTransporter = (credentials) => {
  return nodemailer.createTransport({
    service: credentials.service,
    auth: {
      user: credentials.email,
      pass: credentials.password
    }
  });
};

/**
 * Replace template placeholders with actual values
 * @param {string} template - Email template with placeholders
 * @param {Object} data - Object containing key-value pairs for replacement
 * @returns {string} - Processed email content
 */
const processTemplate = (template, data) => {
  let result = template;
  
  // Replace all placeholders in the format [placeholder]
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\[${key}\\]`, 'gi');
    result = result.replace(placeholder, value || '');
  }
  
  return result;
};

/**
 * Send email to a single recipient
 * @param {Object} options - Email options
 * @param {Object} credentials - Email credentials
 * @returns {Promise} - Promise resolving to send result
 */
const sendEmail = async (options, credentials) => {
  const transporter = createTransporter(credentials);
  
  const mailOptions = {
    from: credentials.from || credentials.email,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]+>/g, '')
  };
  
  return transporter.sendMail(mailOptions);
};

/**
 * Send emails to multiple recipients
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} template - Email template object
 * @param {Object} credentials - Email credentials
 * @returns {Promise<Object>} - Promise resolving to results object
 */
const sendBulkEmails = async (recipients, template, credentials) => {
  // Check if credentials exist
  if (!credentials) {
    throw new Error('Email credentials not found. Please sign in first.');
  }
  
  const results = [];
  const errors = [];
  
  for (const recipient of recipients) {
    try {
      // Process subject template
      const subject = processTemplate(template.subject, recipient);
      
      // Process content template
      const html = processTemplate(template.content, recipient);
      
      // Send email
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html,
      }, credentials);
      
      results.push({
        email: recipient.email,
        status: 'success',
        messageId: result.messageId
      });
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      
      errors.push({
        email: recipient.email,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return {
    success: results,
    errors
  };
};

module.exports = {
  processTemplate,
  sendEmail,
  sendBulkEmails
};