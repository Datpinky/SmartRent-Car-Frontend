import apiClient from './apiClient';

export const paymentService = {
  async getStripeConfig() {
    const res = await apiClient.get('/api/payments/config');
    return res.data.data;
  },

  async createPaymentIntent(bookingId) {
    if (!bookingId) {
      throw new Error('Missing booking id for payment intent.');
    }

    const res = await apiClient.post('/api/payments/create-intent', { bookingId });
    return res.data.data;
  },

  async verifyPaymentIntent(bookingId, paymentIntentId) {
    if (!bookingId || !paymentIntentId) {
      throw new Error('Missing payment verification data.');
    }

    const res = await apiClient.post(`/api/payments/verify-intent/${bookingId}`, { paymentIntentId });
    return res.data.data;
  }
};

export default paymentService;
