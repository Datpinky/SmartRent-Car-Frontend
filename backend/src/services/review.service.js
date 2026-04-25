const reviewModel = require("../models/review.model");
const bookingModel = require("../models/booking.model");
const vehicleModel = require("../models/vehicle.model");
const BaseService = require("./base.service");
const throwError = require("../utils/throwError");

const REVIEWABLE_BOOKING_STATUSES = new Set([
    "paid",
    "waiting_handover",
    "handed_over",
    "in_use",
    "waiting_return_confirmation",
    "completed",
]);

const canReviewBooking = (booking) => {
    if (!booking || !REVIEWABLE_BOOKING_STATUSES.has(booking.status)) {
        return false;
    }

    const endDate = new Date(booking.end_date);
    if (Number.isNaN(endDate.getTime())) {
        return false;
    }

    return Date.now() >= endDate.getTime();
};

class ReviewService {
    async createReview(body, userId) {
        const { booking_id, vehicle_id, rating, comment } = body;

        const [vehicle, booking, existingReview] = await Promise.all([
            vehicleModel.findById(vehicle_id),
            bookingModel.findById(booking_id),
            reviewModel.findOne({ user: userId, booking_id }),
        ]);

        if (!vehicle) {
            throwError("Khong tim thay xe", 404);
        }

        if (!booking) {
            throwError("Khong tim thay don thue", 404);
        }

        if (String(booking.user_id) !== String(userId)) {
            throwError("Ban khong the danh gia don thue nay", 403);
        }

        if (String(booking.vehicle_id) !== String(vehicle_id)) {
            throwError("Don thue khong thuoc xe nay", 400);
        }

        if (!canReviewBooking(booking)) {
            throwError("Chi co the danh gia sau khi don thue da ket thuc", 400);
        }

        if (existingReview) {
            throwError("Moi don thue chi duoc danh gia mot lan", 409);
        }

        const payload = {
            rating: Number(rating),
            comment: (comment || "").trim(),
        };

        return reviewModel.create({
            user: userId,
            booking_id,
            vehicle_id,
            ...payload,
        });
    }

    async updateReview(body, userId) {
        const { review_id, rating, comment } = body;

        const payload = { rating: Number(rating), comment: (comment || "").trim() };
        const review = await reviewModel.findOneAndUpdate(
            { _id: review_id, user: userId },
            payload,
            { new: true }
        );

        if (!review) {
            throwError("Khong tim thay danh gia de cap nhat", 404);
        }

        return review;
    }

    async getReviewsByVehicleId(vehicleId, body = {}) {
        const vehicle = await vehicleModel.findById(vehicleId);
        if (!vehicle) {
            throwError("Khong tim thay xe", 404);
        }

        const filter = { vehicle_id: vehicleId };
        const pagination = BaseService.parsePagination(body);
        const sort = { createdAt: -1 };

        const [data, total] = await Promise.all([
            reviewModel
                .find(filter)
                .sort(sort)
                .skip(pagination.skip)
                .limit(pagination.limit)
                .populate("user", "name")
                .lean(),
            reviewModel.countDocuments(filter),
        ]);

        return {
            data,
            pagination: {
                total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit) || 0,
            },
        };
    }

    async getMyReviewsByVehicleId(vehicleId, userId) {
        const vehicle = await vehicleModel.findById(vehicleId);
        if (!vehicle) {
            throwError("Khong tim thay xe", 404);
        }

        return reviewModel
            .find({ vehicle_id: vehicleId, user: userId })
            .sort({ createdAt: -1 })
            .lean();
    }
}

module.exports = new ReviewService();
