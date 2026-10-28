const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  apartment: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  phone: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' }
}, { _id: true });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [60, 'Name cannot be more than 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
    default: ''
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  avatar: {
    type: String,
    default: ''
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.googleId && !this.phone;
    },
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  addresses: [AddressSchema],
  fcmTokens: [{
    token: { type: String, required: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    deviceName: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Compare password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Generate signed JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'kirti_store_super_secure_jwt_secret_key_2026_modern_appliances',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = mongoose.model('User', UserSchema);
