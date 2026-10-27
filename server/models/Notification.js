const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: 120
  },
  body: {
    type: String,
    required: [true, 'Notification body is required'],
    trim: true,
    maxlength: 300
  },
  type: {
    type: String,
    enum: [
      'order_dispatched',
      'order_out_for_delivery',
      'order_delivered',
      'order_status',
      'restock_alert',
      'flash_deal',
      'warranty',
      'system'
    ],
    default: 'system',
    index: true
  },
  data: {
    orderId: { type: String, default: '' },
    productId: { type: String, default: '' },
    url: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// TTL index to automatically clean up old notifications after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Notification', NotificationSchema);
