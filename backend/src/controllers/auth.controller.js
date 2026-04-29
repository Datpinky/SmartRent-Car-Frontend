const authService = require("../services/auth.service");

class AuthController {
    async register(req, res, next) {
        try {
            const userData = req.body;
            const result = await authService.register(userData);
            return res.status(201).json({ message: "Register successfully", data: result });
        } catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const userData = req.body;
            const result = await authService.login(userData, {
                userAgent: req.get("user-agent") || "",
                ip: req.ip || req.socket?.remoteAddress || "",
            });
            return res.status(201).json({ message: "Login successfully", data: result });
        } catch (error) {
            next(error);
        }
    }

    async registerShowroom(req, res, next) {
        try {
            const result = await authService.registerShowroom(req.body);
            return res.status(201).json({
                message: "Đăng ký showroom thành công. Vui lòng chờ admin xét duyệt.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req, res, next) {
        try {
            const data = await authService.getProfile(req.user.userId);
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const data = await authService.updateProfile(req.user.userId, req.body);
            return res.status(200).json({ message: "Đã cập nhật hồ sơ", data });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const data = await authService.changePassword(req.user.userId, currentPassword, newPassword, {
                userAgent: req.get("user-agent") || "",
                ip: req.ip || req.socket?.remoteAddress || "",
            });
            return res.status(200).json({ message: "Đã đổi mật khẩu", data });
        } catch (error) {
            next(error);
        }
    }

    async listSessions(req, res, next) {
        try {
            const data = await authService.listSessions(req.user.userId, req.user.jti);
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email, newPassword } = req.body;
            const data = await authService.forgotPassword(email, newPassword);
            return res.status(200).json({
                message: "Dat lai mat khau thanh cong. Vui long dang nhap lai.",
                data,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
