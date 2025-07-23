const { body, validationResult } = require('express-validator');

exports.validateReportRequest = [
  body('clientname').notEmpty().withMessage('Client name is required'),
  body('auditperiod').notEmpty().withMessage('Audit period is required'),
  body('CurrentYear').notEmpty().withMessage('Current year is required'),
  body('report_type').isIn(['1', '2', '3','4','5']).withMessage('Invalid report type'),
  body('folder_path').notEmpty().withMessage('Folder path is required'),
  body('start_month').optional().isInt({ min: 1, max: 12 }).withMessage('Start month must be between 1 and 12'),
  body('end_month').optional().isInt({ min: 1, max: 12 }).withMessage('End month must be between 1 and 12'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
