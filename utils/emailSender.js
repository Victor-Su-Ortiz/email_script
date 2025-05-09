const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter object using SMTP transport
 * @param {Object} credentials - Email credentials for authentication
 * @returns {Object} - Nodemailer transporter
 */
const createTransporter = (credentials) => {
  // Check if credentials are provided
  if (!credentials) {
    throw new Error('Email credentials are required');
  }

  // Configure transporter based on service
  const config = {
    service: credentials.service, // gmail, outlook, yahoo, etc.
    auth: {
      user: credentials.email,
      pass: credentials.password
    }
  };

  return nodemailer.createTransport(config);
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
 * Convert markdown to HTML
 * @param {string} markdown - Text with markdown formatting
 * @returns {string} - HTML formatted text
 */
const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  let html = markdown
    // Handle paragraphs (preserve line breaks)
    .replace(/\n/g, '<br>\n')
    // Handle bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Handle italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Handle links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Handle horizontal rules
    .replace(/^\s*---\s*$/gm, '<hr>')
    // Handle headers
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    // Handle lists
    .replace(/^\s*- (.*?)$/gm, '<li>$1</li>')
    .replace(/<\/li>\n<li>/g, '</li>\n<li>');
  
  // Wrap list items in ul tags
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*?<\/li>\n)+/g, '<ul>$&</ul>');
  }
  
  return html;
};

/**
 * Send email to a single recipient
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email text content
 * @param {Object} credentials - Email credentials for authentication
 * @returns {Promise} - Promise resolving to send result
 */
const sendEmail = async (options, credentials) => {
  const transporter = createTransporter(credentials);
  
  const mailOptions = {
    from: credentials.email, // Use the authenticated email as the sender
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
 * @param {Object} credentials - Email credentials for authentication
 * @returns {Promise<Array>} - Promise resolving to array of send results
 */
const sendBulkEmails = async (recipients, template, credentials) => {
  const results = {
    success: [],
    errors: []
  };

  // Create a small delay between emails to avoid rate limiting
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  
  for (const recipient of recipients) {
    try {
      // Process subject template
      const subject = processTemplate(template.subject, recipient);
      
      // Process content template
      let processedContent = processTemplate(template.content, recipient);
      
      // Convert markdown to HTML
      const html = markdownToHtml(processedContent);
      
      // Send email
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html,
        text: processedContent // Plain text version
      }, credentials);
      
      results.success.push({
        email: recipient.email,
        status: 'success',
        messageId: result.messageId
      });

      // Add a small delay between emails
      await delay(200);
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      
      results.errors.push({
        email: recipient.email,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = {
  processTemplate,
  markdownToHtml,
  sendEmail,
  sendBulkEmails
};