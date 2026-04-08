const { pick } = require("lodash");
const userModel = require("../models/user.model");
const vehicleModel = require("../models/vehicle.model");
const bookingModel = require("../models/booking.model");
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
}

module.exports = new AdminService();
