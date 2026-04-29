const rentalContractService = require('../services/rentalContract.service');
const BookingModel = require('../models/booking.model');

class RentalContractController {
  async getByBookingId(req, res, next) {
    try {
      const { bookingId } = req.params;
      const actorId = String(req.user?.userId || '');
      const role = req.user?.role || '';
      const isAdmin = role === 'admin';

      if (!isAdmin) {
        const booking = await BookingModel.findById(bookingId).select('user_id showroom_id').lean();
        if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });

        const isRenter = String(booking.user_id || '') === actorId;
        const isShowroom = role === 'showroom' && String(booking.showroom_id || '') === actorId;

        if (!isRenter && !isShowroom) {
          return res.status(403).json({ message: 'Không có quyền xem hợp đồng này' });
        }
      }

      const data = await rentalContractService.buildContract(bookingId);
      return res.status(200).json({
        message: 'Lấy dữ liệu hợp đồng thuê xe thành công',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RentalContractController();
