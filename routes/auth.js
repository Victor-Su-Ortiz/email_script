const express = require('express');
const router = express.Router();
const passport = require('passport');

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
 * Google authentication routes
 */

// Initiate Google authentication
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/signin',
    failureFlash: true
  }),
  (req, res) => {
    // Check if user is authenticated via Google
    if (req.user) {
      // Store user in session
      req.session.user = req.user;
      
      // Store basic email credentials to indicate authenticated status
      // Note: For actual email sending, we'll need additional setup/confirmation
      req.session.emailCredentials = {
        email: req.user.email,
        service: 'google',
        oauth: true,
        from: req.user.email
      };
      
      req.flash('success_msg', `Welcome, ${req.user.displayName || req.user.email}! You've signed in with Google.`);
    } else {
      req.flash('error_msg', 'Google authentication failed.');
    }
    
    res.redirect('/');
  }
);

/**
 * GET /auth/signout - Sign out and clear credentials
 */
router.get('/signout', (req, res) => {
  // Clear email credentials and user from session
  delete req.session.emailCredentials;
  delete req.session.user;
  
  // Logout from Passport session
  if (req.logout) {
    req.logout((err) => {
      if (err) {
        console.error('Error during logout:', err);
      }
    });
  }
  
  req.flash('success_msg', 'You have been signed out');
  res.redirect('/');
});

module.exports = router;