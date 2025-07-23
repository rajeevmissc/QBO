const axios = require('axios');

exports.generateReport = async (req, res) => {
  try {
    const {
      clientname,
      auditperiod,
      CurrentYear,
      report_type,
      start_month,
      end_month,
      folder_path
    } = req.body;

    console.log('re',req.body)

    const response = await axios.post('http://localhost:5000/generate-report', {
      clientname,
      auditperiod,
      current_year: CurrentYear,
      report_type,
      start_month,
      end_month,
      folder_path
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Python API call failed:', error.message);
    return res.status(500).json({ error: 'Report generation failed.' });
  }
};
