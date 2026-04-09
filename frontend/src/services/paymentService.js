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
};

export default paymentService;
