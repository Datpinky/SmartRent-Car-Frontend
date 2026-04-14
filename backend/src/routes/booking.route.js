const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Booking CRUD
router.post('/createBooking', authMiddleware, bookingController.createBooking);
router.post('/getListBookings', authMiddleware, bookingController.getAllBookings);
router.get('/getBookingById/:bookingId', authMiddleware, bookingController.getBookingById);
router.patch('/updateBookingStatus/:bookingId', authMiddleware, bookingController.updateBookingStatus);
router.delete('/deleteBooking/:bookingId', authMiddleware, bookingController.deleteBooking);

// Payment creation for a booking
router.post('/:bookingId/createPayment', authMiddleware, PaymentController.createPaymentForBooking);

module.exports = router;
