const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['booking', 'payment', 'ai', 'verify', 'system'],
            default: 'system',
        },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        link: { type: String, default: '' },
        scope_key: { type: String, trim: true },
        read: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

// Index để lấy thông báo theo user + chưa đọc nhanh
notificationSchema.index({ recipient_id: 1, read: 1, createdAt: -1 });
notificationSchema.index(
    { recipient_id: 1, scope_key: 1 },
    {
        unique: true,
        partialFilterExpression: {
            scope_key: { $exists: true, $type: 'string' },
        },
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
