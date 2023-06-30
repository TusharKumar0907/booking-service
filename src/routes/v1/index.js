const express = require('express');

const bookingRoutes = require('./booking');

const { info } = require('../../controllers');

const router = express.Router();

router.get('/info', info.info);

router.use('/bookings', bookingRoutes);

module.exports = router;