const express = require('express');

// const userRoute = require('../routes/userRoute')
// const reportRoutes = require('../routes/reportRoutes');
const qboRoutes = require('../routes/qboRoutes');
const qboauthroutes = require('../routes/qbo');
const commonRouter = express.Router();

// commonRouter.use('/user', userRoute)
// commonRouter.use('/reports', reportRoutes)
commonRouter.use('/qbo', qboRoutes)
commonRouter.use('/auth/qbo', qboauthroutes)
module.exports = commonRouter
