const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const validate = require('../middlewares/validate.middleware');
const router = express.Router();

router.post('/register', authValidation.register, validate, authController.register);
router.post('/register-showroom', authValidation.registerShowroom, validate, authController.registerShowroom);

router.post('/login', authValidation.login, validate, authController.login);

module.exports = router;
