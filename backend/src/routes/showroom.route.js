const express = require('express');
const { param } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const showroomController = require('../controllers/showroom.controller');

const router = express.Router();

router.get(
  '/public/:userId',
  param('userId').isMongoId().withMessage('ID không hợp lệ'),
  validate,
  showroomController.getPublicProfile
);

module.exports = router;
