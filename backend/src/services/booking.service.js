const BookingModel = require('../models/booking.model');
const BaseService = require('./base.service');
const throwError = require('../utils/throwError');
const QueryBuilder = require('../utils/queryBuilder');
const PaymentModel = require('../models/payment.model');
const PaymentService = require('./payment.service');

const BOOKING_VALID_TRANSITIONS = {
  'pending': ['waiting_payment', 'paid', 'confirmed', 'cancelled'],
  'waiting_payment': ['paid', 'cancelled'],
  'paid': ['confirmed', 'cancelled'],
  'confirmed': ['waiting_handover', 'cancelled'],
  'waiting_handover': ['handed_over', 'cancelled'],
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

const populateBooking = (q) =>
  q
    .populate({ path: 'user_id', select: 'name email phone' })
    .populate({
      path: 'vehicle_id',
      select: 'vehicle_name vehicle_brand vehicle_model vehicle_images_paths address',
    })
    .populate({ path: 'showroom_id', select: 'name email business_name phone' });

class BookingService {

  static async createBooking(data) {
    const booking = new BookingModel(data);
    return booking.save();
  }

  static async getMyBookings(userId, role) {
    if (role === 'user' || role === 'owner') {
      return BookingModel.find({ user_id: userId })
        .populate('showroom_id', 'name email phone business_name showroom_status is_active')
        .populate('vehicle_id')
    }
    else if (role === 'showroom') {
      return BookingModel.find({ showroom_id: userId })
        .populate('user_id', 'name email phone is_active')
        .populate('vehicle_id');
    }
    else if (role === 'admin') {
      return BookingModel.find({ $or: [{ user_id: userId }, { showroom_id: userId }] })
        .populate('user_id', 'name email phone role is_active')
        .populate('showroom_id', 'name email phone role business_name showroom_status is_active')
        .populate('vehicle_id');
    }
    else {
      throwError('Role không hợp lệ', 400);
    }
  }

  static async validateCancelBooking(bookingId, userId, role) {
    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      throwError('Không tìm thấy booking', 404);
    }

    const isUser = String(booking.user_id) === String(userId) && role === 'user';
    const isShowroom = String(booking.showroom_id) === String(userId) && role === 'showroom';
    const adminRole = role === 'admin';

    if (!isUser && !isShowroom && !adminRole) {
      throwError('Bạn không có quyền hủy booking này', 403);
    }

    if (booking.status === 'cancelled') {
      throwError('Booking đã được hủy trước đó');
    }

    if (!CAN_BE_CANCELLED.includes(booking.status)) {
      throwError(`Không thể hủy booking ở trạng thái ${booking.status}`, 400);
    }

    return booking;
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
    const sort = Object.keys(sortOptions).length ? sortOptions : { createdAt: -1 };

    const [data, total] = await Promise.all([
      populateBooking(BookingModel.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit)).lean(),
      BookingModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit) || 0,
      },
    };
  }

  static async getBookingById(id, options = {}) {
    const q = BookingModel.findById(id);
    if (options.populate) populateBooking(q);
    return q.lean();
  }


  static async updateBookingStatus(id, newStatus, options = {}) {
    const booking = await BookingModel.findById(id);
    if (!booking) throw new Error('Booking không tồn tại');

    const oldStatus = booking.status;

    const validEnumStatuses = BookingModel.schema.path('status').enumValues;
    if (!validEnumStatuses.includes(newStatus)) {
      throw new Error(`Trạng thái "${newStatus}" không tồn tại trong hệ thống`);
    }

    const allowedTransitions = BOOKING_VALID_TRANSITIONS[oldStatus] || [];

    if (oldStatus !== newStatus && !allowedTransitions.includes(newStatus)) {
      const allowedText = allowedTransitions.length
        ? `[${allowedTransitions.join(', ')}]`
        : 'KHÔNG CÓ (trạng thái cuối, không thể chuyển tiếp)';

      throwError(`Không thể chuyển Booking từ "${oldStatus}" → "${newStatus}". ` +
        `Các trạng thái hợp lệ: ${allowedText}`
        , 400);
    }

    booking.status = newStatus;

    return await booking.save(options);
  }

  static async deleteBooking(id) {
    return BookingModel.findByIdAndDelete(id);
  }
}

module.exports = BookingService;
