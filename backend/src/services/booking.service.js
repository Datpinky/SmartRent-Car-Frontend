const BookingModel = require('../models/booking.model');
const BaseService = require('./base.service');
const throwError = require('../utils/throwError');
const QueryBuilder = require('../utils/queryBuilder');

const BOOKING_VALID_TRANSITIONS = {
  'pending': ['waiting_payment', 'paid', 'confirmed', 'cancelled'],
  'waiting_payment': ['paid', 'cancelled'],
  'paid': ['confirmed', 'cancel_pending'],
  'confirmed': ['waiting_handover', 'cancel_pending'],
  'waiting_handover': ['handed_over', 'cancel_pending'],
  'cancel_pending': ['cancelled', 'cancel_failed'], // Đang refund -> Thành công hoặc Lỗi
  'cancel_failed': ['cancelled', 'cancel_pending'],  // Lỗi -> Cho phép Admin thử lại (pending) hoặc đóng bằng tay (cancelled)
  'handed_over': ['in_use'],
  'in_use': ['waiting_return_confirmation'],
  'waiting_return_confirmation': ['completed'],
  'completed': [],
  'cancelled': []
};

const CAN_BE_CANCELLED = ['pending', 'waiting_payment', 'paid', 'confirmed'];

const IGNORED_OVERLAP_STATUSES = [
  'cancelled',
  'completed'
];

class BookingService {

  static async createBooking(data, currentUserId = '') {
    const payload = {
      ...data,
      user_id: data.user_id || currentUserId,
    };
    const booking = new BookingModel(payload);
    return booking.save();
  }

  static async getMyBookings(userId, role) {
    if (role === 'user' || role === 'renter' || role === 'owner') {
      return BookingModel.find({ user_id: userId })
        .populate('showroom_id', 'name email')
        .populate('vehicle_id')
    }
    else if (role === 'showroom') {
      return BookingModel.find({ showroom_id: userId })
        .populate('user_id', 'name email')
        .populate('vehicle_id');
    }
    else if (role === 'admin') {
      return BookingModel.find({ $or: [{ user_id: userId }, { showroom_id: userId }] })
        .populate('user_id')
        .populate('showroom_id')
        .populate('vehicle_id');
    }
    else {
      throwError('Role không hợp lệ', 400);
    }
  }



  static isOverlapping = (existingStart, existingEnd, newPickup, newReturn) => {
    return (
      existingStart.getTime() < newReturn.getTime() &&
      newPickup.getTime() < existingEnd.getTime()
    );
  };


  static async checkAvailability(vehicleId, pickupDate, returnDate, excludeBookingId) {
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    if (pickup >= returnD) {
      throwError("Ngày trả phải sau ngày nhận", 400);
    }

    const bookings = await BookingModel.find({
      vehicle_id: vehicleId,
      status: { $nin: IGNORED_OVERLAP_STATUSES },
      _id: { $ne: excludeBookingId }
    });

    const overlapping = bookings.filter(booking =>
      this.isOverlapping(booking.start_date, booking.end_date, pickup, returnD)
    );

    return {
      isAvailable: overlapping.length === 0,
      overlappingBookings: overlapping.map(b => ({
        bookingId: b._id,
        startDate: b.start_date,
        endDate: b.end_date,
        status: b.status
      })),
      message: overlapping.length > 0
        ? `Xe đã có ${overlapping.length} lịch thuê chồng lấn`
        : "Xe trống trong khoảng thời gian này"
    };
  }


  static async getListBookings(body = {}) {
    const { search, status, user_id, showroom_id, sort_by, sort_by_price, page, limit } = body;

    const pagination = BaseService.parsePagination({ page, limit });

    const searchFilter = QueryBuilder.buildSearchFilter(search, { note: 1 });
    const fieldFilter = QueryBuilder.buildExactFieldFilter({ status, user_id, showroom_id });

    // const filter = { ...searchFilter, ...fieldFilter };
    const filter = { $and: [searchFilter, fieldFilter] };
    const sortOptions = QueryBuilder.buildSortOptions([
      { field: 'total_price', value: sort_by_price },
      { field: 'createdAt', value: sort_by }
    ]);


    // Find paginated
    return BaseService.findPaginated(BookingModel, filter, sortOptions, pagination);
  }

  static async getBookingById(id) {
    return BookingModel.findById(id)
  }

  static assertValidBookingTransition(oldStatus, newStatus) {
    const allowedTransitions = BOOKING_VALID_TRANSITIONS[oldStatus] || [];

    if (oldStatus !== newStatus && !allowedTransitions.includes(newStatus)) {
      const allowedText = allowedTransitions.length
        ? `[${allowedTransitions.join(', ')}]`
        : 'KHÔNG CÓ (trạng thái cuối, không thể chuyển tiếp)';

      throwError(
        `Không thể chuyển Booking từ "${oldStatus}" → "${newStatus}". ` +
        `Các trạng thái hợp lệ: ${allowedText}`,
        400
      );
    }
  }


  static async cancelBooking(bookingId, options = {}) {
    const { session } = options;
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throwError('Không tìm thấy booking', 404);
    }
    if (booking.status === 'cancelled') {
      throwError('Booking đã được hủy trước đó');
    }
    if (!CAN_BE_CANCELLED.includes(booking.status)) {
      throwError(`Không thể hủy booking ở trạng thái ${booking.status}`, 400);
    }

    BookingService.assertValidBookingTransition(booking.status, 'cancelled');
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      {
        note: `Đã hủy vào lúc ${new Date().toISOString()}`,
        status: 'cancelled'
      },
      { new: true, session: session ? session : null }
    );

    if (!updatedBooking) {
      throwError('Không thể cập nhật booking', 404);
    }

    return {
      bookingId,
      bookingStatus: updatedBooking.status,
      note: updatedBooking.note
    };
  }


  static async updateBookingStatus(id, newStatus, options = {}) {
    const booking = await BookingModel.findById(id);
    if (!booking) throwError('Booking không tồn tại');

    const oldStatus = booking.status;

    const validEnumStatuses = BookingModel.schema.path('status').enumValues;
    if (!validEnumStatuses.includes(newStatus)) {
      throwError(`Trạng thái "${newStatus}" không tồn tại trong hệ thống`);
    }
    this.assertValidBookingTransition(oldStatus, newStatus);

    booking.status = newStatus;

    return await booking.save(options);
  }

 



  static async deleteBooking(id) {
    return BookingModel.findByIdAndDelete(id);
  }
}

module.exports = BookingService;