// index.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const serverless = require('serverless-http');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const {
  QBO_CLIENT_ID,
  QBO_CLIENT_SECRET,
  QBO_REDIRECT_URI,
  QBO_ENVIRONMENT,
  FRONTEND_REDIRECT_URI,
} = process.env;

const baseUrl =
  QBO_ENVIRONMENT === 'sandbox'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

/**
 * STEP 1: Redirect to QuickBooks OAuth URL
 */
app.get('/connect-to-qbo', (req, res) => {
  const scope = 'com.intuit.quickbooks.accounting openid profile email phone address';
  const state = Buffer.from(Date.now().toString()).toString('base64');

  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${QBO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    QBO_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

  return res.redirect(authUrl);
});

/**
 * STEP 2: Handle OAuth callback
 */
app.get('/qbo-callback', async (req, res) => {
  const { code, realmId } = req.query;
  if (!code || !realmId) return res.status(400).send('Missing code or realmId');

  try {
    const tokenRes = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: QBO_REDIRECT_URI,
      }),
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = tokenRes.data;
    console.log('✅ Access Token:', access_token);
    console.log('🔁 Refresh Token:', refresh_token);
    console.log('🏢 Realm ID:', realmId);

    const redirectUrl = `${FRONTEND_REDIRECT_URI || 'http://localhost:3000/oauth-success'}?access_token=${access_token}&realmId=${realmId}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('❌ OAuth Error:', err.response?.data || err.message);
    return res.status(500).send('OAuth Exchange Failed');
  }
});

/**
 * STEP 3: Fetch Company Info
 */
app.get('/company-info/:realmId', async (req, res) => {
  const { realmId } = req.params;
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!realmId || !accessToken) return res.status(400).send('Missing realmId or access token');

  try {
    const companyRes = await axios.get(
      `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    res.json(companyRes.data);
  } catch (err) {
    console.error('❌ Company Info Error:', err.response?.data || err.message);
    res.status(500).send('Failed to fetch company info');
  }
});

// Wrap and export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
