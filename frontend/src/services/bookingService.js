import apiClient from './apiClient';
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

const extractBookingList = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
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

const deriveShowroomFromVehicle = (vehicle) => {
  const addedBy = vehicle?.addedBy;
  if (!addedBy || typeof addedBy !== 'object') {
    return null;
  }

  return {
    _id: addedBy._id || '',
    id: addedBy._id || '',
    name: addedBy.business_name || addedBy.name || '',
    email: addedBy.email || '',
    phone: addedBy.phone || '',
    address: vehicle?.address || vehicle?.pickupAddress || '',
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

const runStatusTransitions = async (bookingId, transitions = []) => {
  let latestBooking = null;

  for (const status of transitions) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${bookingId}`, { status });
    latestBooking = res.data?.data ?? null;
  }

  return latestBooking;
};

const RETURN_REQUEST_PATHS = {
  handed_over: ['in_use', 'waiting_return_confirmation'],
  in_use: ['waiting_return_confirmation'],
  waiting_return_confirmation: [],
  completed: [],
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

    return extractBookingList(res.data);
  },

  async getCurrentRoleBookings() {
    const res = await apiClient.get('/api/booking/getMyBooking');
    return extractBookingList(res.data);
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

  async checkAvailability({ vehicleId, pickupDate, returnDate, excludeBookingId } = {}) {
    if (!vehicleId || !pickupDate || !returnDate) {
      throw new Error('Thieu vehicleId, pickupDate hoac returnDate de kiem tra lich thue.');
    }

    const res = await apiClient.post('/api/booking/checkAvailability', {
      vehicleId,
      pickupDate,
      returnDate,
      excludeBookingId,
    });

    return res.data;
  },

  async cancelBooking(id) {
    const res = await apiClient.post(`/api/booking/cancelBooking/${id}`);
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

    return extractBookingList(res.data);
  },

  async updateBookingStatus(id, status) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${id}`, { status });
    return res.data.data;
  },

  async confirmPickupForRenter(id, currentStatus) {
    if (currentStatus !== 'waiting_handover') {
      throw new Error('Chi co the xac nhan da nhan xe khi booking dang o trang thai Cho ban giao.');
    }

    return this.updateBookingStatus(id, 'handed_over');
  },

  async requestReturnForRenter(id, currentStatus) {
    const transitions = RETURN_REQUEST_PATHS[currentStatus];

    if (!transitions) {
      throw new Error(`Khong the gui yeu cau tra xe tu trang thai ${currentStatus || 'khong xac dinh'}.`);
    }

    if (transitions.length === 0) {
      return null;
    }

    return runStatusTransitions(id, transitions);
  },
};

export default bookingService;
