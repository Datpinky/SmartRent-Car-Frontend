const axios = require('axios');

const BASE_URL = "https://api.locationiq.com/v1"
const API_KEY = process.env.LOCATIONIQ_API_KEY

class MapService {
  /** Forward Geocoding: địa chỉ -> tọa độ */
  async forward(address) {
    const response = await axios.get(
      `${BASE_URL}/search?key=${process.env.LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&accept-language=vi&format=json`
    );
    return response;
  }
  /** Reverse Geocoding: tọa độ -> địa chỉ */
  async reverse(lat, lon) {
    const response = await axios.get(
      `${BASE_URL}/reverse?key=${process.env.LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&accept-language=vi&format=json`
    );

    return response;
  }
  async autocomplete(query, options = {}) {
    const {
      limit = 5,
      dedupe = 1, // mặc định loại bỏ trùng lặp
      countrycodes,
      normalizecity
    } = options;

    const params = new URLSearchParams({
      key: process.env.LOCATIONIQ_API_KEY,
      q: query,
      limit: String(limit),
      dedupe: String(dedupe)
    });

    if (countrycodes) params.append('countrycodes', countrycodes);
    if (normalizecity) params.append('normalizecity', normalizecity);

    const response = await axios.get(
      `${BASE_URL}/autocomplete?${params.toString()}&accept-language=vi&format=json`
    );
    return response;
  }
  /**Lấy đường đi nhanh nhất giữa các tọa độ theo thứ tự cung cấp. */
  async getDirections(profile, coordinates) {
    const url = `${BASE_URL}/directions/${profile}/${coordinates}?key=${API_KEY}`;
    const response = await axios.get(url);
    return response;
  }

}

module.exports = new MapService();