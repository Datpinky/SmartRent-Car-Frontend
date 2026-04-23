require('dotenv').config();
//https://wise.com/gb/blog/stripe-payments-test-cards


const mongoose = require('mongoose');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');
const BookingModel = require('../models/booking.model');
const throwError = require('../utils/throwError');
const BookingService = require('./booking.service');
const BaseService = require('./base.service');
const QueryBuilder = require('../utils/queryBuilder');


const PAYMENTDB_VALID_TRANSITIONS = {
  'pending': ['successful', 'declined', 'failed'],
  'failed': ['pending', 'declined'],
  'successful': ['refunded'],
  'declined': [],    // Trạng thái cuối
  'refunded': []     // Trạng thái cuối
};

class PaymentService {
  async ensureAmount(payment) {
    const booking = await BookingModel.findById(payment.booking_id);
    if (!booking) throwError('Không tìm thấy booking cho payment này', 404);

    if (payment.amount !== booking.total_price) {
      // Log lỗi để điều tra, có thể do lỗi code hoặc gian lận
      console.error(`Lệch số tiền giữa Payment DB (amount: ${payment.amount}) và Booking (total_price: ${booking.total_price}) cho paymentId: ${payment._id}, bookingId: ${booking._id}`);
      throwError('Lệch số tiền giữa Payment DB và Booking', 400);
    }
    // Trả về giá trị chính xác và đồng bộ luôn nếu cần
    return booking.total_price;
  }






  async getPaymentState(bookingId) {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) throwError("Không tìm thấy booking", 404);

    const payment = await PaymentModel.findOne({
      booking_id: bookingId,
    }).sort({ createdAt: -1 });


    let intent = null;

    if (payment?.stripe_payment_intent_id) {
      intent = await this.getPaymentIntentById(
        payment.stripe_payment_intent_id
      );
    }

    return {
      bookingStatus: booking.status,
      paymentStatus: payment?.payment_status || null,
      intentStatus: intent?.status || null,
    };
  }

  async createPaymentIntent(body = {}) {
    const { paymentId } = body;

    const payment = await this.getPaymentDBById(paymentId);

    if (!payment) {
      throwError('Payment không tồn tại', 404);
    }

    const finalAmount = await this.ensureAmount(payment);


    const intent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: payment.currency,
      metadata: {
        booking_id: payment.booking_id.toString(),
        payment_id: payment._id.toString()
      }
    });

    return intent;
  }



  async createPaymentDB(body) {
    const transactionCode = `TXN-${Date.now()}`;

    const payment = await PaymentModel.create({
      transaction_code: transactionCode,
      ...body
    });

    return payment.toObject();
  }

  async getPaymentIntentById(intentId) {
    return await stripe.paymentIntents.retrieve(intentId);
  }



  async getPaymentDBById(paymentId) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      throwError('Không tìm thấy dữ liệu thanh toán', 404);
    }
    return payment
  }

  async getListPaymentDB(body = {}) {
    const {
      search,
      page,
      limit,
      sort_by,
      sort_by_amount,
      transaction_code,
      booking_id
    } = body;

    // Pagination
    const pagination = BaseService.parsePagination({ page, limit });

    const searchFilter = QueryBuilder.buildSearchFilter(search, { transaction_code });

    const fieldFilter = QueryBuilder.buildExactFieldFilter({ booking_id });
    const filter = { $and: [searchFilter, fieldFilter] };
    const sortObj = QueryBuilder.buildSortOptions([{ field: 'amount', value: sort_by_amount }
      , { field: 'createdAt', value: sort_by }
    ]

    );
    return BaseService.findPaginated(PaymentModel, filter, sortObj, pagination);
  }



  async updatePaymentDBStatus(paymentId, newStatus, options = {}) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) throwError('Không tìm thấy dữ liệu thanh toán', 404);

    const oldStatus = payment.payment_status;

    const allowedTransitions = PAYMENTDB_VALID_TRANSITIONS[oldStatus] || [];

    if (oldStatus !== newStatus && !allowedTransitions.includes(newStatus)) {
      const allowedText = allowedTransitions.length
        ? `[${allowedTransitions.join(', ')}]`
        : 'KHÔNG CÓ (trạng thái cuối, không thể chuyển tiếp)';

      throwError(`Không thể chuyển Payment Record từ "${oldStatus}" → "${newStatus}". ` +
        `Các trạng thái hợp lệ: ${allowedText}`
        , 400);
    }
    payment.payment_status = newStatus;

    await payment.save(options);
    return payment.toObject();
  }

  async processRefundOnly(payment, reason = 'requested_by_customer') {
    if (!payment || payment.payment_status !== 'successful') {
      throwError("Giao dịch không hợp lệ để hoàn tiền");
    }

    if (!payment.stripe_payment_intent_id) {
      throwError("Không có Payment Intent ID");
    }

    // 👇 gọi Stripe (KHÔNG có transaction)
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      reason,
    });

    if (refund.status !== 'succeeded') {
      throwError("Stripe từ chối hoàn tiền");
    }

    return refund;
  }
}




module.exports = new PaymentService();