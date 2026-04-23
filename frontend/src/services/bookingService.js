import apiClient from './apiClient';
import vehicleService from './vehicleService';
import paymentService from './paymentService';

/**
 * Backend trả { data: [...], pagination } hoặc (legacy) mảng trực tiếp.
 * @returns {{ items: array, pagination: object|null }}
 */
function normalizeListPayload(raw) {
  if (Array.isArray(raw)) return { items: raw, pagination: null };
  if (raw && Array.isArray(raw.data)) {
    return { items: raw.data, pagination: raw.pagination ?? null };
  }
  return { items: [], pagination: null };
}

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('smartrent_user') || 'null');
  } catch {
    return null;
  }
};

const resolveId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
};

/** Trích mảng booking từ nhiều dạng response API (dùng cho getMyBookings). */
const extractBookingList = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const toLegacyVehicleShape = (vehicle) => {
  if (!vehicle) return null;
  return {
    ...(vehicle.raw || {}),
    _id: vehicle._id || vehicle.id,
    id: vehicle.id || vehicle._id,
    vehicle_name: vehicle.name,
    vehicle_images_paths:
      vehicle.raw?.vehicle_image_path || vehicle.raw?.vehicle_images_paths || vehicle.images || [],
    images: vehicle.images || [],
    address: vehicle.address || '',
    location: vehicle.address || vehicle.location || '',
  };
};

const toLegacyShowroomShape = (showroom) => {
  if (!showroom) return null;
  return {
    _id: showroom._id || showroom.id,
    id: showroom.id || showroom._id,
    name: showroom.name || '',
    email: showroom.email || '',
    phone: showroom.phone || '',
    address: showroom.address || '',
  };
};

const deriveShowroomFromVehicle = (vehicle) => {
  const addedBy = vehicle?.addedBy;
  if (!addedBy || typeof addedBy !== 'object') return null;
  return {
    _id: addedBy._id || '',
    id: addedBy._id || '',
    name: addedBy.business_name || addedBy.name || '',
    email: addedBy.email || '',
    phone: addedBy.phone || '',
    address: vehicle?.address || vehicle?.pickupAddress || '',
  };
};

const normalizeBooking = ({ booking, vehicle = null, showroom = null, payment = null, paymentState = null }) => ({
  ...booking,
  id: booking?._id || booking?.id || '',
  _id: booking?._id || booking?.id || '',
  vehicle,
  showroom,
  payment,
  paymentState,
  vehicle_id: toLegacyVehicleShape(vehicle) || booking?.vehicle_id || null,
  showroom_id: toLegacyShowroomShape(showroom) || booking?.showroom_id || null,
});

const enrichBooking = async (booking) => {
  const vehicleId = resolveId(booking?.vehicle_id);
  const showroomId = resolveId(booking?.showroom_id);
  const bookingId = resolveId(booking);

  const [vehicleResult, paymentResult, paymentStateResult] = await Promise.allSettled([
    vehicleId ? vehicleService.getById(vehicleId) : Promise.resolve(null),
    bookingId ? paymentService.getLatestPaymentByBookingId(bookingId) : Promise.resolve(null),
    bookingId ? paymentService.getPaymentState(bookingId) : Promise.resolve(null),
  ]);

  const vehicle = vehicleResult.status === 'fulfilled' ? vehicleResult.value : null;
  const showroomFromVehicle = deriveShowroomFromVehicle(vehicle);
  const fallbackShowroom =
    booking?.showroom_id && typeof booking.showroom_id === 'object'
      ? toLegacyShowroomShape(booking.showroom_id)
      : showroomId
        ? { _id: showroomId, id: showroomId, name: 'SmartRent', email: '', phone: '', address: '' }
        : null;

  return normalizeBooking({
    booking,
    vehicle,
    showroom: showroomFromVehicle || fallbackShowroom,
    payment: paymentResult.status === 'fulfilled' ? paymentResult.value : null,
    paymentState: paymentStateResult.status === 'fulfilled' ? paymentStateResult.value : null,
  });
};

const bookingService = {
  async createBooking(data) {
    const res = await apiClient.post('/api/booking/createBooking', data);
    return res.data?.data ?? res.data;
  },

  /**
   * @param {object} filters — showroom_id, user_id, status, page, limit, …
   * @returns {Promise<{ items: array, pagination: object|null }>}
   */
  async getListBookings(filters = {}) {
    const res = await apiClient.post('/api/booking/getListBookings', {
      limit: 100,
      page: 1,
      ...filters,
    });
    return normalizeListPayload(res.data?.data ?? res.data);
  },

  async getBookingById(bookingId) {
    const res = await apiClient.get(`/api/booking/getBookingById/${bookingId}`);
    return res.data?.data ?? res.data;
  },

  async updateBookingStatus(bookingId, status) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${bookingId}`, { status });
    return res.data?.data ?? res.data;
  },

  async getMyBookings(filters = {}) {
    const currentUser = readStoredUser();
    const userId = resolveId(filters.user_id) || resolveId(currentUser);
    if (!userId) {
      throw new Error('Khong tim thay user id de tai bookings.');
    }
    const res = await apiClient.post('/api/booking/getListBookings', {
      page: 1,
      limit: 100,
      sort_by: -1,
      user_id: userId,
      ...filters,
    });
    return extractBookingList(res.data);
  },

  async getMyBookingsDetailed(filters = {}) {
    const bookings = await this.getMyBookings(filters);
    const detailResults = await Promise.allSettled(bookings.map((booking) => enrichBooking(booking)));
    return detailResults.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  },

  async cancelBooking(id) {
    return this.updateBookingStatus(id, 'cancelled');
  },

  async getShowroomBookings(filters = {}) {
    const currentUser = readStoredUser();
    const showroomId = resolveId(filters.showroom_id) || resolveId(currentUser);
    const res = await apiClient.post('/api/booking/getListBookings', {
      page: 1,
      limit: 100,
      sort_by: -1,
      showroom_id: showroomId,
      ...filters,
    });
    return extractBookingList(res.data);
  },
};

export default bookingService;
