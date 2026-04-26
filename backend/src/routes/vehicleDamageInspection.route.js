const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const vehicleDamageInspectionController = require('../controllers/vehicleDamageInspection.controller');

const router = express.Router();

router.post('/list', authMiddleware, vehicleDamageInspectionController.list);
router.post('/', authMiddleware, vehicleDamageInspectionController.create);

module.exports = router;
