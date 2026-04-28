const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' }
    },
    { timestamps: true }
);

reviewSchema.index({ user: 1, booking_id: 1 });

module.exports = mongoose.model('Review', reviewSchema);
