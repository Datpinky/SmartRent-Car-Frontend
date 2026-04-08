import apiClient from './apiClient';

const notificationService = {
  /**
   * Lấy danh sách thông báo của user hiện tại.
   * @param {{ limit?: number, skip?: number }} opts
   * @returns {{ data: Notification[], unread: number }}
   */
  async list({ limit = 50, skip = 0 } = {}) {
    const res = await apiClient.get('/api/notifications', { params: { limit, skip } });
    return { data: res.data.data || [], unread: res.data.unread || 0 };
  },

  /**
   * Đếm số thông báo chưa đọc (dùng cho badge polling).
   * @returns {number}
   */
  async countUnread() {
    const res = await apiClient.get('/api/notifications/unread-count');
    return res.data.data?.count ?? 0;
  },

  /**
   * Đánh dấu một thông báo đã đọc.
   */
  async markRead(id) {
    await apiClient.patch(`/api/notifications/${id}/read`);
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc.
   */
  async markAllRead() {
    await apiClient.patch('/api/notifications/read-all');
  },

  /**
   * Xóa một thông báo.
   */
  async deleteOne(id) {
    await apiClient.delete(`/api/notifications/${id}`);
  },

  /**
   * Xóa tất cả thông báo đã đọc.
   */
  async deleteAllRead() {
    await apiClient.delete('/api/notifications/read');
  },
};

export default notificationService;
