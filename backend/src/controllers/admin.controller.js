const adminService = require("../services/admin.service");

class AdminController {
    async listUsers(req, res, next) {
        try {
            const data = await adminService.listUsers(req.query);
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }

    async setUserActive(req, res, next) {
        try {
            const data = await adminService.setUserActive(req.params.id, req.body.is_active, req.user.userId);
            return res.status(200).json({ message: "Đã cập nhật trạng thái tài khoản", data });
        } catch (error) {
            next(error);
        }
    }

    async listShowrooms(req, res, next) {
        try {
            const data = await adminService.listShowrooms(req.query);
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }

    async approveShowroom(req, res, next) {
        try {
            const data = await adminService.approveShowroom(req.params.id);
            return res.status(200).json({ message: "Đã phê duyệt tài khoản showroom", data });
        } catch (error) {
            next(error);
        }
    }

    async rejectShowroom(req, res, next) {
        try {
            const data = await adminService.rejectShowroom(req.params.id, req.body?.reason);
            return res.status(200).json({ message: "Đã từ chối tài khoản showroom", data });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
