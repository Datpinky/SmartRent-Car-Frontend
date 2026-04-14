const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    showroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    renter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    type: { type: String, enum: ['rental', 'service'], default: 'rental' },
    status: { type: String, enum: ['draft', 'signed', 'expired', 'cancelled'], default: 'draft' },
    pdf_url: { type: String, trim: true, default: '' },
    signed_at: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
