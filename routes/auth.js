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

// Initiate Google authentication with necessary scopes for email
router.get('/google', 
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email',
      'https://mail.google.com/' // This scope is needed for full access to Gmail
    ],
    accessType: 'offline', // Request a refresh token
    prompt: 'consent'      // Force consent screen to ensure we get a refresh token
  })
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
      // Log the tokens received (helpful for debugging)
      if (process.env.NODE_ENV !== 'production') {
        console.log('Authentication successful, tokens received:');
        console.log('Access Token:', req.user.accessToken ? req.user.accessToken.substring(0, 10) + '...' : 'None');
        console.log('Refresh Token:', req.user.refreshToken ? req.user.refreshToken.substring(0, 10) + '...' : 'None');
      }
      
      // Store user in session
      req.session.user = req.user;
      
      // Store email credentials with OAuth info
      req.session.emailCredentials = {
        email: req.user.email,
        service: 'gmail',
        oauth: true,
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
        expires: req.user.expires || 3599,
        from: req.user.email
      };
      
      req.flash('success_msg', `Welcome, ${req.user.displayName || req.user.email}! You've signed in with Google and can now send emails.`);
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