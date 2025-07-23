const express = require('express');
const router = express.Router();

const reportController = require('../controller/reportController');
const auth = require('../middleware/authToken');
const { validateReportRequest } = require('../validations/validateReport');

router.post(
  '/generate-report',
  auth,
  validateReportRequest,
  reportController.generateReport
);

module.exports = router;
