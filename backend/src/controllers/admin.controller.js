const adminService = require("../services/admin.service");
const { auditLog } = require("../utils/auditLog");

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
            auditLog({
                event_type: "showroom.approve",
                actor: {
                    id: String(req.user.userId),
                    type: "user",
                    name: req.user.email || "",
                    ip_address: req.ip || "",
                },
                action: { type: "UPDATE", outcome: "success" },
                resource: { id: String(req.params.id), type: "showroom_user", name: "showroom_approval" },
            });
            return res.status(200).json({ message: "Đã phê duyệt tài khoản showroom", data });
        } catch (error) {
            next(error);
        }
    }

    async rejectShowroom(req, res, next) {
        try {
            const data = await adminService.rejectShowroom(req.params.id, req.body?.reason);
            auditLog({
                event_type: "showroom.reject",
                actor: {
                    id: String(req.user.userId),
                    type: "user",
                    name: req.user.email || "",
                    ip_address: req.ip || "",
                },
                action: { type: "UPDATE", outcome: "success" },
                resource: { id: String(req.params.id), type: "showroom_user", name: "showroom_rejection" },
            });
            return res.status(200).json({ message: "Đã từ chối tài khoản showroom", data });
        } catch (error) {
            next(error);
        }
    }

    async getDashboardStats(req, res, next) {
        try {
            const data = await adminService.getDashboardStats();
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }

    async getChartData(req, res, next) {
        try {
            const data = await adminService.getChartData();
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }

    async listTransactions(req, res, next) {
        try {
            const data = await adminService.listTransactions(req.query);
            return res.status(200).json({ message: "OK", data });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
