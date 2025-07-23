const express = require('express');
const router = express.Router();
const qboController = require('../controller/QBOAUTHController');

router.get('/connect', qboController.connectToQuickBooks);
router.get('/oauth/callback', qboController.qboOAuthCallback);
router.get('/company-info/:realmId', qboController.getCompanyInfo);

module.exports = router;
