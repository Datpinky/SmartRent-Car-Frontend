const notificationModel = require('../models/notification.model');
const bookingModel = require('../models/booking.model');
const throwError = require('../utils/throwError');

const RETURN_REMINDER_ACTIVE_STATUSES = ['handed_over', 'in_use', 'waiting_return_confirmation'];
const RETURN_REMINDER_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const RETURN_REMINDER_URGENT_MS = 3 * 60 * 60 * 1000;

class NotificationService {
    /**
     * Tao mot thong bao moi cho nguoi dung.
     * @param {{ recipient_id, type?, title, message, link?, scope_key? }} payload
     */
    async create(payload) {
        const {
            recipient_id,
            type = 'system',
            title,
            message,
            link = '',
            scope_key = '',
        } = payload;

        const nextNotification = {
            recipient_id,
            type,
            title,
            message,
            link,
        };

        if (scope_key) {
            nextNotification.scope_key = scope_key;
        }

        if (scope_key) {
            return notificationModel.findOneAndUpdate(
                { recipient_id, scope_key },
                { $setOnInsert: nextNotification },
                { new: true, upsert: true }
            );
        }

        return notificationModel.create(nextNotification);
    }

    async syncReturnDueNotifications(userId, role) {
        if (role !== 'user') {
            return { created: 0 };
        }

        const now = new Date();
        const upcomingWindow = new Date(now.getTime() + RETURN_REMINDER_LOOKAHEAD_MS);
        const bookings = await bookingModel
            .find({
                user_id: userId,
                status: { $in: RETURN_REMINDER_ACTIVE_STATUSES },
                end_date: { $lte: upcomingWindow },
            })
            .populate('vehicle_id', 'vehicle_name name brand model')
            .lean();

        let created = 0;

        for (const booking of bookings) {
            const reminder = buildReturnReminder(booking, now);
            if (!reminder) {
                continue;
            }

            const existed = await notificationModel.exists({
                recipient_id: userId,
                scope_key: reminder.scopeKey,
            });

            if (existed) {
                continue;
            }

            await this.create({
                recipient_id: userId,
                type: 'booking',
                title: reminder.title,
                message: reminder.message,
                link: `/renter/bookings?bookingId=${booking._id}`,
                scope_key: reminder.scopeKey,
            });
            created += 1;
        }

        return { created };
    }

    /**
     * Lay danh sach thong bao cua user (moi nhat truoc), gioi han 50.
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
     * Dem so thong bao chua doc cua user.
     */
    async countUnread(userId) {
        return notificationModel.countDocuments({ recipient_id: userId, read: false });
    }

    /**
     * Danh dau mot thong bao da doc.
     */
    async markRead(notifId, userId) {
        const notif = await notificationModel.findOne({ _id: notifId, recipient_id: userId });
        if (!notif) throwError('Khong tim thay thong bao', 404);
        if (!notif.read) {
            notif.read = true;
            await notif.save();
        }
        return { id: notif._id, read: true };
    }

    /**
     * Danh dau tat ca thong bao cua user la da doc.
     */
    async markAllRead(userId) {
        const result = await notificationModel.updateMany(
            { recipient_id: userId, read: false },
            { $set: { read: true } }
        );
        return { updated: result.modifiedCount };
    }

    /**
     * Xoa mot thong bao.
     */
    async deleteOne(notifId, userId) {
        const result = await notificationModel.deleteOne({ _id: notifId, recipient_id: userId });
        if (result.deletedCount === 0) throwError('Khong tim thay thong bao', 404);
        return { deleted: true };
    }

    /**
     * Xoa tat ca thong bao da doc cua user.
     */
    async deleteAllRead(userId) {
        const result = await notificationModel.deleteMany({ recipient_id: userId, read: true });
        return { deleted: result.deletedCount };
    }
}

function buildReturnReminder(booking, now) {
    const dueAt = new Date(booking.end_date);
    if (Number.isNaN(dueAt.getTime())) {
        return null;
    }

    const bookingId = String(booking._id || '');
    if (!bookingId) {
        return null;
    }

    const diffMs = dueAt.getTime() - now.getTime();
    const vehicleName = getVehicleName(booking);
    const dueLabel = dueAt.toLocaleString('vi-VN');

    if (diffMs <= 0) {
        return {
            scopeKey: `return-reminder:${bookingId}:overdue`,
            title: 'Da qua han tra xe',
            message: `${vehicleName} da qua han tra xe tu ${dueLabel}. Vui long lien he showroom va hoan tat thu tuc tra xe som nhat.`,
        };
    }

    if (diffMs <= RETURN_REMINDER_URGENT_MS) {
        return {
            scopeKey: `return-reminder:${bookingId}:urgent`,
            title: 'Sap den han tra xe',
            message: `${vehicleName} se den han tra vao ${dueLabel}. Ban nen chuan bi tra xe va upload anh doi chieu ngay khi ban giao.`,
        };
    }

    if (diffMs <= RETURN_REMINDER_LOOKAHEAD_MS) {
        return {
            scopeKey: `return-reminder:${bookingId}:24h`,
            title: 'Nhac han tra xe trong 24 gio toi',
            message: `${vehicleName} can duoc tra truoc ${dueLabel}. He thong dang theo doi han tra de nhac ban dung quy trinh.`,
        };
    }

    return null;
}

function getVehicleName(booking) {
    const vehicle = booking?.vehicle_id;
    if (!vehicle) {
        return 'Xe cua ban';
    }

    return vehicle.vehicle_name
        || vehicle.name
        || [vehicle.brand, vehicle.model].filter(Boolean).join(' ')
        || 'Xe cua ban';
}

/**
 * Chuyen timestamp thanh dang "x phut truoc", "x gio truoc", v.v.
 */
function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Vua xong';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} phut truoc`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} gio truoc`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngay truoc`;
    return new Date(date).toLocaleDateString('vi-VN');
}

module.exports = new NotificationService();

// Export helper cho cac service khac dung de tao thong bao
module.exports.createNotification = (payload) => new NotificationService().create(payload);
