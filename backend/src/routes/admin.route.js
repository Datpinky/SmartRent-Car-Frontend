const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");
const adminController = require("../controllers/admin.controller");
const adminValidation = require("../validations/admin.validation");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("admin"));

router.get("/users", adminValidation.listUsers, validate, adminController.listUsers);
router.patch("/users/:id/active", adminValidation.setUserActive, validate, adminController.setUserActive);

router.get("/showrooms", adminValidation.listShowrooms, validate, adminController.listShowrooms);
router.patch("/showrooms/:id/approve", adminValidation.approveShowroom, validate, adminController.approveShowroom);
router.patch("/showrooms/:id/reject", adminValidation.rejectShowroom, validate, adminController.rejectShowroom);

router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/charts", adminController.getChartData);

router.get("/transactions", adminController.listTransactions);

module.exports = router;
