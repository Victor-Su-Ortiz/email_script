const express = require('express');
const router = express.Router();
const emailConfig = require('../config/emailConfig');

/**
 * GET /template - Show template creation form
 */
router.get('/', (req, res) => {
  res.render('template', { 
    title: 'Create Email Template',
    defaultTemplates: emailConfig.defaultTemplates
  });
});

/**
 * POST /template - Save template in session
 */
router.post('/', (req, res) => {
  const { subject, content } = req.body;
  
  // Validate input
  if (!subject || !content) {
    req.flash('error_msg', 'Please provide both subject and content for the email template');
    return res.redirect('/template');
  }
  
  // Store template in session
  req.session.emailTemplate = {
    subject,
    content
  };
  
  // Extract template fields (placeholders)
  const placeholderRegex = /\[(.*?)\]/g;
  const matches = new Set();
  let match;
  
  // Extract from subject
  while ((match = placeholderRegex.exec(subject)) !== null) {
    matches.add(match[1]);
  }
  
  // Reset regex lastIndex
  placeholderRegex.lastIndex = 0;
  
  // Extract from content
  while ((match = placeholderRegex.exec(content)) !== null) {
    matches.add(match[1]);
  }
  
  // Store fields in session
  req.session.templateFields = Array.from(matches);
  
  // Redirect to upload page
  res.redirect('/email/upload');
});

/**
 * GET /template/:id - Load a default template
 */
router.get('/:id', (req, res) => {
  const templateId = parseInt(req.params.id);
  
  // Validate template ID
  if (isNaN(templateId) || templateId < 0 || templateId >= emailConfig.defaultTemplates.length) {
    req.flash('error_msg', 'Invalid template ID');
    return res.redirect('/template');
  }
  
  const template = emailConfig.defaultTemplates[templateId];
  
  res.render('template', {
    title: 'Edit Email Template',
    template,
    defaultTemplates: emailConfig.defaultTemplates
  });
});

module.exports = router;