const express = require('express');
const router = express.Router();

/**
 * GET /auth/signin - Show signin form
 */
router.get('/signin', (req, res) => {
  res.render('auth/signin', {
    title: 'Sign In'
  });
});

/**
 * POST /auth/signin - Process signin form
 */
router.post('/signin', (req, res) => {
  const { email, password, service } = req.body;
  
  // Validate input
  if (!email || !password || !service) {
    req.flash('error_msg', 'Please provide email, password and service');
    return res.redirect('/auth/signin');
  }
  
  // Store credentials in session
  req.session.emailCredentials = {
    email,
    password,
    service,
    from: email // Use the same email as the sender
  };
  
  req.flash('success_msg', 'Email credentials saved. You can now send emails.');
  res.redirect('/');
});

/**
 * GET /auth/signout - Sign out and clear credentials
 */
router.get('/signout', (req, res) => {
  // Clear email credentials from session
  delete req.session.emailCredentials;
  
  req.flash('success_msg', 'Email credentials removed');
  res.redirect('/');
});

module.exports = router;