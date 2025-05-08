const express = require('express');
const router = express.Router();
const emailConfig = require('../config/emailConfig');

/**
 * GET / - Home page
 */
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Bulk Email Sender',
    defaultTemplates: emailConfig.defaultTemplates
  });
});

/**
 * GET /about - About page
 */
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Bulk Email Sender'
  });
});

module.exports = router;