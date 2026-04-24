const crypto = require("crypto");
const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const { signAccessToken } = require("../utils/jwt");
const throwError = require("../utils/throwError");
const { buildSessionSummaryLine } = require("../utils/sessionDisplay");
const { pick } = require("lodash");

const SAFE_USER_KEYS_BASE = [
    "_id",
    "email",
    "name",
    "role",
    "phone",
    "showroom_status",
    "business_name",
    "tax_code",
];

const SAFE_USER_KEYS_SHOWROOM = [
    ...SAFE_USER_KEYS_BASE,
    "license_document_urls",
    "public_address",
    "opening_hours",
    "policy_text",
    "logo_url",
    "showroom_description",
    "showroom_representative_name",
    "showroom_license_public",
];

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

        const safeUser = this.toSafeUser(user);

        return { user: safeUser, token };
    }

    toSafeUser(userDoc) {
        const o = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
        const keys = o.role === "showroom" ? SAFE_USER_KEYS_SHOWROOM : SAFE_USER_KEYS_BASE;
        return pick(o, keys);
    }

    async getProfile(userId) {
        const user = await userModel.findById(userId);
        if (!user) throwError("Không tìm thấy người dùng", 404);
        return this.toSafeUser(user);
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
        const user = await userModel.findById(userId);
        if (!user) throwError("Không tìm thấy người dùng", 404);

        const showroomKeys = [
            "business_name",
            "public_address",
            "opening_hours",
            "policy_text",
            "logo_url",
            "showroom_description",
            "showroom_representative_name",
            "showroom_license_public",
        ];
        const hasUpdate =
            ["name", "phone"].some((k) => payload[k] !== undefined) ||
            (user.role === "showroom" && showroomKeys.some((k) => payload[k] !== undefined));

        if (!hasUpdate) throwError("Không có dữ liệu cập nhật", 400);

        if (payload.name != null) user.name = String(payload.name).trim();
        if (payload.phone != null) {
            const digits = String(payload.phone).replace(/\D/g, "");
            if (digits.length !== 10) throwError("Số điện thoại phải có đúng 10 chữ số", 400);
            user.phone = digits;
        }

        if (user.role === "showroom") {
            if (payload.business_name !== undefined) {
                user.business_name = String(payload.business_name || "").trim().slice(0, 200);
            }
            if (payload.public_address !== undefined) {
                user.public_address = String(payload.public_address || "").trim().slice(0, 500);
            }
            if (payload.opening_hours !== undefined) {
                user.opening_hours = String(payload.opening_hours || "").trim().slice(0, 200);
            }
            if (payload.policy_text !== undefined) {
                user.policy_text = String(payload.policy_text || "").trim().slice(0, 20000);
            }
            if (payload.logo_url !== undefined) {
                user.logo_url = String(payload.logo_url || "").trim().slice(0, 500);
            }
            if (payload.showroom_description !== undefined) {
                user.showroom_description = String(payload.showroom_description || "").trim().slice(0, 5000);
            }
            if (payload.showroom_representative_name !== undefined) {
                user.showroom_representative_name = String(payload.showroom_representative_name || "")
                    .trim()
                    .slice(0, 120);
            }
            if (payload.showroom_license_public !== undefined) {
                user.showroom_license_public = String(payload.showroom_license_public || "").trim().slice(0, 200);
            }
        }

        await user.save();
        return this.toSafeUser(user);
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
