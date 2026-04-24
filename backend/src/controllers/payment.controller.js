const paymentService = require('../services/payment.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');
const BookingPaymentService = require('../services/bookingPayment.service');

class PaymentController {
  async createPaymentForBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      // const userId = req.user._id;

      const payment = await BookingPaymentService.createPaymentForBooking(bookingId);

      return res.status(201).json({
        message: 'Tạo thanh toán thành công',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }


  async createPaymentDB(req, res, next) {
    try {
      const { ...body } = req.body;
      const payment = await paymentService.createPaymentDB(body);
      res.status(201).json({ message: 'Tạo dữ liệu thanh toán thành công', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentDBById(req, res, next) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPaymentDBById(paymentId);

      if (!payment) {
        return res.status(404).json({ error: "Không tìm thấy dữ liệu thanh toán" });
      }

      return res.status(200).json({ message: "Lấy dữ liệu thanh toán thành công", data: payment });
    } catch (err) {
      next(err);
    }
  }



  async getPaymentIntentById(req, res, next) {
    try {
      const { intentId } = req.params;
      const paymentIntent = await paymentService.getPaymentIntentById(intentId);


      if (!paymentIntent) {
        return res.status(404).json({
          message: 'Không tìm thấy Payment Intent'
        });
      }


      return res.status(200).json({
        message: 'Lấy Payment Intent thành công',
        data: {
          clientSecret: paymentIntent.client_secret,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getListPaymentDB(req, res, next) {
    try {
      const payments = await paymentService.getListPaymentDB(req.body);
      res.status(200).json({
        message: "Lấy danh sách thanh toán thành công",
        data: payments
      });
    } catch (err) {
      next(err);
    }
  }
  async updatePaymentStatus(req, res, next) {
    try {
      const { paymentId } = req.params;
      const { paymentStatus } = req.body;

      const updatedPayment = await paymentService.updatePaymentDBStatus(paymentId, paymentStatus);

      if (!updatedPayment) {
        return res.status(404).json({ message: "Không tìm thấy payment để cập nhật" });
      }
    } catch (err) {
      next(err);
    }
  }


  async getPaymentState(req, res, next) {
    try {
      const { bookingId } = req.params;

      const state = await paymentService.getPaymentState(bookingId);

      return res.status(200).json({
        message: "Lấy trạng thái thanh toán thành công",
        data: state
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { paymentIntentId } = req.body;

      const { intent, paymentStatus, bookingStatus } = await BookingPaymentService.confirmPaymentFromStripe(paymentIntentId);

      // message (giữ Stripe data)
      let message = `Intent đang ở trạng thái: ${intent.status}`;

      if (paymentStatus === 'successful') {
        message = `Thanh toán ${intent.amount} ${intent.currency} thành công!`;
      } else if (paymentStatus === 'failed') {
        message = `Thanh toán ${intent.amount} ${intent.currency} thất bại hoặc bị hủy!`;
      }


      return res.status(200).json({
        message: message,
        data: {
          intentId: intent.id,
          intentStatus: intent.status,
          paymentStatus, 
          bookingStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();