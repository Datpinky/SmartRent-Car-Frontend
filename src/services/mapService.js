import apiClient from './apiClient';

const normalizeGeocodeResult = (item = {}) => ({
  lat: Number(item.lat),
  lng: Number(item.lon),
  address: item.display_name || item.address?.name || '',
  plusCode: item.display_place || item.display_address || '',
  raw: item,
});

export const mapService = {
  async forwardGeocode(address) {
    const trimmedAddress = String(address || '').trim();
    if (!trimmedAddress) {
      throw new Error('Vui long nhap dia chi de xac dinh toa do.');
    }

    const res = await apiClient.get('/api/map/forwardGeocode', {
      params: { address: trimmedAddress },
    });

    return (res.data.data || [])
      .map(normalizeGeocodeResult)
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  },

  async reverseGeocode(lat, lon) {
    const res = await apiClient.get('/api/map/reverseGeocode', {
      params: { lat, lon },
    });

    const data = res.data.data || {};
    return {
      address: data.display_name || '',
      plusCode: data.display_place || data.display_address || '',
      raw: data,
    };
  },
};

export default mapService;
