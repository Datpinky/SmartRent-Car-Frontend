import apiClient from './apiClient';

const mapVehicleLocation = (location = null) => {
  if (!location) return null;

  return {
    id: location._id,
    address: location.address || location.add || '',
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    plusCode: location.plus_code || '',
    vehicleId: location.vehicle?._id || location.vehicle || null,
    raw: location,
  };
};

export const vehicleLocationService = {
  async create(vehicleId, payload = {}) {
    const res = await apiClient.post(
      `/api/vehicle_location/createVehicleLocation/${vehicleId}`,
      payload
    );
    return mapVehicleLocation(res.data.data);
  },

  async getByVehicleId(vehicleId) {
    const res = await apiClient.get(
      `/api/vehicle_location/getVehicleLocationByVehicleId/${vehicleId}`
    );
    return mapVehicleLocation(res.data.data);
  },

  async getManyByVehicleIds(vehicleIds = []) {
    const results = await Promise.allSettled(
      vehicleIds.map((vehicleId) => this.getByVehicleId(vehicleId))
    );

    return results.map((result, index) => ({
      vehicleId: vehicleIds[index],
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  },

  async updateLocation(vehicleId, payload) {
    const res = await apiClient.put(
      `/api/vehicle_location/vehicle/${vehicleId}`,
      payload
    );
    return mapVehicleLocation(res.data.data);
  },
};

export default vehicleLocationService;
