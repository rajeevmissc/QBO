// index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const {
  QBO_CLIENT_ID,
  QBO_CLIENT_SECRET,
  QBO_REDIRECT_URI,
  QBO_ENVIRONMENT,
  FRONTEND_REDIRECT_URI,
} = process.env;

const baseUrl =
  QBO_ENVIRONMENT === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";

// ============================
// 🔗 STEP 1: Redirect to QBO
// ============================
app.get("/auth/qbo", (req, res) => {
  const scope =
    "com.intuit.quickbooks.accounting openid profile email phone address";
  const state = Buffer.from(Date.now().toString()).toString("base64");

  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${QBO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    QBO_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

  return res.redirect(authUrl);
});

// ============================
// 🔁 STEP 2: OAuth Callback
// ============================
app.get("/auth/callback", async (req, res) => {
  const { code, realmId } = req.query;

  if (!code || !realmId) {
    return res.status(400).send("Missing code or realmId in callback.");
  }

  try {
    const response = await axios.post(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: QBO_REDIRECT_URI,
      }).toString(),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString(
              "base64"
            ),
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    const frontendRedirect =
      FRONTEND_REDIRECT_URI || "http://localhost:3000/oauth-success";
    res.redirect(
      `${frontendRedirect}?access_token=${access_token}&realmId=${realmId}`
    );
  } catch (error) {
    console.error("❌ OAuth Error:", error.response?.data || error.message);
    return res.status(500).send("OAuth Exchange Failed");
  }
});

// ============================
// 🏢 STEP 3: Get Company Info
// ============================
app.get("/company-info/:realmId", async (req, res) => {
  const { realmId } = req.params;
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!realmId || !accessToken) {
    return res.status(400).send("Missing realmId or access token");
  }

  try {
    const companyResponse = await axios.get(
      `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    res.json(companyResponse.data);
  } catch (error) {
    console.error("❌ Company Info Error:", error.response?.data || error.message);
    res.status(500).send("Failed to fetch company info");
  }
});

// ✅ Export app for Vercel
module.exports = app;
