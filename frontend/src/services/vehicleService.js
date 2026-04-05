import apiClient from './apiClient';

// ─── Mapping helpers ──────────────────────────────────────────────────────────

const FUEL_MAP = {
  petrol: 'Xăng',
  diesel: 'Dầu',
  electric: 'Điện',
  hybrid: 'Hybrid',
  others: 'Khác',
};

const TRANS_MAP = {
  manual: 'Số sàn',
  automatic: 'Số tự động',
  'semi-auto': 'Bán tự động',
};

const STATUS_MAP = {
  available: 'Còn xe',
  waiting_handover: 'Chờ bàn giao',
  rented: 'Đang thuê',
  maintenance: 'Bảo dưỡng',
  reserved: 'Đã đặt',
};

/**
 * Maps a backend Vehicle document to the shape expected by frontend components.
 * This is the central adapter – update here if either schema changes.
 */
export function mapVehicle(v) {
  const name =
    v.vehicle_name ||
    [v.vehicle_brand || v.brand, v.vehicle_model || v.model].filter(Boolean).join(' ') ||
    'Xe không tên';

  const images = [...(v.vehicle_images_paths || []), ...(v.images || [])].filter(Boolean);

  return {
    // Identifiers (use MongoDB _id as primary)
    _id: v._id,
    id: v._id,

    // Display fields mapped to what CarCard / CarDetail expect
    name,
    brand: v.vehicle_brand || v.brand || '',
    model: v.vehicle_model || v.model || '',
    type: v.vehicle_type || 'Sedan',
    category: v.vehicle_type || 'Sedan',
    fuel: FUEL_MAP[v.fuel_type] || v.fuel_type || 'Xăng',
    transmission: TRANS_MAP[v.transmission] || v.transmission || 'Số tự động',
    seats: v.number_of_seats || 5,

    // Pricing
    price: v.vehicle_hire_rate_in_figures || 0,
    currency: v.vehicle_hire_rate_currency || 'VND',
    chargeUnit: v.vehicle_hire_charge_per_timing || 'day',

    // Media
    image: images[0] || '',
    images,

    // Location (backend stores separately in vehicle_location collection)
    address: v.address || '',
    location: v.location || v.address || '',
    latitude: v.latitude || null,
    longitude: v.longitude || null,

    // Meta
    status: v.status || 'available',
    statusLabel: STATUS_MAP[v.status] || v.status,
    plateNumber: v.vehicle_plate_number || '',
    engineNumber: v.vehicle_engine_number || '',
    vinNumber: v.vehicle_identification_number || '',
    addedBy: v.added_by || null,
    verified: v.verified || null,
    active: v.active !== false,
    companyOwned: v.company_owned || false,

    // UI defaults (enriched when reviews/location data is merged)
    rating: v.rating || 0,
    trips: v.trips || 0,
    showroom: v.showroom || '',
    description: v.description || '',
  };
}

// ─── Service methods ──────────────────────────────────────────────────────────

export const vehicleService = {
  /**
   * Fetch paginated list of vehicles.
   * Params: { search, vehicle_type, added_by, sort_by, sort_by_price, page, limit }
   * Returns: { data: Vehicle[], pagination: { total, page, limit, totalPages } }
   */
  async getList(params = {}) {
    const res = await apiClient.post('/api/vehicles/getListVehicles', params);
    const { data, pagination } = res.data;
    return {
      data: (data || []).map(mapVehicle),
      pagination: pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  /**
   * Fetch a single vehicle by Mongo _id.
   * Returns mapped Vehicle or null.
   */
  async getById(vehicleId) {
    const res = await apiClient.get(`/api/vehicles/getVehicleById/${vehicleId}`);
    const v = res.data?.data;
    return v ? mapVehicle(v) : null;
  },

  /**
   * Create a new vehicle (requires auth).
   * payload: { vehicle_type, vehicle_brand, vehicle_model, vehicle_engine_number,
   *            vehicle_identification_number, vehicle_plate_number, ... }
   */
  async create(payload) {
    const res = await apiClient.post('/api/vehicles/create', payload);
    return mapVehicle(res.data.data);
  },

  /**
   * Delete a vehicle by id (requires auth; currently no role guard in backend).
   */
  async deleteById(vehicleId) {
    const res = await apiClient.delete(`/api/vehicles/deleteVehicleById/${vehicleId}`);
    return res.data;
  },
};

export default vehicleService;
