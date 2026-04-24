const VehicleDamageInspectionService = require('../services/vehicleDamageInspection.service');

class VehicleDamageInspectionController {
  async list(req, res, next) {
    try {
      const body = { ...req.body };
      if (req.user.role === 'showroom') {
        body.showroom_id = req.user.userId;
      }
      const result = await VehicleDamageInspectionService.list(body);
      return res.status(200).json({ message: 'OK', data: result });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      if (req.user.role !== 'showroom' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ showroom hoặc admin có thể lưu báo cáo' });
      }
      const showroom_id = req.user.role === 'showroom' ? req.user.userId : req.body.showroom_id;
      const { vehicle_id, booking_id, before_image_urls, after_image_urls, ai_payload } = req.body;
      if (!vehicle_id) return res.status(400).json({ message: 'Thiếu vehicle_id' });

      const created = await VehicleDamageInspectionService.create({
        showroom_id,
        vehicle_id,
        booking_id: booking_id || null,
        before_image_urls: Array.isArray(before_image_urls) ? before_image_urls : [],
        after_image_urls: Array.isArray(after_image_urls) ? after_image_urls : [],
        ai_payload: ai_payload && typeof ai_payload === 'object' ? ai_payload : {},
        created_by: req.user.userId,
      });
      return res.status(201).json({ message: 'Đã lưu báo cáo kiểm tra', data: created });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new VehicleDamageInspectionController();
