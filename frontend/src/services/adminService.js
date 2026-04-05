import apiClient from './apiClient';

const adminService = {
  /**
   * @param {'all'|'pending'|'approved'|'rejected'} [status]
   */
  async listShowrooms(status = 'all') {
    const res = await apiClient.get('/api/admin/showrooms', { params: { status } });
    return res.data.data;
  },

  async approveShowroom(id) {
    const res = await apiClient.patch(`/api/admin/showrooms/${id}/approve`);
    return res.data.data;
  },

  async rejectShowroom(id, reason) {
    const res = await apiClient.patch(`/api/admin/showrooms/${id}/reject`, { reason });
    return res.data.data;
  },
};

export default adminService;
