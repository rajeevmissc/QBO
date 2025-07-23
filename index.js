require('dotenv').config();
const express = require('express');
const cors = require("cors");
const path = require("path");
const serverless = require("serverless-http"); // ✅ import serverless-http
require('./config/modelConfig');
const mainRouter = require('./routes/mainRoute');
const logger = require('./utils/logger');

const app = express();
const __dirname = path.resolve();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', mainRouter);

// Optional: log to Vercel console
logger.log("info", "Server initialized");

module.exports = app;
module.exports.handler = serverless(app); // ✅ Export handler for Vercel
