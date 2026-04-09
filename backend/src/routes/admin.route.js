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
router.get("/profile/overview", adminController.getProfileOverview);
router.patch("/profile", adminValidation.updateProfile, validate, adminController.updateProfile);
router.patch("/profile/password", adminValidation.changePassword, validate, adminController.changePassword);
router.get("/profile/activity", adminController.getProfileActivity);
router.get("/profile/sessions", adminController.getProfileSessions);

router.get("/transactions", adminController.listTransactions);

router.get("/reviews", adminController.listReviews);
router.patch("/reviews/:id/approve", adminController.approveReview);
router.patch("/reviews/:id/reject", adminController.rejectReview);

module.exports = router;
