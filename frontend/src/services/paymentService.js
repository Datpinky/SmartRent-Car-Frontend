import apiClient from './apiClient';

const paymentService = {
  async createPendingPaymentRecord({ bookingId, amount, paymentMethod = 'stripe' } = {}) {
    if (!bookingId) {
      throw new Error('Khong tim thay booking id de tao payment record.');
    }

    const normalizedAmount = Number(amount || 0);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error('So tien payment khong hop le.');
    }

    const res = await apiClient.post('/api/payment/createPaymentDB', {
      booking_id: bookingId,
      amount: normalizedAmount,
      payment_method: paymentMethod,
      payment_status: 'pending',
    });

    return res.data?.data ?? res.data;
  },

  async createPayment(bookingOrOptions, amount) {
    const options =
      bookingOrOptions && typeof bookingOrOptions === 'object'
        ? bookingOrOptions
        : { bookingId: bookingOrOptions, amount };
    const bookingId = options.bookingId || options.id || '';
    if (!bookingId) {
      throw new Error('Khong tim thay booking id de tao payment.');
    }

    const latestPayment = bookingId
      ? await this.getLatestPaymentByBookingId(bookingId).catch(() => null)
      : null;

    if (bookingId && latestPayment?.payment_status !== 'pending' && Number(options.amount || 0) > 0) {
      await this.createPendingPaymentRecord({
        bookingId,
        amount: options.amount,
        paymentMethod: options.paymentMethod || 'stripe',
      });
    }

    const res = await apiClient.post(`/api/booking/${bookingId}/createPayment`);
    return res.data?.data ?? res.data;
  },

  async getPaymentState(bookingId) {
    const res = await apiClient.get(`/api/payment/getPaymentState/${bookingId}`);
    return res.data?.data ?? res.data;
  },

  async confirmPayment(paymentIntentId) {
    if (!paymentIntentId) {
      return null;
    }

    const res = await apiClient.post('/api/payment/confirmPayment', { paymentIntentId });
    return res.data?.data ?? res.data;
  },

  async getListPayments(filters = {}) {
    const res = await apiClient.post('/api/payment/getListPayments', filters);
    return res.data?.data?.data ?? res.data?.data ?? res.data;
  },

  async getLatestPaymentByBookingId(bookingId) {
    if (!bookingId) {
      return null;
    }

    const payments = await this.getListPayments({
      booking_id: bookingId,
      sort_by: -1,
      page: 1,
      limit: 1,
    });

    return Array.isArray(payments) && payments.length > 0 ? payments[0] : null;
  },

  /** Dùng bởi bookingService.enrichBooking và luồng thanh toán. */
  async getLatestPaymentByBookingId(bookingId) {
    if (!bookingId) return null;
    const raw = await this.getListPayments({
      booking_id: bookingId,
      sort_by: -1,
      page: 1,
      limit: 1,
    });
    const payments = Array.isArray(raw) ? raw : raw?.data;
    if (!Array.isArray(payments) || payments.length === 0) return null;
    return payments[0];
  },
};

export default paymentService;
