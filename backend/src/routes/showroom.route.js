const express = require('express');
const { param, query } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const showroomController = require('../controllers/showroom.controller');

const router = express.Router();

router.get(
  '/public/:userId/vehicles',
  param('userId').isMongoId().withMessage('Invalid showroom id'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 48 }).withMessage('limit must be between 1 and 48'),
  validate,
  showroomController.getPublicVehicles
);

router.get(
  '/public/:userId',
  param('userId').isMongoId().withMessage('Invalid showroom id'),
  validate,
  showroomController.getPublicProfile
);

module.exports = router;
