const Contract = require('../models/contract.model');
const BaseService = require('./base.service');
const throwError = require('../utils/throwError');

class ContractService {
  static async list(body = {}) {
    const { showroom_id, status, type, page, limit } = body;
    const pagination = BaseService.parsePagination({ page, limit });
    const filter = {};
    if (showroom_id) filter.showroom_id = showroom_id;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const sort = { updatedAt: -1 };
    const [data, total] = await Promise.all([
      Contract.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate({
          path: 'booking_id',
          select: 'start_date end_date total_price status user_id',
          populate: { path: 'user_id', select: 'name email phone' },
        })
        .populate({ path: 'vehicle_id', select: 'vehicle_name vehicle_brand vehicle_model' })
        .populate({ path: 'renter_id', select: 'name email phone' })
        .lean(),
      Contract.countDocuments(filter),
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

  static async getById(id) {
    return Contract.findById(id)
      .populate({
        path: 'booking_id',
        select: 'start_date end_date total_price status user_id',
        populate: { path: 'user_id', select: 'name email phone' },
      })
      .populate({ path: 'vehicle_id', select: 'vehicle_name vehicle_brand vehicle_model' })
      .populate({ path: 'renter_id', select: 'name email phone' })
      .lean();
  }

  static async create(payload) {
    const doc = await Contract.create(payload);
    return Contract.findById(doc._id)
      .populate({
        path: 'booking_id',
        select: 'start_date end_date total_price status user_id',
        populate: { path: 'user_id', select: 'name email phone' },
      })
      .populate({ path: 'vehicle_id', select: 'vehicle_name vehicle_brand vehicle_model' })
      .populate({ path: 'renter_id', select: 'name email phone' })
      .lean();
  }

  static async assertShowroomOwns(contractId, showroomUserId) {
    const c = await Contract.findById(contractId).select('showroom_id').lean();
    if (!c) throwError('Không tìm thấy hợp đồng', 404);
    if (String(c.showroom_id) !== String(showroomUserId)) {
      throwError('Không có quyền truy cập hợp đồng này', 403);
    }
    return c;
  }
}

module.exports = ContractService;
