const bookingService = require("../services/booking.service");
const bookingPaymentService = require("../services/bookingPayment.service");

class BookingController {
  async createBooking(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = req.body;
      const result = await bookingService.createBooking(data, userId);
      return res.status(201).json({
        message: "Tạo booking thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  async cancelBookingWithRefund(req, res, next) {
    try {
      const { bookingId } = req.params;
      const result = await bookingPaymentService.cancelBookingWithRefund(bookingId, {
        userId: req.user?.userId,
        role: req.user?.role,
      });

      return res.status(200).json({
        success: true,
        message: 'Booking đã được hủy và thực hiện hoàn tiền (nếu có).',
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  }



  async getListBookings(req, res, next) {
    try {
        const filters = { ...(req.body || {}) };

        if (req.user?.role !== "admin" && req.user?.role !== "showroom") {
          filters.user_id = req.user.userId;
        }
        if (req.user?.role === "showroom") {
          filters.showroom_id = req.user.userId;
        }

        const result = await bookingService.getListBookings(filters);

        return res.status(200).json({
            message: "Lấy danh sách booking thành công",
            ...result
        });
    } catch (error) {
        next(error);
    }
}


  async getBookingById(req, res, next) {
    try {
      const { bookingId } = req.params;
      const result = await bookingService.getBookingById(bookingId);

      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy booking",
        });
      }

      const showroomId = result.showroom_id?._id?.toString() || result.showroom_id?.toString();
      const renterId = result.user_id?._id?.toString() || result.user_id?.toString();
      const actorId = String(req.user?.userId || '');
      const isAdmin = req.user?.role === "admin";
      const isRenter = !["showroom", "admin"].includes(req.user?.role) && renterId === actorId;
      const isShowroom = req.user?.role === "showroom" && showroomId === actorId;

      if (!isAdmin && !isRenter && !isShowroom) {
        return res.status(403).json({ message: "Không có quyền xem booking này" });
      }

      return res.status(200).json({
        message: "Lấy thông tin booking thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }


/**
 * Kiểm tra xem xe có sẵn trong khoảng thời gian yêu cầu hay không.
 * @description
 * Dùng để kiểm tra khoảng thời gian **mới (proposed dates)** mà user muốn đặt hoặc sửa booking.
 * @property [req.body.excludeBookingId] - ID của booking cần bỏ qua khi kiểm tra trùng lịch.
 *   - Khi **chỉnh sửa booking hiện có**: bắt buộc phải truyền chính ID của booking đó,
 *     nếu không hệ thống sẽ tính nó là trùng với chính nó và trả về kết quả sai.
 *     Ví dụ: đang sửa booking ID "123" thì truyền excludeBookingId = "123".
 *   - Khi **tạo mới booking**: không cần truyền field này.
 */
  async checkAvailability(req, res, next) {
    const { vehicleId, pickupDate, returnDate, excludeBookingId } = req.body;
    try {
      const result = await bookingService.checkAvailability(vehicleId, pickupDate, returnDate, excludeBookingId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          message: "Trạng thái không được để trống",
        });
      }
      const existing = await bookingService.getBookingById(bookingId);
      if (!existing) {
        return res.status(404).json({ message: "Không tìm thấy booking để cập nhật" });
      }

      const actorId = String(req.user?.userId || '');
      const showroomId = existing.showroom_id?.toString();
      const renterId = existing.user_id?._id?.toString() || existing.user_id?.toString();
      const isAdmin = req.user?.role === 'admin';
      const isShowroom = req.user?.role === 'showroom';
      const isRenter = !isAdmin && !isShowroom;

      if (isShowroom && showroomId !== actorId) {
        return res.status(403).json({ message: "Không có quyền cập nhật booking này" });
      }

      if (isRenter) {
        if (renterId !== actorId) {
          return res.status(403).json({ message: "Không có quyền cập nhật booking này" });
        }

        if (status !== 'cancelled') {
          return res.status(403).json({ message: "Khách thuê chỉ có thể hủy booking" });
        }
      }

      const result = await bookingService.updateBookingStatus(bookingId, status);
      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy booking để cập nhật",
        });
      }
      
      return res.status(200).json({
        message: "Cập nhật trạng thái booking thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const result = await bookingService.getMyBookings(userId, role);
      return res.status(200).json({
        message: "Lấy danh sách booking của bạn thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const existing = await bookingService.getBookingById(bookingId);
      if (!existing) {
        return res.status(404).json({
          message: "Không tìm thấy booking để hủy",
        });
      }

      const actorId = String(req.user?.userId || '');
      const showroomId = existing.showroom_id?.toString();
      const renterId = existing.user_id?._id?.toString() || existing.user_id?.toString();
      const isAdmin = req.user?.role === 'admin';
      const isShowroom = req.user?.role === 'showroom';
      const isRenter = !isAdmin && !isShowroom;

      if (isShowroom && showroomId !== actorId) {
        return res.status(403).json({ message: "Không có quyền hủy booking này" });
      }
      if (isRenter && renterId !== actorId) {
        return res.status(403).json({ message: "Không có quyền hủy booking này" });
      }

      const result = await bookingService.cancelBooking(bookingId);
      return res.status(200).json({
        message: "Hủy booking thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }


  async deleteBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const result = await bookingService.deleteBooking(bookingId);
      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy booking để xóa",
        });
      }
      return res.status(200).json({
        message: "Xóa booking thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();