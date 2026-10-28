const mongoose = require('mongoose');

const OtpTokenSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index automatically removes expired OTP documents
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtpToken', OtpTokenSchema);
