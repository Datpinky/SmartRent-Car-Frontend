const bookingService = require("../services/booking.service");
const bookingPaymentService = require("../services/bookingPayment.service");

class BookingController {
  async createBooking(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = { ...req.body, user_id: req.body.user_id || userId };
      const result = await bookingService.createBooking(data);
      return res.status(201).json({ message: "Tạo booking thành công", data: result });
    } catch (error) {
      next(error);
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
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      const { bookingId } = req.params;
      const booking = await bookingService.getBookingById(bookingId, { populate: true });

      if (!booking) return res.status(404).json({ message: "Không tìm thấy booking" });

      const sid = booking.showroom_id?._id?.toString() || booking.showroom_id?.toString();
      const uid = booking.user_id?._id?.toString() || booking.user_id?.toString();
      const isAdmin = req.user?.role === "admin";
      const isRenter = req.user?.role !== "showroom" && req.user?.role !== "admin" && uid === String(req.user?.userId);
      const isShowroom = req.user?.role === "showroom" && sid === String(req.user?.userId);
      if (!isAdmin && !isRenter && !isShowroom) {
        return res.status(403).json({ message: "Không có quyền xem booking này" });
      }

      return res.status(200).json({ message: "Lấy thông tin booking thành công", data: booking });
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req, res, next) {
    const { vehicleId, pickupDate, returnDate, excludeBookingId } = req.body;
    try {
      const result = await bookingService.checkAvailability(vehicleId, pickupDate, returnDate, excludeBookingId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;

      const existing = await bookingService.getBookingById(bookingId);
      if (!existing) return res.status(404).json({ message: "Không tìm thấy booking" });

      const sid = existing.showroom_id?.toString();
      if (req.user?.role === "showroom" && sid !== String(req.user?.userId)) {
        return res.status(403).json({ message: "Không có quyền cập nhật booking này" });
      }
      if (req.user?.role !== "admin" && req.user?.role !== "showroom") {
        const uid = existing.user_id?._id?.toString() || existing.user_id?.toString();
        if (uid !== String(req.user?.userId)) {
          return res.status(403).json({ message: "Không có quyền cập nhật booking này" });
        }
        if (status !== "cancelled") {
          return res.status(403).json({ message: "Khách thuê chỉ có thể hủy đặt xe" });
        }
        const allowedCancelFrom = ["pending", "confirmed", "waiting_payment"];
        if (!allowedCancelFrom.includes(existing.status)) {
          return res.status(400).json({ message: "Không thể hủy ở trạng thái hiện tại" });
        }
      }

      const booking = await bookingService.updateBookingStatus(bookingId, status);
      return res.status(200).json({ message: "Cập nhật trạng thái booking thành công", data: booking });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const result = await bookingService.getMyBookings(userId, role);
      return res.status(200).json({ message: "Lấy danh sách booking của bạn thành công", data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const role = req.user.role;
      const userId = req.user.userId;
      const result = await bookingPaymentService.cancelBooking(bookingId, userId, role);
      if (!result) return res.status(404).json({ message: "Không tìm thấy booking để hủy" });
      return res.status(200).json({ message: "Hủy booking thành công", data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      await bookingService.deleteBooking(bookingId);
      return res.status(200).json({ message: "Xóa booking thành công" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();