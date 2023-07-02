const { StatusCodes } = require('http-status-codes');
const { BookingService } = require('../services');
const { response } = require("express");

async function createBooking(req, res) {

    try {
        const respo = await BookingService.createBooking({
            flightId: req.body.flightId,
            userId: req.body.userId,
            noofseats: req.body.noofseats
        });
        return res
        .status(StatusCodes.OK)
        .json({
            success:true,
            message: "done done",
            data:respo
        });
    } catch(error) {
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    success:false,
                    message: "not done",
                });
    }
}


async function makePayment(req, res) {
    try {
        const response = await BookingService.makePayment({
            totalCost: req.body.totalCost,
            userId: req.body.userId,
            bookingId: req.body.bookingId
        });
        return res
                .status(StatusCodes.OK)
                .json({
                    success:true,
                    message: "payment ho gyii",
                    data:response
                });
    } catch(error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    success:false,
                    message: "payment nhi huii",
                });
    }
}


module.exports = {
    createBooking,
    makePayment
}