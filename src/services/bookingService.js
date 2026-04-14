import apiClient from './apiClient';
import profileService from './profileService';
import vehicleService from './vehicleService';
import paymentService from './paymentService';

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

const toLegacyVehicleShape = (vehicle) => {
  if (!vehicle) {
    return null;
  }

  return {
    ...(vehicle.raw || {}),
    _id: vehicle._id || vehicle.id,
    id: vehicle.id || vehicle._id,
    vehicle_name: vehicle.name,
    vehicle_images_paths: vehicle.raw?.vehicle_image_path || vehicle.raw?.vehicle_images_paths || vehicle.images || [],
    images: vehicle.images || [],
    address: vehicle.address || '',
    location: vehicle.address || vehicle.location || '',
  };
};

const toLegacyShowroomShape = (showroom) => {
  if (!showroom) {
    return null;
  }

  return {
    _id: showroom._id || showroom.id,
    id: showroom.id || showroom._id,
    name: showroom.name || '',
    email: showroom.email || '',
    phone: showroom.phone || '',
    address: showroom.address || '',
  };
};

const normalizeBooking = ({
  booking,
  vehicle = null,
  showroom = null,
  payment = null,
  paymentState = null,
}) => ({
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

  const [vehicleResult, showroomResult, paymentResult, paymentStateResult] = await Promise.allSettled([
    vehicleId ? vehicleService.getById(vehicleId) : Promise.resolve(null),
    showroomId ? profileService.getProfileById(showroomId) : Promise.resolve(null),
    bookingId ? paymentService.getLatestPaymentByBookingId(bookingId) : Promise.resolve(null),
    bookingId ? paymentService.getPaymentState(bookingId) : Promise.resolve(null),
  ]);

  return normalizeBooking({
    booking,
    vehicle: vehicleResult.status === 'fulfilled' ? vehicleResult.value : null,
    showroom: showroomResult.status === 'fulfilled' ? showroomResult.value : null,
    payment: paymentResult.status === 'fulfilled' ? paymentResult.value : null,
    paymentState: paymentStateResult.status === 'fulfilled' ? paymentStateResult.value : null,
  });
};

export const bookingService = {
  async createBooking(payload = {}) {
    const currentUser = readStoredUser();
    const userId = resolveId(payload.user_id) || resolveId(currentUser);
    const vehicleId = resolveId(payload.vehicle_id) || resolveId(payload.vehicleId);
    const showroomId =
      resolveId(payload.showroom_id)
      || resolveId(payload.showroomId)
      || resolveId(payload.showroom)
      || resolveId(payload.car?.addedBy)
      || resolveId(payload.vehicle?.addedBy);

    if (!userId || !vehicleId || !showroomId) {
      throw new Error('Thieu user_id, vehicle_id hoac showroom_id de tao booking.');
    }

    const note = String(
      payload.note
      || (payload.delivery_type === 'delivery'
        ? `Giao xe: ${payload.delivery_address || ''}`.trim()
        : 'Tu den lay')
    ).slice(0, 500);

    const body = {
      user_id: userId,
      vehicle_id: vehicleId,
      showroom_id: showroomId,
      start_date: payload.start_date,
      end_date: payload.end_date,
      total_price: Number(payload.total_price || 0),
      note,
    };

    const res = await apiClient.post('/api/booking/createBooking', body);
    return res.data.data;
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

    return res.data.data || [];
  },

  async getMyBookingsDetailed(filters = {}) {
    const bookings = await this.getMyBookings(filters);
    const detailResults = await Promise.allSettled(bookings.map((booking) => enrichBooking(booking)));

    return detailResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
  },

  async getBookingById(id) {
    const res = await apiClient.get(`/api/booking/getBookingById/${id}`);
    const booking = res.data.data;
    if (!booking) {
      return null;
    }

    return enrichBooking(booking);
  },

  async cancelBooking(id) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${id}`, {
      status: 'cancelled',
    });
    return res.data.data;
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

    return res.data.data || [];
  },

  async updateBookingStatus(id, status) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${id}`, { status });
    return res.data.data;
  },
};

export default bookingService;
