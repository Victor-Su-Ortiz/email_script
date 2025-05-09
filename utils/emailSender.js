const nodemailer = require('nodemailer');
const { refreshAccessToken } = require('./oauth');

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

  // For Google OAuth authentication
  if (credentials.oauth === true) {
    if (!credentials.accessToken) {
      throw new Error('Access token required for OAuth authentication');
    }
    
    // Creating a transporter with OAuth2
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: credentials.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expires: credentials.expires || 3599
      },
      debug: process.env.NODE_ENV !== 'production' // Enable debug in development
    });
  } else {
    // Regular password authentication
    const config = {
      service: credentials.service, // gmail, outlook, yahoo, etc.
      auth: {
        user: credentials.email,
        pass: credentials.password
      }
    };

    return nodemailer.createTransport(config);
  }
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
 * @param {Object} req - Express request object for session updates
 * @returns {Promise} - Promise resolving to send result
 */
const sendEmail = async (options, credentials, req = null) => {
  let transporter;
  
  try {
    // Log the authentication method being used (helpful for debugging)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Sending email using ${credentials.oauth ? 'OAuth2' : 'Password'} authentication`);
      if (credentials.oauth) {
        console.log(`Email: ${credentials.email}`);
        console.log(`Access Token: ${credentials.accessToken ? credentials.accessToken.substring(0, 10) + '...' : 'None'}`);
        console.log(`Refresh Token: ${credentials.refreshToken ? credentials.refreshToken.substring(0, 10) + '...' : 'None'}`);
      }
    }
    
    transporter = createTransporter(credentials);
  } catch (error) {
    // If error is related to invalid access token and we have a refresh token, try refreshing
    if (credentials.oauth && 
        credentials.refreshToken && 
        (error.message.includes('access token') || error.code === 'EAUTH') &&
        req && req.session) {
      
      try {
        console.log('Trying to refresh access token...');
        // Refresh the token
        const newAccessToken = await refreshAccessToken(credentials.refreshToken);
        
        // Update the credentials in session
        credentials.accessToken = newAccessToken;
        req.session.emailCredentials.accessToken = newAccessToken;
        
        // Create transporter with new token
        transporter = createTransporter(credentials);
        
        console.log('Access token refreshed successfully.');
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        throw new Error(`Failed to refresh access token: ${refreshError.message}`);
      }
    } else {
      throw error;
    }
  }
  
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
 * @param {Object} req - Express request object for session updates
 * @returns {Promise<Array>} - Promise resolving to array of send results
 */
const sendBulkEmails = async (recipients, template, credentials, req = null) => {
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
      
      // Send email, passing the request object for token refresh if needed
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html,
        text: processedContent // Plain text version
      }, credentials, req);
      
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