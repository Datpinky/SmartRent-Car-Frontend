import apiClient from './apiClient';

function normalizeList(raw) {
  if (Array.isArray(raw)) return { items: raw, pagination: null };
  if (raw && Array.isArray(raw.data)) {
    return { items: raw.data, pagination: raw.pagination ?? null };
  }
  return { items: [], pagination: null };
}

const inspectionService = {
  async list(filters = {}) {
    const res = await apiClient.post('/api/vehicle-damage-inspections/list', { limit: 50, page: 1, ...filters });
    return normalizeList(res.data?.data ?? res.data);
  },

  async create(payload) {
    const res = await apiClient.post('/api/vehicle-damage-inspections', payload);
    return res.data?.data ?? null;
  },
};

export default inspectionService;
