const BookingService = require('../services/booking.service');

class BookingController {
  async createBooking(req, res, next) {
    try {
      const { vehicle_id, showroom_id, start_date, end_date, total_price, note } = req.body;
      const user_id = req.user.userId;

      const booking = await BookingService.createBooking({
        user_id,
        vehicle_id,
        showroom_id,
        start_date,
        end_date,
        total_price,
        note: note || ''
      });

      return res.status(201).json({
        message: 'Tạo booking thành công',
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req, res, next) {
    try {
      const filters = { ...req.body };

      // Only allow users to see their own bookings (unless admin)
      if (req.user.role !== 'admin' && req.user.role !== 'showroom') {
        filters.user_id = req.user.userId;
      }

      const result = await BookingService.getAllBookings(filters);

      return res.status(200).json({
        message: 'Lấy danh sách booking thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      const { bookingId } = req.params;
      const booking = await BookingService.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: 'Không tìm thấy booking' });
      }

      return res.status(200).json({
        message: 'Lấy booking thành công',
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;

      const booking = await BookingService.updateBookingStatus(bookingId, status);

      return res.status(200).json({
        message: 'Cập nhật trạng thái booking thành công',
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      await BookingService.deleteBooking(bookingId);

      return res.status(200).json({ message: 'Xóa booking thành công' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
