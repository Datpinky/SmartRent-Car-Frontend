import apiClient from './apiClient';
import { sanitizeImageList } from '../utils/media';

const FUEL_MAP = {
  petrol: 'Xang',
  diesel: 'Dau',
  electric: 'Dien',
  hybrid: 'Hybrid',
  others: 'Khac',
};

const TRANS_MAP = {
  manual: 'So san',
  automatic: 'So tu dong',
  'semi-auto': 'Ban tu dong',
};

const STATUS_MAP = {
  available: 'Con xe',
  waiting_handover: 'Cho ban giao',
  rented: 'Dang thue',
  maintenance: 'Bao duong',
  reserved: 'Da dat',
};

const getMapSize = (value) => {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object') return Object.keys(value).length;
  return 0;
};

const getAverageRating = (ratings, fallback) => {
  if (typeof fallback === 'number' && fallback > 0) return fallback;
  if (!ratings || typeof ratings !== 'object') return 0;

  const values = Object.values(ratings)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
};

const getVehicleDisplayName = (vehicle = {}) => {
  const typeLabel = vehicle.vehicle_type === 'others'
    ? vehicle.vehicle_type_if_others
    : vehicle.vehicle_type;

  return (
    vehicle.vehicle_name ||
    [vehicle.vehicle_brand, vehicle.vehicle_model, typeLabel].filter(Boolean).join(' ') ||
    'Xe khong ten'
  );
};

const getVehicleImages = (vehicle = {}) => sanitizeImageList([
  ...(vehicle.vehicle_image_path || []),
  ...(vehicle.vehicle_images_paths || []),
  ...(vehicle.images || []),
]);

/**
 * Map backend Vehicle schema to a frontend-friendly shape.
 * Supports both the documented schema and older field variants already present in the repo.
 */
export function mapVehicle(vehicle = {}) {
  const images = getVehicleImages(vehicle);
  const displayName = getVehicleDisplayName(vehicle);
  const rating = getAverageRating(vehicle.ratings, vehicle.rating);
  const commentCount = getMapSize(vehicle.comments);
  const category = vehicle.vehicle_type === 'others'
    ? (vehicle.vehicle_type_if_others || 'Khac')
    : (vehicle.vehicle_type || 'Sedan');

  return {
    _id: vehicle._id,
    id: vehicle._id,

    name: displayName,
    brand: vehicle.vehicle_brand || vehicle.brand || '',
    model: vehicle.vehicle_model || vehicle.model || '',
    type: category,
    category,
    fuel: FUEL_MAP[vehicle.fuel_type] || vehicle.fuel_type || 'Xang',
    transmission: TRANS_MAP[vehicle.transmission] || vehicle.transmission || '',
    seats: vehicle.number_of_seats || vehicle.seats || 0,

    price: Number(vehicle.vehicle_hire_rate_in_figures || 0),
    currency: vehicle.vehicle_hire_rate_currency || 'VND',
    chargeUnit: vehicle.vehicle_charge_per_timing || vehicle.vehicle_hire_charge_per_timing || 'day',
    maxDistance: vehicle.maximum_allowable_distance || '',

    image: images[0] || '',
    images,

    address: vehicle.address || '',
    location: vehicle.location || vehicle.address || '',
    latitude: vehicle.latitude || null,
    longitude: vehicle.longitude || null,

    status: vehicle.status || 'available',
    statusLabel: STATUS_MAP[vehicle.status] || vehicle.status || 'Khong ro',
    plateNumber: vehicle.vehicle_plate_number || '',
    engineNumber: vehicle.vehicle_engine_number || '',
    vinNumber: vehicle.vehicle_identification_number || '',
    addedBy: vehicle.added_by || null,
    verified: vehicle.verified || null,
    active: vehicle.active !== false,
    companyOwned: Boolean(vehicle.company_owed ?? vehicle.company_owned),

    rating,
    trips: commentCount,
    showroom: vehicle.showroom || '',
    description: vehicle.description || '',

    ratings: vehicle.ratings || {},
    comments: vehicle.comments || {},
    raw: vehicle,
  };
}

export const vehicleService = {
  async getList(params = {}) {
    const res = await apiClient.post('/api/vehicles/getListVehicles', params);
    const { data, pagination } = res.data;

    return {
      data: (data || []).map(mapVehicle),
      pagination: pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getById(vehicleId) {
    const res = await apiClient.get(`/api/vehicles/getVehicleById/${vehicleId}`);
    const vehicle = res.data?.data;
    return vehicle ? mapVehicle(vehicle) : null;
  },

  async create(payload) {
    const res = await apiClient.post('/api/vehicles/create', payload);
    return mapVehicle(res.data.data);
  },

  async deleteById(vehicleId) {
    const res = await apiClient.delete(`/api/vehicles/deleteVehicleById/${vehicleId}`);
    return res.data;
  },
};

export default vehicleService;
