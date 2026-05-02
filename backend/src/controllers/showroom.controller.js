const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');

const SHOWROOM_PUBLIC_FIELDS = [
  'business_name',
  'public_address',
  'opening_hours',
  'policy_text',
  'logo_url',
  'showroom_description',
  'showroom_representative_name',
  'name',
  'phone',
].join(' ');

const parsePositiveInt = (value, fallback, max) => {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }
  return Math.min(numeric, max);
};

class ShowroomController {
  constructor() {
    this.getPublicProfile = this.getPublicProfile.bind(this);
    this.getPublicVehicles = this.getPublicVehicles.bind(this);
  }

  findPublicProvider(userId) {
    return userModel.findOne({
      _id: userId,
      is_active: true,
      $or: [
        { role: 'showroom', showroom_status: 'approved' },
        { role: 'owner' },
      ],
    });
  }

  async getPublicProfile(req, res, next) {
    try {
      const { userId } = req.params;
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid showroom id' });
      }

      const user = await this.findPublicProvider(userId)
        .select(SHOWROOM_PUBLIC_FIELDS)
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'Showroom not found' });
      }

      return res.status(200).json({
        message: 'OK',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPublicVehicles(req, res, next) {
    try {
      const { userId } = req.params;
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid showroom id' });
      }

      const showroom = await this.findPublicProvider(userId)
        .select('_id business_name name')
        .lean();

      if (!showroom) {
        return res.status(404).json({ message: 'Showroom not found' });
      }

      const page = parsePositiveInt(req.query.page, 1, 9999);
      const limit = parsePositiveInt(req.query.limit, 12, 48);
      const skip = (page - 1) * limit;

      const filter = {
        added_by: showroom._id,
        active: { $ne: false },
      };

      const [vehicles, total] = await Promise.all([
        vehicleModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({ path: 'added_by', select: 'name business_name role' })
          .lean(),
        vehicleModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        message: 'OK',
        data: vehicles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 0,
        },
        showroom: {
          _id: showroom._id,
          business_name: showroom.business_name || '',
          name: showroom.name || '',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ShowroomController();
