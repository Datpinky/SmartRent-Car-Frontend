const notificationService = require('../services/notification.service');

class NotificationController {
    async list(req, res, next) {
        try {
            const userId = req.user.userId;
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);
            const skip  = parseInt(req.query.skip) || 0;
            const data  = await notificationService.listForUser(userId, { limit, skip });
            const unread = data.filter((n) => !n.read).length;
            return res.status(200).json({ message: 'OK', data, unread });
        } catch (error) {
            next(error);
        }
    }

    async countUnread(req, res, next) {
        try {
            const count = await notificationService.countUnread(req.user.userId);
            return res.status(200).json({ message: 'OK', data: { count } });
        } catch (error) {
            next(error);
        }
    }

    async markRead(req, res, next) {
        try {
            const data = await notificationService.markRead(req.params.id, req.user.userId);
            return res.status(200).json({ message: 'Đã đánh dấu đã đọc', data });
        } catch (error) {
            next(error);
        }
    }

    async markAllRead(req, res, next) {
        try {
            const data = await notificationService.markAllRead(req.user.userId);
            return res.status(200).json({ message: 'Đã đánh dấu tất cả đã đọc', data });
        } catch (error) {
            next(error);
        }
    }

    async deleteOne(req, res, next) {
        try {
            const data = await notificationService.deleteOne(req.params.id, req.user.userId);
            return res.status(200).json({ message: 'Đã xóa thông báo', data });
        } catch (error) {
            next(error);
        }
    }

    async deleteAllRead(req, res, next) {
        try {
            const data = await notificationService.deleteAllRead(req.user.userId);
            return res.status(200).json({ message: `Đã xóa ${data.deleted} thông báo`, data });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
