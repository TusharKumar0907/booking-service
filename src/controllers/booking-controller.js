const { StatusCodes } = require('http-status-codes');
const { BookingService } = require('../services');

const inMemDb = {};

async function createBooking(req, res) {
    try {
        console.log(req.body);
        const response = await BookingService.createBooking({
            flightId: req.body.flightId,
            userId: req.body.userId,
            noofSeats: req.body.noofSeats
        });
        return res
        .status(StatusCodes.CREATED)
        .json({
            success:true,
            message: "done done",
            data:response
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
        const idempotencyKey = req.headers['x-idempotency-key'];
        if(!idempotencyKey ) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({message: 'idempotency key missing'});
        }
        if(inMemDb[idempotencyKey]) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({message: 'Cannot retry on a successful payment'});
        } 
        const response = await BookingService.makePayment({
            totalCost: req.body.totalCost,
            userId: req.body.userId,
            bookingId: req.body.bookingId
        });
        inMemDb[idempotencyKey] = idempotencyKey;
        return res
                .status(StatusCodes.OK)
                .json({
                    success:true,
                    message: "done done",
                    data:response
                });
    } catch(error) {
        console.log(error);
        return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({
                    success:false,
                    message: "not done",
                });
    }
}

module.exports = {
    createBooking,
    makePayment
}