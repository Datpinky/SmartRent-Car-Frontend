const userModel = require("../models/user.model");
const { signAccessToken } = require("../utils/jwt");
const throwError = require("../utils/throwError");
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
    async login(userData) {
        const user = await userModel.findOne({ email: userData.email }).select("+password");
        if (!user) {
            throwError("Email hoặc mật khẩu không đúng.", 401);
        }

        const isMatch = await user.comparePassword(userData.password);
        if (!isMatch) {
            throwError("Email hoặc mật khẩu không đúng.", 401);
        }

        const token = signAccessToken({ userId: user._id, role: user.role });

        const safeUser = pick(user, ["_id", "email", "name", "role"]);

        return { user: safeUser, token };
    }
}

module.exports = new AuthService();
