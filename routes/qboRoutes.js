const express = require('express');
const router = express.Router();
const { getQboEntityCounts } = require('../controller/qboController');

// GET QBO entity counts and save to DB
router.post('/entity-counts', getQboEntityCounts);

module.exports = router;
