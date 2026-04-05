import api from './api';

/**
 * vehicleHireService – gọi API /api/hires
 * Mapping với VehicleHire model trong DB:
 *   release   : Date – ngày nhận xe
 *   due_back  : Date – ngày trả dự kiến
 *   return    : Date – ngày thực tế trả
 *   hirer     : ObjectId (User)
 *   vehicle   : ObjectId (Vehicle)
 *   paid      : Boolean
 *   status    : pending | confirmed | active | completed | cancelled
 */

// POST /api/hires  — Tạo đơn thuê xe
export const createHire = async (hireData) => {
  // hireData: { vehicle_id, release, due_back, vehicle_hire_charge_timing?, plus_code? }
  const response = await api.post('/hires', hireData);
  return response.data; // { message, data: hire }
};

// GET /api/hires/my  — Đơn thuê của người đang đăng nhập
export const getMyHires = async () => {
  const response = await api.get('/hires/my');
  return response.data; // { message, data: [...hires] }
};

// GET /api/hires?status=pending  — Admin / showroom xem tất cả
export const getAllHires = async (params = {}) => {
  const response = await api.get('/hires', { params });
  return response.data;
};

// PATCH /api/hires/:id/status  — Cập nhật trạng thái đơn
export const updateHireStatus = async (hireId, status) => {
  const response = await api.patch(`/hires/${hireId}/status`, { status });
  return response.data;
};
