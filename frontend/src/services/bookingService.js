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

const BOOKING_CACHE_TTL_MS = 45_000;
let roleBookingsDetailedCache = {
  data: null,
  expiresAt: 0,
};

function normalizeListPayload(raw) {
  if (Array.isArray(raw)) return { items: raw, pagination: null };
  if (raw && Array.isArray(raw.data)) {
    return { items: raw.data, pagination: raw.pagination ?? null };
  }
  return { items: [], pagination: null };
}

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

const buildBookingFallback = (booking) => {
  const showroomId = resolveId(booking?.showroom_id);
  const fallbackShowroom =
    booking?.showroom_id && typeof booking.showroom_id === 'object'
      ? toLegacyShowroomShape(booking.showroom_id)
      : showroomId
        ? { _id: showroomId, id: showroomId, name: 'SmartRent', email: '', phone: '', address: '' }
        : null;

  return normalizeBooking({
    booking,
    vehicle: null,
    showroom: fallbackShowroom,
    payment: booking?.payment || null,
    paymentState: booking?.paymentState || null,
  });
};

const enrichBooking = async (booking, preloadedVehicle = undefined, { skipPaymentFetch = false } = {}) => {
  const vehicleId = resolveId(booking?.vehicle_id);
  const showroomId = resolveId(booking?.showroom_id);
  const bookingId = resolveId(booking);

  const vehiclePromise =
    preloadedVehicle !== undefined
      ? Promise.resolve(preloadedVehicle)
      : vehicleId
        ? vehicleService.getById(vehicleId)
        : Promise.resolve(null);

  const paymentPromise =
    !skipPaymentFetch && bookingId
      ? paymentService.getLatestPaymentByBookingId(bookingId)
      : Promise.resolve(null);

  const paymentStatePromise =
    !skipPaymentFetch && bookingId
      ? paymentService.getPaymentState(bookingId)
      : Promise.resolve(null);

  const [vehicleResult, paymentResult, paymentStateResult] = await Promise.allSettled([
    vehiclePromise,
    paymentPromise,
    paymentStatePromise,
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
    payment: paymentResult.status === 'fulfilled' ? paymentResult.value : booking?.payment || null,
    paymentState: paymentStateResult.status === 'fulfilled' ? paymentStateResult.value : booking?.paymentState || null,
  });
};

const enrichBookingsSafely = async (bookings = [], { skipPaymentFetch = false } = {}) => {
  const list = bookings || [];

  // Deduplicate vehicle fetches: collect unique vehicle IDs, fetch each once
  const uniqueVehicleIds = [...new Set(list.map((b) => resolveId(b?.vehicle_id)).filter(Boolean))];

  const vehicleResults = await Promise.allSettled(
    uniqueVehicleIds.map((id) => vehicleService.getById(id))
  );

  const vehicleCache = new Map();
  uniqueVehicleIds.forEach((id, i) => {
    vehicleCache.set(id, vehicleResults[i].status === 'fulfilled' ? vehicleResults[i].value : null);
  });

  return Promise.all(
    list.map(async (booking) => {
      try {
        const vehicleId = resolveId(booking?.vehicle_id);
        const cachedVehicle = vehicleId ? (vehicleCache.get(vehicleId) ?? null) : null;
        return await enrichBooking(booking, cachedVehicle, { skipPaymentFetch });
      } catch {
        return buildBookingFallback(booking);
      }
    })
  );
};

export const bookingService = {
  invalidateBookingCache() {
    roleBookingsDetailedCache = {
      data: null,
      expiresAt: 0,
    };
  },

  async createBooking(payload = {}) {
    const vehicleId = resolveId(payload.vehicle_id) || resolveId(payload.vehicleId);
    const showroomId =
      resolveId(payload.showroom_id)
      || resolveId(payload.showroomId)
      || resolveId(payload.showroom)
      || resolveId(payload.car?.addedBy)
      || resolveId(payload.vehicle?.addedBy);

    if (!vehicleId || !showroomId) {
      throw new Error('Thieu vehicle_id hoac showroom_id de tao booking.');
    }

    const note = String(
      payload.note
      || (payload.delivery_type === 'delivery'
        ? `Giao xe: ${payload.delivery_address || ''}`.trim()
        : 'Tu den lay')
    ).slice(0, 500);

    const body = {
      vehicle_id: vehicleId,
      showroom_id: showroomId,
      start_date: payload.start_date,
      end_date: payload.end_date,
      total_price: Number(payload.total_price || 0),
      note,
    };


    const res = await apiClient.post('/api/booking/createBooking', body);
    this.invalidateBookingCache();
    return res.data.data;
  },

  async getMyBookings(filters = {}) {
    const bookings = await this.getCurrentRoleBookings();

    return (bookings || []).filter((booking) => {
      if (filters.status && booking?.status !== filters.status) {
        return false;
      }

      if (filters.vehicle_id && resolveId(booking?.vehicle_id) !== resolveId(filters.vehicle_id)) {
        return false;
      }

      if (filters.showroom_id && resolveId(booking?.showroom_id) !== resolveId(filters.showroom_id)) {
        return false;
      }

      return true;
    });
  },

  async getCurrentRoleBookings() {
    const res = await apiClient.get('/api/booking/getMyBooking');
    return extractBookingList(res.data);
  },

  async getCurrentRoleBookingsDetailed() {
    const bookings = await this.getCurrentRoleBookings();
    return enrichBookingsSafely(bookings);
  },

  async getCachedRoleBookingsDetailed() {
    if (roleBookingsDetailedCache.data && Date.now() < roleBookingsDetailedCache.expiresAt) {
      return roleBookingsDetailedCache.data;
    }

    const data = await this.getCurrentRoleBookingsDetailed();
    roleBookingsDetailedCache = {
      data,
      expiresAt: Date.now() + BOOKING_CACHE_TTL_MS,
    };
    return data;
  },

  async getListBookings(filters = {}) {
    const safeLimit = Math.min(100, Math.max(1, Number(filters.limit || 100)));
    const safePage = Math.max(1, Number(filters.page || 1));
    const res = await apiClient.post('/api/booking/getListBookings', {
      ...filters,
      limit: safeLimit,
      page: safePage,
    });
    return normalizeListPayload(res.data?.data ?? res.data);  },

  async getMyBookingsDetailed(filters = {}) {
    const bookings = await this.getMyBookings(filters);
    return enrichBookingsSafely(bookings);
  },

  async getMyBookingsForTransactions() {
    const bookings = await this.getCurrentRoleBookings();
    // Skip per-booking payment fetch — getMyTransactions will fetch payment lists itself
    return enrichBookingsSafely(bookings, { skipPaymentFetch: true });
  },

  async getBookingById(id) {
    const res = await apiClient.get(`/api/booking/getBookingById/${id}`);
    const booking = res.data.data;
    if (!booking) {
      return null;
    }

    try {
      return await enrichBooking(booking);
    } catch {
      return buildBookingFallback(booking);
    }
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

    // Handle both flat `{ isAvailable }` and wrapped `{ data: { isAvailable } }` formats
    const payload = res.data?.data ?? res.data;
    return payload;
  },

  async getUnavailableDateIntervals(vehicleId, { from, to } = {}) {
    if (!vehicleId) {
      throw new Error('Thieu vehicleId de lay lich ban.');
    }

    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get(`/api/booking/unavailableDates/${vehicleId}${query}`);
    return res.data?.data || null;
  },

  async cancelBooking(id) {
    const res = await apiClient.post(`/api/booking/cancelBookingWithRefund/${id}`);
    this.invalidateBookingCache();
    return res.data.data;
  },

  async createBookingAndPaymentSession(payload = {}) {
    const booking = await this.createBooking(payload);
    const bookingId = resolveId(booking);
    const amount = Number(booking?.total_price || payload.total_price || 0);
    const paymentData = await paymentService.createPaymentSession({
      bookingId,
      amount,
    });

    return {
      booking,
      bookingId,
      paymentData,
      clientSecret: paymentData?.client_secret || paymentData?.clientSecret || '',
    };
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
    this.invalidateBookingCache();
    return res.data.data;
  },

  async confirmPickup(id) {
    throw new Error('Backend hien chi cho showroom cap nhat buoc ban giao xe. Renter chua the tu xac nhan nhan xe bang status API nay.');
  },

  async requestReturn(id) {
    throw new Error('Backend hien chua ho tro renter gui yeu cau tra xe bang status API rieng. FE chi co the luu bien ban va anh doi chieu tren trinh duyet hien tai.');
  },

  async confirmPickupForRenter(id) {
    return this.confirmPickup(id);
  },

  async requestReturnForRenter(id) {
    return this.requestReturn(id);
  },
};

export default bookingService;


