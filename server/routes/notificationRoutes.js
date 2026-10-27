const express = require('express');
const router = express.Router();
const {
  registerDeviceToken,
  removeDeviceToken,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  broadcastNotification,
  sendTestNotification
} = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Customer notification routes (Protected)
router.post('/device-token', protect, registerDeviceToken);
router.delete('/device-token', protect, removeDeviceToken);
router.get('/', protect, getUserNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);
router.post('/test', protect, sendTestNotification);

// Admin broadcast routes
router.post('/broadcast', protect, adminOnly, broadcastNotification);

module.exports = router;
