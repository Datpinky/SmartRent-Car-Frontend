import apiClient from './apiClient';

export const bookingService = {
  /**
   * Tạo booking mới (Checkout)
   * payload: { vehicle_id, start_date, end_date, total_price, payment_method, delivery_type, delivery_address, note }
   */
  async createBooking(payload) {
    const res = await apiClient.post('/api/bookings/create', payload);
    return res.data.data;
  },

  /**
   * Renter lấy danh sách booking của mình
   */
  async getMyBookings() {
    const res = await apiClient.get('/api/bookings/my');
    return res.data.data || [];
  },

  /**
   * Lay danh sach booking kem thong tin payment tu API chi tiet.
   * Giup renter page hien thi du lieu day du hon ma khong can doi backend.
   */
  async getMyBookingsDetailed() {
    const bookings = await this.getMyBookings();

    const detailResults = await Promise.allSettled(
      bookings.map((booking) => this.getBookingById(booking._id || booking.id))
    );

    return bookings.map((booking, index) => {
      const detailResult = detailResults[index];
      if (detailResult.status !== 'fulfilled') {
        return { ...booking, payment: null };
      }

      const detail = detailResult.value || {};
      return {
        ...(detail.booking || booking),
        payment: detail.payment || null,
      };
    });
  },

  /**
   * Lấy chi tiết 1 booking
   */
  async getBookingById(id) {
    const res = await apiClient.get(`/api/bookings/${id}`);
    return res.data.data;
  },

  /**
   * Renter hủy booking
   */
  async cancelBooking(id) {
    const res = await apiClient.patch(`/api/bookings/${id}/cancel`);
    return res.data.data;
  },

  /**
   * Showroom lấy danh sách booking gửi đến mình
   */
  async getShowroomBookings(filters = {}) {
    const res = await apiClient.get('/api/bookings/showroom/all', { params: filters });
    return res.data.data || [];
  },

  /**
   * Showroom cập nhật trạng thái booking
   */
  async updateBookingStatus(id, status) {
    const res = await apiClient.patch(`/api/bookings/${id}/status`, { status });
    return res.data.data;
  }
};

export default bookingService;
