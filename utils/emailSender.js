const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter object using SMTP transport
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
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
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email text content
 * @returns {Promise} - Promise resolving to send result
 */
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
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
 * @param {string} template.subject - Email subject template
 * @param {string} template.content - Email content template
 * @returns {Promise<Array>} - Promise resolving to array of send results
 */
const sendBulkEmails = async (recipients, template) => {
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
      });
      
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