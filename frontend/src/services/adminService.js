import apiClient from './apiClient';

const adminService = {
  /**
   * Danh sách tất cả người dùng (admin).
   * @param {string} [search] tìm theo tên, email
   */
  async listUsers(search = '') {
    const res = await apiClient.get('/api/admin/users', {
      params: search ? { search } : {},
    });
    return res.data.data;
  },

  /**
   * Khóa / mở khóa tài khoản (is_active).
   */
  async setUserActive(userId, isActive) {
    const res = await apiClient.patch(`/api/admin/users/${userId}/active`, { is_active: isActive });
    return res.data.data;
  },

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

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const res = await apiClient.get('/api/admin/dashboard/stats');
    return res.data.data;
  },

  async getChartData() {
    const res = await apiClient.get('/api/admin/dashboard/charts');
    return res.data.data;
  },

  // ─── Transactions ────────────────────────────────────────────────────────────

  /**
   * @param {'all'|'paid'|'processing'|'failed'} [status]
   */
  async listTransactions(status = 'all') {
    const res = await apiClient.get('/api/admin/transactions', {
      params: status !== 'all' ? { status } : {},
    });
    return res.data.data;
  },
};

export default adminService;
