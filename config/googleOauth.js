const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.warn('Google OAuth authentication may not work correctly');
}

// Build callback URL based on environment
const getCallbackUrl = () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  console.log(baseUrl)
  return `${baseUrl}/auth/google/callback`;
};

const googleOAuthConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: getCallbackUrl(),
  passReqToCallback: true
};

module.exports = googleOAuthConfig;