const crypto = require("crypto");
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const { signAccessToken } = require("../utils/jwt");
const throwError = require("../utils/throwError");
const { buildSessionSummaryLine } = require("../utils/sessionDisplay");
const { pick } = require("lodash");

class AuthService {
    async register(userData) {
        const userExists = await userModel.findOne({ email: userData.email });
        if (userExists) {
            throwError("Email already in use", 400);
        }
        return userModel.create(userData);
    }

    /**
     * Đăng ký tài khoản showroom — role cố định là "showroom",
     * showroom_status = "pending", is_active = false (chờ admin duyệt).
     */
    async registerShowroom(payload) {
        const { name, email, password, phone, business_name, tax_code, license_document_urls } = payload;

        const exists = await userModel.findOne({ email });
        if (exists) throwError("Email đã được sử dụng", 400);

        const doc = await userModel.create({
            name,
            email,
            password,
            phone: phone || "",
            role: "showroom",
            business_name: business_name || "",
            tax_code: tax_code || "",
            license_document_urls: Array.isArray(license_document_urls) ? license_document_urls : [],
            showroom_status: "pending",
            is_active: false,
        });

        return pick(doc.toObject(), [
            "_id", "name", "email", "phone",
            "business_name", "tax_code", "showroom_status", "createdAt",
        ]);
    }
    async login(userData, meta = {}) {
        const user = await userModel.findOne({ email: userData.email }).select("+password");
        if (!user) {
            throwError("Email hoặc mật khẩu không đúng.", 401);
        }

        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throwError("Email hoặc mật khẩu không đúng.", 401);
        }

        const jti = crypto.randomUUID();
        await sessionModel.create({
            user_id: user._id,
            jti,
            user_agent: meta.userAgent || "",
            ip: meta.ip || "",
        });

        const token = signAccessToken({ userId: user._id, role: user.role, jti });

        const safeUser = pick(user, ["_id", "email", "name", "role", "phone"]);

        return { user: safeUser, token };
    }

    async listSessions(userId, currentJti) {
        const rows = await sessionModel
            .find({ user_id: userId })
            .sort({ last_active_at: -1 })
            .limit(20)
            .lean();

        const sessions = rows.map((r) => ({
            jti: r.jti,
            summary: buildSessionSummaryLine(r.user_agent, r.ip, r.last_active_at),
            lastActiveAt: r.last_active_at,
            isCurrent: !!currentJti && r.jti === currentJti,
        }));

        return { sessions, legacyToken: !currentJti };
    }

    async updateProfile(userId, payload) {
        if (payload.name === undefined && payload.phone === undefined) {
            throwError("Không có dữ liệu cập nhật", 400);
        }

        const user = await userModel.findById(userId);
        if (!user) throwError("Không tìm thấy người dùng", 404);

        if (payload.name != null) user.name = String(payload.name).trim();
        if (payload.phone != null) {
            const digits = String(payload.phone).replace(/\D/g, "");
            if (digits.length !== 10) throwError("Số điện thoại phải có đúng 10 chữ số", 400);
            user.phone = digits;
        }

        await user.save();
        return pick(user.toObject(), ["_id", "name", "email", "phone", "role"]);
    }

    async changePassword(userId, currentPassword, newPassword, meta = {}) {
        const user = await userModel.findById(userId).select("+password");
        if (!user) throwError("Không tìm thấy người dùng", 404);

        const ok = await user.comparePassword(currentPassword);
        if (!ok) throwError("Mật khẩu hiện tại không đúng", 400);

        user.password = newPassword;
        await user.save();

        await sessionModel.deleteMany({ user_id: userId });

        const jti = crypto.randomUUID();
        await sessionModel.create({
            user_id: user._id,
            jti,
            user_agent: meta.userAgent || "",
            ip: meta.ip || "",
        });
        const token = signAccessToken({ userId: user._id, role: user.role, jti });

        return { ok: true, token };
    }
}

module.exports = new AuthService();
