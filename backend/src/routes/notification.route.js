const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const notifController = require('../controllers/notification.controller');

const router = express.Router();

// Tất cả các route đều yêu cầu đăng nhập
router.use(authMiddleware);

// Lấy danh sách thông báo (có phân trang: ?limit=50&skip=0)
router.get('/', notifController.list);

// Đếm số chưa đọc (cho badge)
router.get('/unread-count', notifController.countUnread);

// Đánh dấu TẤT CẢ đã đọc (phải đặt trước /:id để không bị nhầm)
router.patch('/read-all', notifController.markAllRead);

// Xóa tất cả đã đọc
router.delete('/read', notifController.deleteAllRead);

// Đánh dấu 1 thông báo đã đọc
router.patch('/:id/read', notifController.markRead);

// Xóa 1 thông báo
router.delete('/:id', notifController.deleteOne);

module.exports = router;
