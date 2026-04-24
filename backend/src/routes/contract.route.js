const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const contractController = require('../controllers/contract.controller');

const router = express.Router();

router.post('/list', authMiddleware, contractController.list);
router.get('/:contractId', authMiddleware, contractController.getById);
router.post('/', authMiddleware, contractController.create);

module.exports = router;
