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

      // Showroom chỉ thấy booking của chính showroom (ObjectId = userId)
      if (req.user.role === 'showroom') {
        filters.showroom_id = req.user.userId;
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
      const booking = await BookingService.getBookingById(bookingId, { populate: true });

      if (!booking) {
        return res.status(404).json({ message: 'Không tìm thấy booking' });
      }

      const sid = booking.showroom_id?._id?.toString() || booking.showroom_id?.toString();
      const uid = booking.user_id?._id?.toString() || booking.user_id?.toString();
      const isAdmin = req.user.role === 'admin';
      const isRenter = req.user.role !== 'showroom' && req.user.role !== 'admin' && uid === req.user.userId.toString();
      const isShowroom = req.user.role === 'showroom' && sid === req.user.userId.toString();
      if (!isAdmin && !isRenter && !isShowroom) {
        return res.status(403).json({ message: 'Không có quyền xem booking này' });
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

      const existing = await BookingService.getBookingById(bookingId);
      if (!existing) {
        return res.status(404).json({ message: 'Không tìm thấy booking' });
      }
      const sid = existing.showroom_id?.toString();
      if (req.user.role === 'showroom' && sid !== req.user.userId.toString()) {
        return res.status(403).json({ message: 'Không có quyền cập nhật booking này' });
      }
      if (req.user.role !== 'admin' && req.user.role !== 'showroom') {
        const uid =
          existing.user_id?._id?.toString() ||
          existing.user_id?.toString();
        if (uid !== req.user.userId.toString()) {
          return res.status(403).json({ message: 'Không có quyền cập nhật booking này' });
        }
        if (status !== 'cancelled') {
          return res.status(403).json({ message: 'Khách thuê chỉ có thể hủy đặt xe' });
        }
        const allowedCancelFrom = ['pending', 'confirmed', 'waiting_payment'];
        if (!allowedCancelFrom.includes(existing.status)) {
          return res.status(400).json({ message: 'Không thể hủy ở trạng thái hiện tại' });
        }
      }

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
