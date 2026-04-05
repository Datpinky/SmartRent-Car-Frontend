import api from './api';

/**
 * vehicleService – gọi API /api/vehicles
 * Mapping với Vehicle model trong DB:
 *   vehicle_type, vehicle_brand, vehicle_model
 *   vehicle_image_path (Array)
 *   vehicle_hire_rate_in_figures, vehicle_hire_rate_currency
 *   vehicle_hire_charge_per_timing
 *   status: available | hired | maintenance | pending
 */

// GET /api/vehicles?status=available&vehicle_brand=Toyota
export const getAllVehicles = async (params = {}) => {
  const response = await api.get('/vehicles', { params });
  return response.data; // { message, data: [...vehicles] }
};

// GET /api/vehicles/:id
export const getVehicleById = async (id) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data; // { message, data: { ...vehicle, location } }
};

// GET /api/vehicles/my/list  (cần token + role owner/admin)
export const getMyVehicles = async () => {
  const response = await api.get('/vehicles/my/list');
  return response.data;
};

// POST /api/vehicles  (cần token + role owner/admin)
export const createVehicle = async (vehicleData) => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data;
};

// PUT /api/vehicles/:id
export const updateVehicle = async (id, vehicleData) => {
  const response = await api.put(`/vehicles/${id}`, vehicleData);
  return response.data;
};

// DELETE /api/vehicles/:id
export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};
