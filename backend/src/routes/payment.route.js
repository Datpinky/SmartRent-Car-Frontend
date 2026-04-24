
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { route } = require("./upload.route");

router.post(
  '/:bookingId/createPayment',
  paymentController.createPaymentForBooking
);

router.post('/createPaymentDB', paymentController.createPaymentDB);
router.get('/getPaymentIntent/:intentId', paymentController.getPaymentIntentById);
router.get("/getPaymentById/:paymentId",paymentController.getPaymentDBById);
router.post("/getListPayments", paymentController.getListPaymentDB);
router.get("/getPaymentState/:bookingId", paymentController.getPaymentState);
router.patch("/updatePaymentStatus/:paymentId", paymentController.updatePaymentStatus);
router.post('/confirmPayment',authMiddleware, paymentController.confirmPayment)



module.exports = router;