import apiClient from './apiClient';

function normalizeList(raw) {
  if (Array.isArray(raw)) return { items: raw, pagination: null };
  if (raw && Array.isArray(raw.data)) {
    return { items: raw.data, pagination: raw.pagination ?? null };
  }
  return { items: [], pagination: null };
}

const contractService = {
  async list(filters = {}) {
    const res = await apiClient.post('/api/contracts/list', { limit: 100, page: 1, ...filters });
    return normalizeList(res.data?.data ?? res.data);
  },

  async getById(contractId) {
    const res = await apiClient.get(`/api/contracts/${contractId}`);
    return res.data?.data ?? null;
  },

  async create(payload) {
    const res = await apiClient.post('/api/contracts', payload);
    return res.data?.data ?? null;
  },
};

export default contractService;
