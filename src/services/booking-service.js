const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { BookingRepository } = require('../repositories');
const { ServerConfig, Queue } = require('../config')
const db = require('../models');

const {Enums} = require('../utils/common');
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data) {
    const transaction = await db.sequelize.transaction();
    console.log(data);
    try {
        const flight = await axios.get(`http://localhost:3000/api/v1/flight/${data.flightId}`);
        const flightData = flight.data.data;
        console.log(flightData);
        if(data.noofseats > flightData.totalSeats) {
            throw new Error('Not enough seats available');
        }
        const totalBillingAmount = data.noofseats * flightData.price;
        const bookingPayload = {...data, totalCost: totalBillingAmount};
        const booking = await bookingRepository.create(bookingPayload, transaction);

        await axios.patch(`http://localhost:3000/api/v1/flight/${data.flightId}/seats`, {
            seats: data.noofseats,
            dec: true
        });
        
        await transaction.commit();
        return booking;
    } catch(error) {
        await transaction.rollback();
        console.log(error);
        throw error;
    }
    
}

async function makePayment(data) {
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails = await bookingRepository.get(data.bookingId, transaction);
        if(bookingDetails.status == CANCELLED) {
            throw new Error('The booking has expired');
        }
        console.log(bookingDetails);
        const bookingTime = new Date(bookingDetails.createdAt);
        const currentTime = new Date();
        if(currentTime - bookingTime > 300000) {
            await cancelBooking(data.bookingId);
            throw new Error('The booking has expired');
        }
        if(bookingDetails.totalCost != data.totalCost) {
            throw new Error('The amount of the payment doesnt match');
        }
        if(bookingDetails.userId != data.userId) {
            throw new Error('The user corresponding to the booking doesnt match');
        }
        // we assume here that payment is successful
        await bookingRepository.update(data.bookingId, {status: BOOKED}, transaction);
        Queue.sendData({
            recepientEmail: 'cs191297@gmail.com',
            subject: 'Flight booked',
            text: `Booking successfully done for the booking ${data.bookingId}`
        });
        await transaction.commit();
        
    } catch(error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelBooking(bookingId) {
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails = await bookingRepository.get(bookingId, transaction);
        console.log(bookingDetails);
        if(bookingDetails.status == CANCELLED) {
            await transaction.commit();
            return true;
        }
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`, {
            seats: bookingDetails.noofSeats,
            dec: 0
        });
        await bookingRepository.update(bookingId, {status: CANCELLED}, transaction);
        await transaction.commit();

    } catch(error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelOldBookings() {
    try {
        console.log("Inside service");
        const time = new Date( Date.now() - 1000 * 300 ); // time 5 mins ago
        const response = await bookingRepository.cancelOldBookings(time);
        return response;
    } catch(error) {
        console.log(error);
    }
}

module.exports = {
    createBooking,
    // makePayment,
    // cancelOldBookings
}