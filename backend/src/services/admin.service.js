const { pick } = require("lodash");
const userModel = require("../models/user.model");
const vehicleModel = require("../models/vehicle.model");
const bookingModel = require("../models/booking.model");
const paymentModel = require("../models/payment.model");
const reviewModel = require("../models/review.model");
const throwError = require("../utils/throwError");

const SHOWROOM_FIELDS = [
    "_id", "name", "email", "phone", "business_name", "tax_code",
    "showroom_status", "license_document_urls", "showroom_rejection_reason", "createdAt",
];

function formatDateVi(d) {
    if (!d) return "";
    try {
        const x = new Date(d);
        return x.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return "";
    }
}

/** user | owner | showroom | admin → renter | owner | showroom | admin */
function mapRoleToApi(role) {
    if (role === "user") return "renter";
    return role;
}

function computeAccountStatus(u) {
    if (!u.is_active) return "locked";
    if (u.role === "showroom") {
        const s = (u.showroom_status || "pending").toLowerCase();
        if (s === "approved") return "approved";
        if (s === "rejected") return "rejected";
        return "pending";
    }
    const hasPhone = u.phone && String(u.phone).trim().length >= 8;
    return hasPhone ? "verified" : "unverified";
}

class AdminService {
    /**
     * Danh sách user cho admin: khách thuê (user), chủ xe (owner), showroom, admin.
     * @param {{ search?: string }} query
     */
    async listUsers(query = {}) {
        const search = (query.search || "").trim();
        const filter = {};
        if (search) {
            const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ name: rx }, { email: rx }];
        }

        const users = await userModel.find(filter).select("-password").sort({ createdAt: -1 }).lean();
        const ids = users.map((u) => u._id);

        const [bookingAgg, vehicleAgg] = await Promise.all([
            ids.length
                ? bookingModel.aggregate([
                    { $match: { user_id: { $in: ids } } },
                    { $group: { _id: "$user_id", count: { $sum: 1 } } },
                ])
                : [],
            ids.length
                ? vehicleModel.aggregate([
                    { $match: { added_by: { $in: ids } } },
                    { $group: { _id: "$added_by", count: { $sum: 1 } } },
                ])
                : [],
        ]);

        const bookingMap = Object.fromEntries(bookingAgg.map((b) => [String(b._id), b.count]));
        const vehicleMap = Object.fromEntries(vehicleAgg.map((v) => [String(v._id), v.count]));

        return users.map((u) => {
            const id = String(u._id);
            let bookings = 0;
            if (u.role === "user") bookings = bookingMap[id] || 0;
            else if (u.role === "owner" || u.role === "showroom") bookings = vehicleMap[id] || 0;

            return {
                id: u._id,
                name: u.name,
                email: u.email,
                phone: u.phone || "",
                role: mapRoleToApi(u.role),
                backendRole: u.role,
                bookings,
                status: computeAccountStatus(u),
                createdAt: formatDateVi(u.createdAt),
                createdAtIso: u.createdAt,
            };
        });
    }

    async setUserActive(userId, isActive, actorUserId) {
        if (String(actorUserId) === String(userId)) {
            throwError("Không thể khóa/mở khóa chính tài khoản đang đăng nhập", 400);
        }
        const user = await userModel.findById(userId);
        if (!user) throwError("Không tìm thấy người dùng", 404);
        user.is_active = !!isActive;
        await user.save();
        return { id: user._id, is_active: user.is_active };
    }

    // ─── Showroom (cho /api/admin/showrooms) ─────────────────────────────────

    async listShowrooms(query = {}) {
        const raw = (query.status || "all").toLowerCase();
        const filter = { role: "showroom" };
        if (raw !== "all" && ["pending", "approved", "rejected"].includes(raw)) {
            filter.showroom_status = raw;
        }

        const users = await userModel
            .find(filter)
            .select(SHOWROOM_FIELDS.join(" "))
            .sort({ createdAt: -1 })
            .lean();

        const ids = users.map((u) => u._id);
        if (ids.length === 0) return [];

        const counts = await vehicleModel.aggregate([
            { $match: { added_by: { $in: ids } } },
            { $group: { _id: "$added_by", count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

        return users.map((u) => ({
            id: u._id,
            name: u.business_name || u.name,
            contactName: u.name,
            email: u.email,
            phone: u.phone || "",
            tax_code: u.tax_code || "",
            // showroom_status có thể null ở record cũ → mặc định "pending"
            status: u.showroom_status || "pending",
            license_document_urls: u.license_document_urls || [],
            rejection_reason: u.showroom_rejection_reason || "",
            createdAt: u.createdAt,
            vehicles: countMap[String(u._id)] || 0,
        }));
    }

    async approveShowroom(showroomUserId) {
        const user = await userModel.findOne({ _id: showroomUserId, role: "showroom" });
        if (!user) throwError("Không tìm thấy tài khoản showroom", 404);
        if (user.showroom_status === "approved") {
            throwError("Showroom đã được duyệt trước đó", 400);
        }

        user.showroom_status = "approved";
        user.is_active = true;
        user.showroom_rejection_reason = "";
        await user.save();

        const o = user.toObject();
        return pick(o, ["_id", "name", "email", "phone", "business_name", "showroom_status"]);
    }

    async rejectShowroom(showroomUserId, reason) {
        const user = await userModel.findOne({ _id: showroomUserId, role: "showroom" });
        if (!user) throwError("Không tìm thấy tài khoản showroom", 404);
        if (user.showroom_status === "approved") {
            throwError("Không thể từ chối showroom đã được duyệt", 400);
        }

        user.showroom_status = "rejected";
        user.is_active = false;
        user.showroom_rejection_reason = (reason && String(reason).trim()) || "Không đạt yêu cầu";
        await user.save();

        const o = user.toObject();
        return pick(o, ["_id", "name", "email", "business_name", "showroom_status", "showroom_rejection_reason"]);
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────

    async getDashboardStats() {
        const [
            totalUsers,
            totalShowrooms,
            totalBookings,
            activeVehicles,
            pendingShowrooms,
            revenueAgg,
            recentBookingsRaw,
        ] = await Promise.all([
            userModel.countDocuments({ role: { $in: ["user", "owner"] } }),
            userModel.countDocuments({ role: "showroom" }),
            bookingModel.countDocuments(),
            vehicleModel.countDocuments({ active: true }),
            userModel.countDocuments({ role: "showroom", showroom_status: "pending" }),
            paymentModel.aggregate([
                { $match: { payment_status: "successful" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            bookingModel
                .find()
                .sort({ createdAt: -1 })
                .limit(6)
                .populate("user_id", "name email")
                .populate("vehicle_id", "vehicle_name brand model")
                .populate("showroom_id", "name business_name")
                .lean(),
        ]);

        const totalRevenue = revenueAgg[0]?.total || 0;

        const recentBookings = recentBookingsRaw.map((b) => ({
            id: b._id,
            code: "BK" + String(b._id).slice(-6).toUpperCase(),
            renter: b.user_id?.name || "—",
            vehicle: b.vehicle_id
                ? [b.vehicle_id.brand, b.vehicle_id.vehicle_name || b.vehicle_id.model].filter(Boolean).join(" ")
                : "—",
            showroom: b.showroom_id?.business_name || b.showroom_id?.name || "—",
            from: b.start_date ? new Date(b.start_date).toLocaleDateString("vi-VN") : "—",
            to: b.end_date ? new Date(b.end_date).toLocaleDateString("vi-VN") : "—",
            total: b.total_price || 0,
            status: b.status,
        }));

        return {
            totalUsers,
            totalShowrooms,
            totalBookings,
            activeVehicles,
            pendingCount: pendingShowrooms,
            totalRevenue,
            recentBookings,
        };
    }

    async getChartData() {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [revenueAgg, userGrowthAgg, vehicleStatusAgg, vehicleCategoryAgg] = await Promise.all([
            // Revenue & bookings per month (last 12 months)
            paymentModel.aggregate([
                { $match: { payment_status: "successful", createdAt: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        revenue: { $sum: "$amount" },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),
            // User registrations per month per role (last 6 months)
            userModel.aggregate([
                { $match: { role: { $in: ["user", "owner", "showroom"] }, createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, role: "$role" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),
            // Vehicle status distribution
            vehicleModel.aggregate([
                { $match: { active: true } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            // Vehicle category distribution
            vehicleModel.aggregate([
                { $match: { active: true } },
                { $group: { _id: "$vehicle_type", count: { $sum: 1 } } },
            ]),
        ]);

        // Build monthly revenue array (T1..T12)
        const revenueMap = {};
        revenueAgg.forEach((r) => {
            const key = `${r._id.year}-${r._id.month}`;
            revenueMap[key] = r.revenue;
        });

        // Booking count per month
        const bookingCountAgg = await bookingModel.aggregate([
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const bookingMap = {};
        bookingCountAgg.forEach((b) => {
            bookingMap[`${b._id.year}-${b._id.month}`] = b.count;
        });

        const revenueMonthly = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            revenueMonthly.push({
                month: `T${d.getMonth() + 1}`,
                revenue: Math.round((revenueMap[key] || 0) / 1_000_000),
                bookings: bookingMap[key] || 0,
                target: 0,
            });
        }

        // Build user growth per month (last 6 months)
        const userGrowthMap = {};
        userGrowthAgg.forEach((u) => {
            const key = `${u._id.year}-${u._id.month}`;
            if (!userGrowthMap[key]) userGrowthMap[key] = { renters: 0, owners: 0, showrooms: 0 };
            if (u._id.role === "user") userGrowthMap[key].renters = u.count;
            else if (u._id.role === "owner") userGrowthMap[key].owners = u.count;
            else if (u._id.role === "showroom") userGrowthMap[key].showrooms = u.count;
        });

        const userGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            userGrowth.push({
                month: `T${d.getMonth() + 1}`,
                ...(userGrowthMap[key] || { renters: 0, owners: 0, showrooms: 0 }),
            });
        }

        const STATUS_VI = {
            available: "Sẵn sàng",
            rented: "Đang thuê",
            waiting_handover: "Đang giao",
            maintenance: "Bảo dưỡng",
            reserved: "Đã đặt",
        };
        const STATUS_COLORS = {
            available: "#059669",
            rented: "#2563eb",
            waiting_handover: "#0891b2",
            maintenance: "#7c3aed",
            reserved: "#d97706",
        };
        const vehicleStatusPie = vehicleStatusAgg.map((v) => ({
            name: STATUS_VI[v._id] || v._id,
            value: v.count,
            color: STATUS_COLORS[v._id] || "#9ca3af",
        }));

        const TYPE_COLORS = {
            SUV: "#00b14f",
            Sedan: "#2563eb",
            MPV: "#7c3aed",
            Hatchback: "#d97706",
            Truck: "#0891b2",
            Bike: "#dc2626",
            Bicycle: "#6d28d9",
            Wagon: "#059669",
            others: "#9ca3af",
        };
        const vehicleCategoryPie = vehicleCategoryAgg.map((v) => ({
            name: v._id,
            value: v.count,
            color: TYPE_COLORS[v._id] || "#9ca3af",
        }));

        return { revenueMonthly, userGrowth, vehicleStatusPie, vehicleCategoryPie };
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    async listTransactions(query = {}) {
        const filter = {};
        const statusMap = { paid: "successful", processing: "pending", failed: "failed" };
        if (query.status && query.status !== "all" && statusMap[query.status]) {
            filter.payment_status = statusMap[query.status];
        }

        const payments = await paymentModel
            .find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: "booking_id",
                populate: [
                    { path: "user_id", select: "name email" },
                    { path: "vehicle_id", select: "vehicle_name brand model" },
                    { path: "showroom_id", select: "name business_name" },
                ],
            })
            .lean();

        const payStatusToFE = { successful: "paid", pending: "processing", declined: "processing", failed: "failed" };

        return payments.map((p) => {
            const b = p.booking_id || {};
            return {
                id: p._id,
                code: "GD" + String(p._id).slice(-6).toUpperCase(),
                bookingId: b._id ? "BK" + String(b._id).slice(-6).toUpperCase() : "—",
                renter: b.user_id?.name || "—",
                vehicle: b.vehicle_id
                    ? [b.vehicle_id.brand, b.vehicle_id.vehicle_name || b.vehicle_id.model].filter(Boolean).join(" ")
                    : "—",
                showroom: b.showroom_id?.business_name || b.showroom_id?.name || "—",
                amount: p.amount || 0,
                method: p.payment_method || "—",
                status: payStatusToFE[p.payment_status] || "processing",
                date: p.paid_at
                    ? new Date(p.paid_at).toLocaleString("vi-VN")
                    : new Date(p.createdAt).toLocaleString("vi-VN"),
            };
        });
    }

    // ─── Reviews / Content Moderation ────────────────────────────────────────

    async listReviews(query = {}) {
        const filter = {};
        if (query.status && query.status !== "all") {
            if (query.status === "reported") {
                filter.reported = true;
            } else {
                filter.status = query.status;
            }
        }

        const reviews = await reviewModel
            .find(filter)
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .populate("vehicle_id", "vehicle_name brand model")
            .lean();

        return reviews.map((r) => ({
            id: r._id,
            user: r.user?.name || "—",
            userEmail: r.user?.email || "",
            vehicle: r.vehicle_id
                ? [r.vehicle_id.brand, r.vehicle_id.vehicle_name || r.vehicle_id.model].filter(Boolean).join(" ")
                : "—",
            rating: r.rating,
            comment: r.comment || "",
            status: r.status || "pending",
            reported: r.reported || false,
            date: new Date(r.createdAt).toLocaleDateString("vi-VN"),
        }));
    }

    async approveReview(reviewId) {
        const review = await reviewModel.findById(reviewId);
        if (!review) throwError("Không tìm thấy đánh giá", 404);
        review.status = "approved";
        await review.save();
        return { id: review._id, status: review.status };
    }

    async rejectReview(reviewId) {
        const review = await reviewModel.findById(reviewId);
        if (!review) throwError("Không tìm thấy đánh giá", 404);
        review.status = "rejected";
        await review.save();
        return { id: review._id, status: review.status };
    }
}

module.exports = new AdminService();
