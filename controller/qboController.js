// const fetch = require('node-fetch');
// const QboEntityCount = require('../models/QboEntityCount');

// const MASTER_ENTITIES = [
//   "Account", "Class", "Customer", "Department", "Employee", "Item", "PaymentMethod",
//   "Term", "Vendor", "TaxCode", "TaxRate", "Currency",
//   "Preferences", "CompanyInfo", "CustomFieldDefinition", "Attachable"
// ];

// const TRANSACTION_ENTITIES = [
//   "Bill", "BillPayment", "CreditMemo", "Deposit", "Estimate",
//   "Invoice", "JournalEntry", "Payment", "Purchase", "PurchaseOrder",
//   "RefundReceipt", "SalesReceipt", "TimeActivity", "Transfer",
//   "VendorCredit", "InventoryAdjustment"
// ];

// async function queryCount(entity, accessToken, realmId, baseUrl) {
//     console.log('query-------------------',entity);
//   const queryUrl = `${baseUrl}/v3/company/${realmId}/query?minorversion=65`;
//   const query = `SELECT COUNT(*) FROM ${entity}`;
//  console.log('query-------------------',query);
//   try {
//     const res = await fetch(queryUrl, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${accessToken}`,
//         'Accept': 'application/json',
//         'Content-Type': 'text/plain'
//       },
//       body: query
//     });

//     if (!res.ok) {
//       return { entity, count: `❌ ${res.status}` };
//     }

//     const data = await res.json();
//     const count = data.QueryResponse?.totalCount ?? 0;
//     return { entity, count };
//   } catch (err) {
//     return { entity, count: '⚠️ Error fetching' };
//   }
// }

// exports.getQboEntityCounts = async (req, res) => {
//   const { accessToken, realmId, environment = 'sandbox' } = req.body;

//   if (!accessToken || !realmId) {
//     return res.status(400).json({ error: 'Missing accessToken or realmId' });
//   }

//   const baseUrl =
//     environment === 'sandbox'
//       ? 'https://sandbox-quickbooks.api.intuit.com'
//       : 'https://quickbooks.api.intuit.com';

//   try {
//     const masterEntities = await Promise.all(
//       MASTER_ENTITIES.map(entity => queryCount(entity, accessToken, realmId, baseUrl))
//     );

//     const transactionEntities = await Promise.all(
//       TRANSACTION_ENTITIES.map(entity => queryCount(entity, accessToken, realmId, baseUrl))
//     );

//     const result = {
//       environment,
//       realmId,
//       masterEntities,
//       transactionEntities
//     };

//     const saved = await QboEntityCount.create(result);

//     res.json({
//       message: 'QBO entity counts fetched and saved successfully.',
//       savedId: saved._id,
//       data: result
//     });
//   } catch (error) {
//     console.error('Failed to fetch or save QBO counts:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


const fetch = require('node-fetch');
const QboEntityCount = require('../models/QboEntityCount');

const MASTER_ENTITIES = [
  "Account", "Class", "Customer", "Department", "Employee", "Item", "PaymentMethod",
  "Term", "Vendor", "TaxCode", "TaxRate", "Currency",
  "Preferences", "CompanyInfo", "CustomFieldDefinition", "Attachable"
];

const TRANSACTION_ENTITIES = [
  "Bill", "BillPayment", "CreditMemo", "Deposit", "Estimate",
  "Invoice", "JournalEntry", "Payment", "Purchase", "PurchaseOrder",
  "RefundReceipt", "SalesReceipt", "TimeActivity", "Transfer",
  "VendorCredit", "InventoryAdjustment"
];

// Retry helper for 429 Too Many Requests
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function queryCount(entity, accessToken, realmId, baseUrl, retries = 1) {
  const queryUrl = `${baseUrl}/v3/company/${realmId}/query?minorversion=65`;
  const query = `SELECT COUNT(*) FROM ${entity}`;
  console.log(`🔍 Querying count for entity: ${entity}`);

  try {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/text',
        'User-Agent': 'PaymentsAPI-OAuth2-Postman' // Important for QuickBooks API
      },
      body: query
    });

    if (res.status === 429 && retries > 0) {
      console.warn(`⏳ Rate limited on ${entity}, retrying after delay...`);
      await delay(1500);
      return await queryCount(entity, accessToken, realmId, baseUrl, retries - 1);
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Failed to query ${entity}: HTTP ${res.status} - ${errorText}`);
      return { entity, count: null, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const count = data.QueryResponse?.totalCount ?? 0;
    return { entity, count };

  } catch (err) {
    console.error(`⚠️ Error fetching ${entity}:`, err.message);
    return { entity, count: null, error: err.message };
  }
}

exports.getQboEntityCounts = async (req, res) => {
  const { accessToken, realmId, environment = 'sandbox' } = req.body;
  console.log('📦 Incoming Request:', req.body);

  if (!accessToken || !realmId) {
    return res.status(400).json({ error: 'Missing accessToken or realmId' });
  }

  const baseUrl = environment === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

  try {
    console.log('🚀 Starting entity count fetching...');

    const masterEntitiesResults = await Promise.all(
      MASTER_ENTITIES.map(entity => queryCount(entity, accessToken, realmId, baseUrl, 2))
    );

    const transactionEntitiesResults = await Promise.all(
      TRANSACTION_ENTITIES.map(entity => queryCount(entity, accessToken, realmId, baseUrl, 2))
    );

    const result = {
      environment,
      realmId,
      masterEntities: masterEntitiesResults,
      transactionEntities: transactionEntitiesResults
    };

    // Save to MongoDB (if schema is connected)
    const saved = await QboEntityCount.create(result);

    console.log('✅ All entity counts fetched and saved successfully.');
    res.json({
      message: 'QBO entity counts fetched and saved successfully.',
      savedId: saved._id,
      data: result
    });
  } catch (error) {
    console.error('🔥 Failed to fetch or save QBO counts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

