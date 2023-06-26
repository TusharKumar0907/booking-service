
const express = require('express');

const bookingRoutes = require('./booking');


const router = express.Router();


router.use('/bookings', bookingRoutes);


module.exports = router;