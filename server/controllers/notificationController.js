const Notification = require('../models/Notification');
const User = require('../models/User');
const Product = require('../models/Product');
const pushNotificationService = require('../services/pushNotificationService');

// @desc    Register or update device FCM token for push notifications
// @route   POST /api/notifications/device-token
// @access  Private
exports.registerDeviceToken = async (req, res, next) => {
  try {
    const { token, platform = 'android', deviceName = '' } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid FCM device token is required.'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    // Check if token already exists
    const existingIndex = user.fcmTokens.findIndex(t => t.token === token.trim());
    if (existingIndex > -1) {
      user.fcmTokens[existingIndex].platform = platform;
      user.fcmTokens[existingIndex].deviceName = deviceName || user.fcmTokens[existingIndex].deviceName;
      user.fcmTokens[existingIndex].updatedAt = new Date();
    } else {
      user.fcmTokens.push({
        token: token.trim(),
        platform,
        deviceName,
        updatedAt: new Date()
      });
    }

    // Keep maximum 5 tokens per user account (phones, tablets)
    if (user.fcmTokens.length > 5) {
      user.fcmTokens = user.fcmTokens.slice(-5);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'FCM push notification token registered successfully.',
      tokensCount: user.fcmTokens.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove device FCM token on logout
// @route   DELETE /api/notifications/device-token
// @access  Private
exports.removeDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    const user = await User.findById(req.user.id);
    if (user && user.fcmTokens) {
      user.fcmTokens = user.fcmTokens.filter(t => t.token !== token.trim());
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Device token unregistered.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notifications with unread count
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user.id, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.status(200).json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Broadcast a Flash Deal or Store Announcement to all users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, body, productId, url, discountPercent, sendPush = true } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Notification title and body are required.'
      });
    }

    let productDetails = null;
    if (productId) {
      productDetails = await Product.findById(productId).select('name sellingPrice images');
    }

    const result = await pushNotificationService.sendFlashDealBroadcast({
      title,
      body,
      productId: productDetails?._id || productId || '',
      url: url || (productDetails ? `/product/${productDetails._id}` : '/deals'),
      discountPercent: Number(discountPercent) || 0,
      sendPush: Boolean(sendPush)
    });

    res.status(200).json({
      success: true,
      message: `Flash deal notification broadcasted to ${result.recipientCount} customer(s) across ${result.deviceCount} native devices.`,
      result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send test push notification to current user device
// @route   POST /api/notifications/test
// @access  Private
exports.sendTestNotification = async (req, res, next) => {
  try {
    const notification = await pushNotificationService.sendToUser(req.user.id, {
      title: '🔔 Kirti Store Push Notification Test',
      body: 'Your device is connected! You will receive live alerts for order dispatches, restocks & flash deals.',
      type: 'system',
      data: {
        url: '/account'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Test notification triggered successfully.',
      notification
    });
  } catch (error) {
    next(error);
  }
};
