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

  async getListBookings(req, res, next) {
    try {
        const filters = req.body;
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
      console.log(result);


      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy booking",
        });
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
      const role = req.user.role;
      const userId = req.user.userId;
      const result = await bookingPaymentService.cancelBooking(bookingId, userId , role);
      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy booking để hủy",
        });
      }
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