const vehicleModel = require("../models/vehicle.model");
const BaseService = require("./base.service");

/** Trường dùng để search theo tên (regex) */
const SEARCH_FIELDS = ["vehicle_brand", "vehicle_model"];

class VehicleService {
    async createVehicle(vehicle, userId) {
        return vehicleModel.create({ ...vehicle, added_by: userId });
    }

    async getListVehicles(body = {}) {
        const { search, vehicle_type, added_by, sort_by, sort_by_price, page, limit } = body;

        const filter = {};

        if (search && String(search).trim()) {
            const regex = new RegExp(String(search).trim(), 'i');
            filter.$or = SEARCH_FIELDS.map((field) => ({ [field]: regex }));
        }

        if (vehicle_type) filter.vehicle_type = vehicle_type;
        if (added_by) filter.added_by = added_by;

        const parsedSortBy = BaseService.parseSortDirection(sort_by);
        const parsedSortByPrice = BaseService.parseSortDirection(sort_by_price);

        const sort = {
            createdAt: parsedSortBy !== null ? parsedSortBy : -1,
        };

        if (parsedSortByPrice !== null) {
            sort.vehicle_hire_rate_in_figures = parsedSortByPrice;
        }

        const pagination = BaseService.parsePagination({ page, limit });

        return BaseService.findPaginated(vehicleModel, filter, sort, pagination);
    }

    async getVehicleById(vehicleId) {
        return vehicleModel.findById(vehicleId);
    }

    async updateVehicle(vehicleId, userId, updates) {
        const vehicle = await vehicleModel.findById(vehicleId);
        if (!vehicle) {
            const err = new Error("Không tìm thấy xe"); err.statusCode = 404; throw err;
        }
        if (String(vehicle.added_by) !== String(userId)) {
            const err = new Error("Bạn không có quyền chỉnh sửa xe này"); err.statusCode = 403; throw err;
        }
        const UPDATABLE = [
            "vehicle_brand", "vehicle_model", "vehicle_type",
            "vehicle_plate_number", "vehicle_engine_number", "vehicle_identification_number",
            "number_of_seats", "transmission", "fuel_type",
            "vehicle_hire_rate_in_figures", "vehicle_hire_rate_currency",
            "vehicle_hire_charge_per_timing", "vehicle_images_paths", "images",
            "description", "maximum_allowable_distance", "vehicle_name",
        ];
        UPDATABLE.forEach(k => { if (updates[k] !== undefined) vehicle[k] = updates[k]; });
        return vehicle.save();
    }

    async deleteVehicleById(vehicleId) {
        return vehicleModel.findByIdAndDelete(vehicleId);
    }
}

module.exports = new VehicleService();
