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
      (req, accessToken, refreshToken, params, profile, done) => {
        try {
          // Log the tokens received from Google (for debugging)
          if (process.env.NODE_ENV !== 'production') {
            console.log('Google OAuth tokens received:');
            console.log('Access Token:', accessToken ? accessToken.substring(0, 10) + '...' : 'None');
            console.log('Refresh Token:', refreshToken ? refreshToken.substring(0, 10) + '...' : 'None');
            console.log('Token Type:', params.token_type);
            console.log('Expires In:', params.expires_in);
            console.log('Scope:', params.scope);
          }
          
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
            refreshToken: refreshToken,
            expires: params.expires_in || 3599, // Default to ~1 hour if not provided
            tokenType: params.token_type || 'Bearer'
          };
          
          // Store user in session and complete authentication
          return done(null, user);
        } catch (error) {
          console.error('Error in Google authentication strategy:', error);
          return done(error, null);
        }
      }
    )
  );

  return passport;
};