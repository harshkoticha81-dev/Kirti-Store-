const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  SKU: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: ''
  },
  items: [OrderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    apartment: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  transportationCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: [
      'Cash on Delivery',
      'COD',
      'Online Payment',
      'UPI',
      'UPI - Mobile Number',
      'UPI - QR Code',
      'UPI - VPA'
    ],
    default: 'UPI'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentId: {
    type: String,
    default: ''
  },
  upiTransactionId: {
    type: String,
    default: '',
    trim: true
  },
  paymentScreenshot: {
    type: String,
    default: ''
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  statusTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],
  courier: {
    type: String,
    default: 'Blue Dart Express'
  },
  trackingAwb: {
    type: String,
    default: ''
  },
  estimatedDelivery: {
    type: Date
  },
  deliveryOtp: {
    type: String,
    default: ''
  },
  deliveryDriver: {
    name: { type: String, default: 'Ramesh Solanki' },
    phone: { type: String, default: '919876543210' },
    vehicleNumber: { type: String, default: 'GJ-03-BW-8924' },
    vehicleType: { type: String, default: 'Tata Ace Super Delivery Van' },
    rating: { type: Number, default: 4.9 },
    deliveriesCount: { type: Number, default: 1420 }
  },
  liveTracking: {
    currentStatus: { type: String, default: 'Dispatched from Central Hub' },
    currentLandmark: { type: String, default: 'NH-27 Transit Corridor' },
    speedKmH: { type: Number, default: 42 },
    distanceRemainingKm: { type: Number, default: 3.8 },
    lastUpdated: { type: Date, default: Date.now }
  },
  notes: {
    type: String,
    default: ''
  },
  rtoRisk: {
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW'
    },
    riskScore: {
      type: Number,
      default: 15,
      min: 0,
      max: 100
    },
    flags: [{
      code: { type: String },
      severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
      message: { type: String }
    }],
    addressVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: String,
      default: ''
    },
    verifiedAt: {
      type: Date
    },
    verificationNotes: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// Auto populate status timeline, AWB, delivery OTP, and estimated delivery on creation
OrderSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.statusTimeline || this.statusTimeline.length === 0) {
      this.statusTimeline = [{
        status: this.orderStatus,
        timestamp: new Date(),
        note: 'Order placed by customer'
      }];
    }
    if (!this.deliveryOtp) {
      this.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }
    if (!this.trackingAwb && this._id) {
      this.trackingAwb = `KRT${this._id.toString().slice(-8).toUpperCase()}IN`;
    }
    if (!this.estimatedDelivery) {
      const est = new Date();
      est.setDate(est.getDate() + 3);
      this.estimatedDelivery = est;
    }
  }
  next();
});

OrderSchema.index({ user: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ upiTransactionId: 1 });
OrderSchema.index({ 'rtoRisk.riskLevel': 1 });
OrderSchema.index({ 'rtoRisk.addressVerified': 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
