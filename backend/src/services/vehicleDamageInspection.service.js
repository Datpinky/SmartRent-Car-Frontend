const VehicleDamageInspection = require('../models/vehicleDamageInspection.model');
const BaseService = require('./base.service');

class VehicleDamageInspectionService {
  static async list(body = {}) {
    const { showroom_id, vehicle_id, page, limit } = body;
    const pagination = BaseService.parsePagination({ page, limit });
    const filter = {};
    if (showroom_id) filter.showroom_id = showroom_id;
    if (vehicle_id) filter.vehicle_id = vehicle_id;

    const sort = { createdAt: -1 };
    const [data, total] = await Promise.all([
      VehicleDamageInspection.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate({ path: 'vehicle_id', select: 'vehicle_name vehicle_brand vehicle_model' })
        .populate({ path: 'booking_id', select: 'start_date end_date status' })
        .populate({ path: 'created_by', select: 'name email' })
        .lean(),
      VehicleDamageInspection.countDocuments(filter),
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

  static async create(payload) {
    const doc = await VehicleDamageInspection.create(payload);
    return VehicleDamageInspection.findById(doc._id)
      .populate({ path: 'vehicle_id', select: 'vehicle_name vehicle_brand vehicle_model' })
      .populate({ path: 'booking_id', select: 'start_date end_date status' })
      .populate({ path: 'created_by', select: 'name email' })
      .lean();
  }
}

module.exports = VehicleDamageInspectionService;
