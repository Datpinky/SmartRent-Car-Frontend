const Booking = require('../models/booking.model');
const BaseService = require('./base.service');
const throwError = require('../utils/throwError');

class QueryBuilder {
  static buildExactFieldFilter(filters = {}) {
    const filter = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        filter[key] = value;
      }
    }
    return filter;
  }

  static buildSearchFilter(search, fields = []) {
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      return { $or: fields.map((field) => ({ [field]: regex })) };
    }
    return {};
  }

  static buildSortOptions(sorts = []) {
    const sort = {};
    for (const { field, value } of sorts) {
      const direction = BaseService.parseSortDirection(value);
      if (direction !== null) {
        sort[field] = direction;
      }
    }
    return sort;
  }
}

class BookingService {
  static async createBooking(data) {
    const booking = new Booking(data);
    return booking.save();
  }

  static async getAllBookings(body = {}) {
    const { search, status, user_id, showroom_id, sort_by, sort_by_price, page, limit } = body;

    const pagination = BaseService.parsePagination({ page, limit });
    const searchFilter = QueryBuilder.buildSearchFilter(search, ['note']);
    const fieldFilter = QueryBuilder.buildExactFieldFilter({ status, user_id, showroom_id });
    const filter = { $and: [searchFilter, fieldFilter] };
    const sortOptions = QueryBuilder.buildSortOptions([
      { field: 'total_price', value: sort_by_price },
      { field: 'createdAt', value: sort_by }
    ]);

    return BaseService.findPaginated(Booking, filter, sortOptions, pagination);
  }

  static async getBookingById(id) {
    return Booking.findById(id);
  }

  static async updateBookingStatus(id, status) {
    const booking = await Booking.findById(id);
    if (!booking) throwError('Booking không tồn tại');

    const validStatuses = Booking.schema.path('status').enumValues;
    if (!validStatuses || !validStatuses.includes(status)) {
      throw new Error(`Trạng thái "${status}" không hợp lệ`);
    }

    booking.status = status;
    return booking.save();
  }

  static async deleteBooking(id) {
    return Booking.findByIdAndDelete(id);
  }
}

module.exports = BookingService;
