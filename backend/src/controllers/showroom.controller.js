const mongoose = require('mongoose');
const userModel = require('../models/user.model');

class ShowroomController {
  async getPublicProfile(req, res, next) {
    try {
      const { userId } = req.params;
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: 'ID showroom không hợp lệ' });
      }

      const user = await userModel
        .findOne({
          _id: userId,
          role: 'showroom',
          is_active: true,
          showroom_status: 'approved',
        })
        .select(
          'business_name public_address opening_hours policy_text logo_url showroom_description showroom_representative_name name phone'
        )
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy showroom' });
      }

      return res.status(200).json({
        message: 'OK',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ShowroomController();
