import apiClient from './apiClient';

// Backend hien tai da mount /api/notifications.
// FE giu luong request binh thuong, va NotificationBell se tu xu ly neu request loi.
const BACKEND_NOTIFICATIONS_SUPPORTED = true;

const EMPTY_RESULT = Object.freeze({ data: [], unread: 0 });

const notificationService = {
  isSupported() {
    return BACKEND_NOTIFICATIONS_SUPPORTED;
  },

  async list({ limit = 50, skip = 0 } = {}) {
    if (!BACKEND_NOTIFICATIONS_SUPPORTED) {
      return EMPTY_RESULT;
    }

    const res = await apiClient.get('/api/notifications', { params: { limit, skip } });
    return { data: res.data.data || [], unread: res.data.unread || 0 };
  },

  async countUnread() {
    if (!BACKEND_NOTIFICATIONS_SUPPORTED) {
      return 0;
    }

    const res = await apiClient.get('/api/notifications/unread-count');
    return res.data.data?.count ?? 0;
  },

  async markRead(id) {
    if (!BACKEND_NOTIFICATIONS_SUPPORTED) {
      return;
    }

    await apiClient.patch(`/api/notifications/${id}/read`);
  },

  async markAllRead() {
    if (!BACKEND_NOTIFICATIONS_SUPPORTED) {
      return;
    }

    await apiClient.patch('/api/notifications/read-all');
  },

  async deleteOne(id) {
    if (!BACKEND_NOTIFICATIONS_SUPPORTED) {
      return;
    }

    await apiClient.delete(`/api/notifications/${id}`);
  },

  async deleteAllRead() {
    if (!BACKEND_NOTIFICATIONS_SUPPORTED) {
      return;
    }

    await apiClient.delete('/api/notifications/read');
  },
};

export default notificationService;
