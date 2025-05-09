const axios = require('axios');

/**
 * Refresh an OAuth access token using the refresh token
 * @param {string} refreshToken - OAuth refresh token
 * @returns {Promise<string>} - Promise resolving to new access token
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    // Make request to Google's token endpoint
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    // Return the new access token
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh OAuth access token');
  }
};

module.exports = {
  refreshAccessToken
};