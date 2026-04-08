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
            const result = await authService.login(userData);
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
}

module.exports = new AuthController();
