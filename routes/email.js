const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { parseCSV, extractFieldNames } = require('../utils/csvParser');
const { processTemplate, sendBulkEmails, markdownToHtml } = require('../utils/emailSender');

/**
 * Middleware to check if user is authenticated with email credentials
 */
const ensureEmailAuth = (req, res, next) => {
  if (!req.session.emailCredentials) {
    req.flash('error_msg', 'Please sign in with your email credentials first');
    return res.redirect('/auth/signin');
  }
  next();
};

/**
 * GET /email/upload - Show CSV upload form
 */
router.get('/upload', ensureEmailAuth, (req, res) => {
  // Check if template exists in session
  if (!req.session.emailTemplate) {
    req.flash('error_msg', 'Please create an email template first');
    return res.redirect('/template');
  }
  
  res.render('upload', {
    title: 'Upload Recipients',
    templateFields: req.session.templateFields
  });
});

/**
 * POST /email/upload - Process CSV upload
 */
router.post('/upload', ensureEmailAuth, (req, res, next) => {
  // Check if template exists in session
  if (!req.session.emailTemplate) {
    req.flash('error_msg', 'Please create an email template first');
    return res.redirect('/template');
  }
  
  // Use multer middleware for file upload
  req.upload.single('recipients')(req, res, async (err) => {
    if (err) {
      req.flash('error_msg', err.message);
      return res.redirect('/email/upload');
    }
    
    // Check if file was uploaded
    if (!req.file) {
      req.flash('error_msg', 'Please upload a CSV file');
      return res.redirect('/email/upload');
    }
    
    try {
      // Extract field names from CSV
      const fieldNames = await extractFieldNames(req.file.path);
      
      // Check if CSV contains required fields
      if (!fieldNames.includes('email')) {
        fs.unlinkSync(req.file.path);
        req.flash('error_msg', 'CSV must contain an "email" column');
        return res.redirect('/email/upload');
      }
      
      // Parse CSV file
      const recipients = await parseCSV(req.file.path);
      
      // Store file path and fields in session
      req.session.csvFilePath = req.file.path;
      req.session.csvFields = fieldNames;
      req.session.recipients = recipients;
      
      // Redirect to preview page
      res.redirect('/email/preview');
    } catch (error) {
      // Clean up file
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      req.flash('error_msg', error.message);
      res.redirect('/email/upload');
    }
  });
});

/**
 * GET /email/preview - Preview emails before sending
 */
router.get('/preview', async (req, res) => {
    // Check if template and CSV data exist in session
    if (!req.session.emailTemplate || !req.session.recipients) {
      req.flash('error_msg', 'Please upload a CSV file with recipients');
      return res.redirect('/email/upload');
    }
    
    const template = req.session.emailTemplate;
    const recipients = req.session.recipients;
    
    // Process first recipient for preview
    const previewRecipient = recipients[0];
    const previewSubject = processTemplate(template.subject, previewRecipient);
    
    // Process content with placeholders
    const processedContent = processTemplate(template.content, previewRecipient);
    
    // Convert to HTML for display
    const previewContent = markdownToHtml(processedContent);
    
    res.render('preview', {
      title: 'Preview Emails',
      template,
      recipientCount: recipients.length,
      previewRecipient,
      previewSubject,
      processedContent,
      previewContent,
      fields: req.session.csvFields
    });
  });

/**
 * POST /email/send - Send emails to all recipients
 */
router.post('/send', ensureEmailAuth, async (req, res) => {
  // Check if template and CSV data exist in session
  if (!req.session.emailTemplate || !req.session.recipients) {
    req.flash('error_msg', 'Please upload a CSV file with recipients');
    return res.redirect('/email/upload');
  }
  
  try {
    const template = req.session.emailTemplate;
    const recipients = req.session.recipients;
    const credentials = req.session.emailCredentials;
    
    // Send emails using session credentials
    const results = await sendBulkEmails(recipients, template, credentials);
    
    // Clean up CSV file
    if (req.session.csvFilePath) {
      fs.unlinkSync(req.session.csvFilePath);
      delete req.session.csvFilePath;
    }
    
    // Store results in session
    req.session.emailResults = results;
    
    // Redirect to success page
    res.redirect('/email/success');
  } catch (error) {
    req.flash('error_msg', `Error sending emails: ${error.message}`);
    res.redirect('/email/preview');
  }
});

/**
 * GET /email/success - Show success page
 */
router.get('/success', ensureEmailAuth, (req, res) => {
  // Check if results exist in session
  if (!req.session.emailResults) {
    req.flash('error_msg', 'No email sending results found');
    return res.redirect('/');
  }
  
  const results = req.session.emailResults;
  
  res.render('success', {
    title: 'Emails Sent',
    results,
    successCount: results.success.length,
    errorCount: results.errors.length,
    totalCount: results.success.length + results.errors.length
  });
  
  // Clear session data after showing results
  delete req.session.emailTemplate;
  delete req.session.templateFields;
  delete req.session.recipients;
  delete req.session.csvFields;
  delete req.session.emailResults;
});

module.exports = router;