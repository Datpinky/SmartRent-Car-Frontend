const ContractService = require('../services/contract.service');
const throwError = require('../utils/throwError');

class ContractController {
  async list(req, res, next) {
    try {
      const body = { ...req.body };
      if (req.user.role === 'showroom') {
        body.showroom_id = req.user.userId;
      } else if (req.user.role !== 'admin' && body.showroom_id === undefined) {
        throwError('Không có quyền xem danh sách hợp đồng', 403);
      }
      const result = await ContractService.list(body);
      return res.status(200).json({ message: 'OK', data: result });
    } catch (e) {
      next(e);
    }
  }

  async getById(req, res, next) {
    try {
      const row = await ContractService.getById(req.params.contractId);
      if (!row) return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
      if (req.user.role === 'showroom' && String(row.showroom_id) !== String(req.user.userId)) {
        return res.status(403).json({ message: 'Không có quyền xem hợp đồng này' });
      }
      return res.status(200).json({ message: 'OK', data: row });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      if (req.user.role !== 'showroom' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ showroom hoặc admin có thể tạo hợp đồng' });
      }
      const showroom_id = req.user.role === 'showroom' ? req.user.userId : req.body.showroom_id;
      if (!showroom_id) return res.status(400).json({ message: 'Thiếu showroom_id' });

      const created = await ContractService.create({
        showroom_id,
        booking_id: req.body.booking_id || null,
        renter_id: req.body.renter_id || null,
        vehicle_id: req.body.vehicle_id || null,
        type: req.body.type || 'rental',
        status: req.body.status || 'draft',
        pdf_url: req.body.pdf_url || '',
        metadata: req.body.metadata || {},
      });
      return res.status(201).json({ message: 'Đã tạo hợp đồng', data: created });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new ContractController();
