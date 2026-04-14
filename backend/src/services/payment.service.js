const Stripe = require('stripe');
const PaymentModel = require('../models/payment.model');

// Lazy-init: chỉ tạo Stripe instance khi cần, đảm bảo dotenv đã chạy
let _stripe = null;
const getStripe = () => {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY chưa được cấu hình trong .env');
    _stripe = Stripe(key);
  }
  return _stripe;
};
const throwError = require('../utils/throwError');
const BookingService = require('./booking.service');
const BaseService = require('./base.service');

const ALLOWED_PAYMENT_STATUSES = ['pending', 'waiting_payment'];

class QueryBuilder {
  static buildExactFieldFilter(filters = {}) {
    const filter = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        filter[key] = value;
      }
    }
    return filter;
  }

  static buildSearchFilter(search, fieldsObj = {}) {
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      const fields = Object.keys(fieldsObj);
      if (fields.length > 0) {
        return { $or: fields.map((field) => ({ [field]: regex })) };
      }
    }
    return {};
  }

  static buildSortOptions(sorts = []) {
    const sort = {};
    for (const { field, value } of sorts) {
      const direction = BaseService.parseSortDirection(value);
      if (direction !== null) {
        sort[field] = direction;
      }
    }
    return sort;
  }
}

class PaymentService {
  async createPaymentForBooking(bookingId) {
    const booking = await BookingService.getBookingById(bookingId);
    if (!booking) throwError('Không tìm thấy booking', 404);

    if (booking.status === 'paid') {
      throwError('Booking đã thanh toán', 400);
    }

    if (!ALLOWED_PAYMENT_STATUSES.includes(booking.status)) {
      throwError(
        `Booking ở trạng thái "${booking.status}" không thể thanh toán. Chỉ các trạng thái được phép: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`,
        400
      );
    }

    let payment = await PaymentModel.findOne({
      booking_id: bookingId,
      payment_status: 'pending'
    });

    // Bug fix: check null before accessing payment_status, then check status
    if (payment && payment.payment_status !== 'pending') {
      throwError('Chỉ có thanh toán pending mới được tạo intent', 400);
    }

    if (!payment) {
      payment = await this.createPaymentDB({
        booking_id: bookingId,
        amount: booking.total_price,
        payment_status: 'pending'
      });
      await BookingService.updateBookingStatus(bookingId, 'waiting_payment');
    }

    let intent;
    if (payment.stripe_payment_intent_id) {
      intent = await this.getPaymentIntentById(payment.stripe_payment_intent_id);
    } else {
      intent = await this.createPaymentIntent({ paymentId: payment._id });
      await PaymentModel.findByIdAndUpdate(payment._id, {
        stripe_payment_intent_id: intent.id
      });
    }

    return { ...payment, stripe_payment_intent_id: intent.id, client_secret: intent.client_secret };
  }

  async getPaymentState(bookingId) {
    const booking = await BookingService.getBookingById(bookingId);
    if (!booking) throwError('Không tìm thấy booking', 404);

    const payment = await PaymentModel.findOne({ booking_id: bookingId }).sort({ createdAt: -1 });

    let intent = null;
    if (payment?.stripe_payment_intent_id) {
      intent = await this.getPaymentIntentById(payment.stripe_payment_intent_id);
    }

    return {
      bookingStatus: booking.status,
      paymentStatus: payment?.payment_status || null,
      intentStatus: intent?.status || null
    };
  }

  async createPaymentIntent(body = {}) {
    const { paymentId } = body;
    const payment = await this.getPaymentDBById(paymentId);

    if (!payment) {
      throwError('Payment không tồn tại', 404);
    }

    const intent = await getStripe().paymentIntents.create({
      amount: payment.amount,
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
    return await getStripe().paymentIntents.retrieve(intentId);
  }

  async getPaymentDBById(paymentId) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      throwError('Không tìm thấy dữ liệu thanh toán', 404);
    }
    return payment;
  }

  async getListPaymentDB(body = {}) {
    const { search, page, limit, sort_by, sort_by_amount, transaction_code, booking_id } = body;

    const pagination = BaseService.parsePagination({ page, limit });
    const searchFilter = QueryBuilder.buildSearchFilter(search, { transaction_code });
    const fieldFilter = QueryBuilder.buildExactFieldFilter({ booking_id });
    const filter = { $and: [searchFilter, fieldFilter] };
    const sortObj = QueryBuilder.buildSortOptions([
      { field: 'amount', value: sort_by_amount },
      { field: 'createdAt', value: sort_by }
    ]);

    return BaseService.findPaginated(PaymentModel, filter, sortObj, pagination);
  }

  async updatePaymentDBStatus(paymentId, newStatus) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) throwError('Không tìm thấy dữ liệu thanh toán', 404);

    payment.payment_status = newStatus;
    await payment.save();
    return payment.toObject();
  }

  async syncPaymentIntentWithDB(paymentIntentId) {
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    const updatePaymentAndBooking = async (intent, paymentStatus, bookingStatus) => {
      const paymentId = intent.metadata.payment_id;
      const bookingId = intent.metadata.booking_id;

      const payment = await this.getPaymentDBById(paymentId);
      await this.updatePaymentDBStatus(paymentId, paymentStatus);
      await BookingService.updateBookingStatus(bookingId, bookingStatus);

      if (paymentStatus === 'successful') {
        await PaymentModel.findByIdAndUpdate(payment._id, { paid_at: new Date() });
      }
    };

    let paymentStatus = null;
    let bookingStatus = null;

    if (intent.status === 'succeeded') {
      paymentStatus = 'successful';
      bookingStatus = 'paid';
    } else if (['requires_payment_method', 'canceled'].includes(intent.status)) {
      paymentStatus = 'failed';
      bookingStatus = 'waiting_payment';
    }

    if (paymentStatus && bookingStatus) {
      await updatePaymentAndBooking(intent, paymentStatus, bookingStatus);
    }

    return { intent, paymentStatus, bookingStatus };
  }
}

module.exports = new PaymentService();
