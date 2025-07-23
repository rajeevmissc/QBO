// controllers/qboController.js
const axios = require('axios');
require('dotenv').config();

const {
  QBO_CLIENT_ID,
  QBO_CLIENT_SECRET,
  QBO_REDIRECT_URI,
  QBO_ENVIRONMENT,
} = process.env;

const baseUrl =
  QBO_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

// STEP 1: Redirect to QuickBooks OAuth URL
exports.connectToQuickBooks = (req, res) => {
  const scope = 'com.intuit.quickbooks.accounting openid profile email phone address';
  const state = Buffer.from(Date.now().toString()).toString('base64'); // You can also save this in a DB/session

  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${QBO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    QBO_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

  return res.redirect(authUrl);
};

// STEP 2: Handle the callback and exchange code for tokens
exports.qboOAuthCallback = async (req, res) => {
  const { code, realmId, state } = req.query;

  if (!code || !realmId) {
    return res.status(400).send('Missing code or realmId in callback.');
  }

  try {
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: QBO_REDIRECT_URI,
      }).toString(),
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    console.log('✅ Access Token:', access_token);
    console.log('🔁 Refresh Token:', refresh_token);
    console.log('🏢 Realm ID:', realmId);

    // Optionally: Save to DB/session securely here

    // Redirect to frontend
    const frontendRedirect = process.env.FRONTEND_REDIRECT_URI || 'http://localhost:3000/oauth-success';
    res.redirect(
      `${frontendRedirect}?access_token=${access_token}&realmId=${realmId}`
    );
  } catch (error) {
    console.error('❌ OAuth Error:', error.response?.data || error.message);
    return res.status(500).send('OAuth Exchange Failed');
  }
};

// STEP 3: Retrieve Company Info using Access Token
exports.getCompanyInfo = async (req, res) => {
  const { realmId } = req.params;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!realmId || !accessToken) {
    return res.status(400).send('Missing realmId or access token');
  }

  try {
    const companyResponse = await axios.get(
      `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    res.json(companyResponse.data);
  } catch (error) {
    console.error('❌ Company Info Error:', error.response?.data || error.message);
    res.status(500).send('Failed to fetch company info');
  }
};
