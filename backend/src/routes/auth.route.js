const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const validate = require('../middlewares/validate.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register', authValidation.register, validate, authController.register);
router.post('/register-showroom', authValidation.registerShowroom, validate, authController.registerShowroom);

router.post('/login', authValidation.login, validate, authController.login);
router.post('/forgot-password', authValidation.forgotPassword, validate, authController.forgotPassword);

router.get('/me', authMiddleware, authController.getMe);
router.patch('/me', authMiddleware, authValidation.updateProfile, validate, authController.updateProfile);
router.post('/change-password', authMiddleware, authValidation.changePassword, validate, authController.changePassword);
router.get('/sessions', authMiddleware, authController.listSessions);

module.exports = router;
