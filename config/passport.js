const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleOAuthConfig = require('./googleOauth');

// Configure Passport to use Google OAuth strategy
module.exports = (app) => {
  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user object to store in session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Set up Google authentication strategy
  passport.use(
    new GoogleStrategy(
      googleOAuthConfig,
      (req, accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const user = {
            id: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            photo: profile.photos[0]?.value || '',
            provider: 'google',
            // Store OAuth tokens for email sending
            accessToken: accessToken,
            refreshToken: refreshToken
          };
          
          // Store user in session and complete authentication
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  return passport;
};