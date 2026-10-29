const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true
  },
  code: {
    type: String,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['headquarters', 'flagship', 'service_center', 'retail_counter', 'spare_hub'],
    default: 'headquarters'
  },
  tagline: {
    type: String,
    default: 'Official Kirti Store Outlet'
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    default: 'Gujarat',
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  googleMapsUrl: {
    type: String,
    trim: true
  },
  googlePlaceId: {
    type: String,
    trim: true
  },
  operatingHours: {
    openTime: {
      type: String,
      default: '10:00 AM'
    },
    closeTime: {
      type: String,
      default: '08:00 PM'
    },
    lunchBreak: {
      type: String,
      default: '01:00 PM - 03:00 PM'
    },
    workingDays: {
      type: String,
      default: 'Monday - Saturday (Sunday Closed)'
    }
  },
  services: [{
    type: String,
    trim: true
  }],
  features: {
    hasParking: { type: Boolean, default: true },
    acceptsUpi: { type: Boolean, default: true },
    hasLiveDemo: { type: Boolean, default: true },
    expressRepair: { type: Boolean, default: true },
    clickAndCollect: { type: Boolean, default: true }
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  },
  rating: {
    type: Number,
    default: 4.8
  },
  reviewsCount: {
    type: Number,
    default: 120
  },
  status: {
    type: String,
    enum: ['active', 'temporarily_closed', 'coming_soon'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Store', StoreSchema);

