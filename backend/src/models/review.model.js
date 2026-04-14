const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        reported: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
