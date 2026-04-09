import apiClient from './apiClient';

const bookingService = {
  async createBooking(data) {
    const res = await apiClient.post('/api/booking/createBooking', data);
    return res.data?.data ?? res.data;
  },

  async getListBookings(filters = {}) {
    const res = await apiClient.post('/api/booking/getListBookings', filters);
    return res.data?.data ?? res.data;
  },

  async getBookingById(bookingId) {
    const res = await apiClient.get(`/api/booking/getBookingById/${bookingId}`);
    return res.data?.data ?? res.data;
  },

  async updateBookingStatus(bookingId, status) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${bookingId}`, { status });
    return res.data?.data ?? res.data;
  },
};

export default bookingService;
