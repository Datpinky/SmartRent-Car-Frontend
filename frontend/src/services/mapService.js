import apiClient from './apiClient';

const geocodeCache = new Map();

const normalizeQuery = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeResult = (item = {}) => ({
  lat: Number(item.lat),
  lng: Number(item.lon),
  address: item.display_name || '',
  plusCode: item.place_id ? String(item.place_id) : '',
  raw: item,
});

export const mapService = {
  async forwardGeocode(query, { limit = 5, countrycodes = 'vn' } = {}) {
    const trimmedQuery = normalizeQuery(query);
    if (!trimmedQuery || trimmedQuery.length < 6) {
      return [];
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}|${limit}|${countrycodes}`;
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    try {
      const response = await apiClient.get('/api/map/forwardGeocode', {
        params: {
          address: trimmedQuery,
          limit,
          countrycodes,
        },
      });

      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const results = data
        .map(normalizeResult)
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

      geocodeCache.set(cacheKey, results);
      return results;
    } catch (error) {
      if (error.status === 404) {
        return [];
      }

      throw new Error(error.message || 'Khong the geocode dia chi luc nay.');
    }
  },
};

export default mapService;
