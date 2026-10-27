const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    orderNumber: {
      type: String,
      trim: true,
      default: ''
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true
    },
    applianceModel: {
      type: String,
      required: [true, 'Appliance model name is required'],
      trim: true
    },
    serialNumber: {
      type: String,
      required: [true, 'Appliance serial number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
      default: Date.now
    },
    purchaseChannel: {
      type: String,
      enum: ['Kirti Store Online', 'Kirti Store Showroom', 'Amazon India', 'Flipkart', 'Authorized Dealer'],
      default: 'Kirti Store Online'
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    invoiceImage: {
      type: String,
      default: ''
    },
    warrantyPeriodMonths: {
      type: Number,
      default: 24 // 2 Years Standard Comprehensive Appliance Warranty
    },
    warrantyValidUntil: {
      type: Date,
      required: true
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: ['Active', 'Claimed', 'Expired'],
      default: 'Active'
    },
    coverageDetails: {
      type: [String],
      default: [
        'Complete Motor & Magnetron Coverage (100% Free Replacement)',
        'Heating Element & Thermostat Breakdown Protection',
        'Guaranteed Doorstep Service within 48 Working Hours',
        '100% Genuine OEM Spares & Zero Labor Surcharges'
      ]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Warranty', warrantySchema);
