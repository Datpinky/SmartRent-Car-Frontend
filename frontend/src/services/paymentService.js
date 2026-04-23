import apiClient from './apiClient';

const paymentService = {
  async createPayment(bookingId) {
    const res = await apiClient.post(`/api/booking/${bookingId}/createPayment`);
    return res.data?.data ?? res.data;
  },

  async getPaymentState(bookingId) {
    const res = await apiClient.get(`/api/payment/getPaymentState/${bookingId}`);
    return res.data?.data ?? res.data;
  },

  async syncIntent(paymentIntentId) {
    const res = await apiClient.post('/api/payment/sync-intent', { paymentIntentId });
    return res.data?.data ?? res.data;
  },

  async getListPayments(filters = {}) {
    const res = await apiClient.post('/api/payment/getListPayments', filters);
    return res.data?.data ?? res.data;
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
