const mongoose = require('mongoose');

const SpecificationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters']
  },
  slug: {
    type: String,
    required: [true, 'Please provide product slug'],
    unique: true,
    lowercase: true,
    trim: true
  },
  SKU: {
    type: String,
    required: [true, 'Please provide product SKU'],
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide product category']
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    default: 'Kirti',
    trim: true
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Please provide product description']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please provide selling price'],
    min: [0, 'Selling price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    default: null
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: [0, 'Threshold cannot be negative']
  },
  images: {
    type: [String],
    default: []
  },
  specifications: [SpecificationSchema],
  warranty: {
    type: String,
    default: '2 Years Manufacturer Warranty'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  packageSize: {
    type: String,
    enum: ['small', 'big'],
    default: 'small'
  },
  transportationCharge: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  // Spare Parts & Accessories Portal Fields
  isSparePart: {
    type: Boolean,
    default: false
  },
  sparePartCategory: {
    type: String,
    enum: ['jars', 'blades', 'lids', 'gaskets', 'couplers', 'filters', 'bowls', 'cords-chargers', 'attachments', 'other'],
    default: 'other'
  },
  compatibleModels: [{
    type: String,
    trim: true
  }],
  applianceType: {
    type: String,
    trim: true,
    default: ''
  },
  partNumber: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Virtual for Stock Status
ProductSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity <= 0) return 'Out of Stock';
  if (this.stockQuantity <= this.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
});

// Configure toJSON to include virtuals
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Text index for fast multi-field searching
ProductSchema.index({ name: 'text', description: 'text', categoryName: 'text', SKU: 'text' });
ProductSchema.index({ sellingPrice: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isSparePart: 1 });
ProductSchema.index({ isSparePart: 1, sparePartCategory: 1 });
ProductSchema.index({ compatibleModels: 1 });

module.exports = mongoose.model('Product', ProductSchema);
