import apiClient from './apiClient';

const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_test_51TDoRKBn9AulH7lmRgTPg6jtA8YsMjQHm1xk0NrTQimgIVsdP1EMxYk58cLk4jAqr8FSMp1NEiCe2Iorr4Q6lHkB00mFsmVUMM';

const normalizePayment = (payment = null) => {
  if (!payment) {
    return null;
  }

  return {
    ...payment,
    id: payment._id || payment.id || '',
    _id: payment._id || payment.id || '',
    booking_id: payment.booking_id || '',
    amount: Number(payment.amount || 0),
    currency: String(payment.currency || 'vnd').toUpperCase(),
    payment_method: payment.payment_method || '',
    payment_status: payment.payment_status || '',
    stripe_payment_intent_id: payment.stripe_payment_intent_id || '',
    transaction_code: payment.transaction_code || '',
    paid_at: payment.paid_at || '',
  };
};

const normalizePaymentState = (state = {}) => ({
  bookingStatus: state.bookingStatus || '',
  paymentStatus: state.paymentStatus || '',
  intentStatus: state.intentStatus || '',
});

const resolveStripeKey = () =>
  (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE_PUBLISHABLE_KEY || '').trim();

export const paymentService = {
  getStripePublishableKey() {
    return resolveStripeKey();
  },

  async createPaymentRecord(payload = {}) {
    const body = {
      booking_id: payload.booking_id,
      amount: Number(payload.amount || 0),
      payment_status: payload.payment_status || 'pending',
      payment_method: payload.payment_method || 'stripe',
    };

    const res = await apiClient.post('/api/payment/createPaymentDB', body);
    return normalizePayment(res.data.data);
  },

  async getPaymentList(filters = {}) {
    const res = await apiClient.post('/api/payment/getListPayments', filters);
    const payload = res.data.data || {};
    const items = Array.isArray(payload.data) ? payload.data : Array.isArray(res.data.data) ? res.data.data : [];

    return {
      data: items.map(normalizePayment).filter(Boolean),
      pagination: payload.pagination || res.data.pagination || null,
    };
  },

  async getLatestPaymentByBookingId(bookingId) {
    if (!bookingId) {
      return null;
    }

    const { data } = await this.getPaymentList({
      booking_id: bookingId,
      page: 1,
      limit: 50,
      sort_by: -1,
    });

    return data[0] || null;
  },

  async ensurePaymentRecord(bookingId, amount, paymentMethod = 'stripe') {
    const existingPayment = await this.getLatestPaymentByBookingId(bookingId);
    if (existingPayment && existingPayment.payment_status === 'pending') {
      return existingPayment;
    }

    return this.createPaymentRecord({
      booking_id: bookingId,
      amount,
      payment_status: 'pending',
      payment_method: paymentMethod,
    });
  },

  async createPaymentIntent(bookingId) {
    if (!bookingId) {
      throw new Error('Missing booking id for payment intent.');
    }

    const res = await apiClient.post(`/api/booking/${bookingId}/createPayment`);
    const data = res.data.data || {};

    return {
      ...normalizePayment(data),
      clientSecret: data.client_secret || data.clientSecret || '',
      paymentIntentId: data.stripe_payment_intent_id || data.stripePaymentIntentId || '',
    };
  },

  async getPaymentState(bookingId) {
    if (!bookingId) {
      return normalizePaymentState({});
    }

    const res = await apiClient.get(`/api/payment/getPaymentState/${bookingId}`);
    return normalizePaymentState(res.data.data || {});
  },

  async syncPaymentIntent(paymentIntentId) {
    if (!paymentIntentId) {
      throw new Error('Missing payment intent id.');
    }

    const res = await apiClient.post('/api/payment/sync-intent', { paymentIntentId });
    return res.data.data || {};
  },

  async verifyPaymentIntent(bookingId, paymentIntentId) {
    if (!bookingId || !paymentIntentId) {
      throw new Error('Missing payment verification data.');
    }

    const syncResult = await this.syncPaymentIntent(paymentIntentId);
    const paymentState = await this.getPaymentState(bookingId);

    const success =
      syncResult.paymentStatus === 'successful'
      || paymentState.paymentStatus === 'successful'
      || paymentState.bookingStatus === 'paid';

    return {
      success,
      syncResult,
      paymentState,
    };
  },
};

export default paymentService;
