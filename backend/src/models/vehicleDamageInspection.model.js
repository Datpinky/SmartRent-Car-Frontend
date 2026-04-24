const mongoose = require('mongoose');

const vehicleDamageInspectionSchema = new mongoose.Schema(
  {
    showroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    before_image_urls: { type: [String], default: [] },
    after_image_urls: { type: [String], default: [] },
    ai_payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VehicleDamageInspection', vehicleDamageInspectionSchema);
