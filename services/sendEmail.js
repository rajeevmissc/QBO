require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Create instance of TransactionalEmailsApi
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

async function send(msg) {
  const email = {
    sender: {
      name: msg.from?.name || 'ISSC',
      email: typeof msg.from === 'string' ? msg.from : msg.from?.email || 'ruchis@issc.co.in',
    },
    to: Array.isArray(msg.to)
      ? msg.to.map(item => (typeof item === 'string' ? { email: item } : item))
      : [{ email: msg.to }],
    subject: msg.subject,
    htmlContent: msg.html || '',
    textContent: msg.text || '',
  };

  // Optional fields
  if (msg.cc) {
    email.cc = Array.isArray(msg.cc)
      ? msg.cc.map(item => (typeof item === 'string' ? { email: item } : item))
      : [{ email: msg.cc }];
  }

  if (msg.bcc) {
    email.bcc = Array.isArray(msg.bcc)
      ? msg.bcc.map(item => (typeof item === 'string' ? { email: item } : item))
      : [{ email: msg.bcc }];
  }

  if (msg.replyTo) {
    email.replyTo = typeof msg.replyTo === 'string'
      ? { email: msg.replyTo }
      : {
          email: msg.replyTo.email,
          name: msg.replyTo.name,
        };
  }

  console.log('📤 Sending payload:', email);

  try {
    const result = await apiInstance.sendTransacEmail(email);
    console.log('✅ Brevo email sent:', result.messageId || JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', error.response?.body || error.message || error);
    throw error;
  }
}

module.exports = { send };
