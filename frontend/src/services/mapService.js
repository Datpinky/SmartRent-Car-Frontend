import { LOCATIONIQ_API_KEY } from '../components/Map/mapConfig';

const GEOCODE_BASE_URL = 'https://us1.locationiq.com/v1/search';
const geocodeCache = new Map();
let rateLimitedUntil = 0;

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

    if (!LOCATIONIQ_API_KEY) {
      throw new Error('Chua cau hinh LOCATIONIQ_API_KEY cho geocoding.');
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}|${limit}|${countrycodes}`;
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    if (Date.now() < rateLimitedUntil) {
      throw new Error('Dich vu geocode dang tam gioi han. Vui long doi it phut roi thu lai.');
    }

    const url = new URL(GEOCODE_BASE_URL);
    url.searchParams.set('key', LOCATIONIQ_API_KEY);
    url.searchParams.set('q', trimmedQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('accept-language', 'vi');
    if (countrycodes) {
      url.searchParams.set('countrycodes', countrycodes);
    }

    const response = await fetch(url.toString());
    if (response.status === 429) {
      rateLimitedUntil = Date.now() + 60 * 1000;
      throw new Error('Dich vu geocode dang tam gioi han. Vui long doi it phut roi thu lai.');
    }

    if (!response.ok) {
      throw new Error('Khong the geocode dia chi luc nay.');
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const results = data
      .map(normalizeResult)
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    geocodeCache.set(cacheKey, results);
    return results;
  },
};

export default mapService;
