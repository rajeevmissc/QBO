const mongoose = require('mongoose');

const entityCountSchema = new mongoose.Schema({
  environment: String,
  realmId: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  masterEntities: [
    {
      entity: String,
      count: mongoose.Schema.Types.Mixed // could be number or string
    }
  ],
  transactionEntities: [
    {
      entity: String,
      count: mongoose.Schema.Types.Mixed
    }
  ]
});

module.exports = mongoose.model('QboEntityCount', entityCountSchema);
