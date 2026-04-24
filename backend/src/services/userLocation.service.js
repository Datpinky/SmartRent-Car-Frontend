const UserLocation = require('../models/userLocation.model');
const BaseService = require('./base.service');
const QueryBuilder = require('../utils/queryBuilder');
const userModel = require('../models/user.model');
const throwError = require('../utils/throwError');
class UserLocationService {
  async createUserLocation(body = {}, userId) {
    const location = await UserLocation.create({ ...body, user: userId });
    return location
  }


  async getUserLocationByUserId(userId) {
    const location = await UserLocation.findOne({ user: userId });

    return location;
  }

  async updateUserLocationByUserId(userId, body={}) {
    return await UserLocation.findOneAndUpdate({ user: userId }, { ...body }, { new: true })
  }


  async deleteUserLocationByUserId(userId) {
    return await UserLocation.findOneAndDelete({ user: userId })
  }

  async getShowroomsLocation() {
    const showroomLocations = [];

    // 1. Lấy cursor từ UserLocation
    const cursor = UserLocation.find().cursor();

    // 2. Duyệt từng bản ghi trong cursor
    for await (const location of cursor) {
      const user = await userModel.findById(location.user);
      if (user && user.role === 'showroom') {
        showroomLocations.push({
          userId: location.user,
          name: user.name,
          role: user.role,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    }
    return showroomLocations;
  }
}

module.exports = new UserLocationService();