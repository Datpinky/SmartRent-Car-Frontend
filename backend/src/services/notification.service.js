const notificationModel = require('../models/notification.model');
const throwError = require('../utils/throwError');

class NotificationService {
    /**
     * Tạo một thông báo mới cho người dùng.
     * @param {{ recipient_id, type?, title, message, link? }} payload
     */
    async create(payload) {
        const { recipient_id, type = 'system', title, message, link = '' } = payload;
        return notificationModel.create({ recipient_id, type, title, message, link });
    }

    /**
     * Lấy danh sách thông báo của user (mới nhất trước), giới hạn 50.
     */
    async listForUser(userId, { limit = 50, skip = 0 } = {}) {
        const notifications = await notificationModel
            .find({ recipient_id: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return notifications.map((n) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link || '',
            read: n.read,
            time: formatTimeAgo(n.createdAt),
            createdAt: n.createdAt,
        }));
    }

    /**
     * Đếm số thông báo chưa đọc của user.
     */
    async countUnread(userId) {
        return notificationModel.countDocuments({ recipient_id: userId, read: false });
    }

    /**
     * Đánh dấu một thông báo đã đọc.
     */
    async markRead(notifId, userId) {
        const notif = await notificationModel.findOne({ _id: notifId, recipient_id: userId });
        if (!notif) throwError('Không tìm thấy thông báo', 404);
        if (!notif.read) {
            notif.read = true;
            await notif.save();
        }
        return { id: notif._id, read: true };
    }

    /**
     * Đánh dấu tất cả thông báo của user là đã đọc.
     */
    async markAllRead(userId) {
        const result = await notificationModel.updateMany(
            { recipient_id: userId, read: false },
            { $set: { read: true } }
        );
        return { updated: result.modifiedCount };
    }

    /**
     * Xóa một thông báo.
     */
    async deleteOne(notifId, userId) {
        const result = await notificationModel.deleteOne({ _id: notifId, recipient_id: userId });
        if (result.deletedCount === 0) throwError('Không tìm thấy thông báo', 404);
        return { deleted: true };
    }

    /**
     * Xóa tất cả thông báo đã đọc của user.
     */
    async deleteAllRead(userId) {
        const result = await notificationModel.deleteMany({ recipient_id: userId, read: true });
        return { deleted: result.deletedCount };
    }
}

/**
 * Chuyển timestamp thành dạng "x phút trước", "x giờ trước", v.v.
 */
function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Vừa xong';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString('vi-VN');
}

module.exports = new NotificationService();

// Export helper cho các service khác dùng để tạo thông báo
module.exports.createNotification = (payload) => new NotificationService().create(payload);
