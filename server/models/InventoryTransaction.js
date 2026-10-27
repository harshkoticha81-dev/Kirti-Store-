const mongoose = require('mongoose');

const InventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['sale', 'cancellation_restock', 'manual_adjustment', 'initial_stock'],
    required: true
  },
  quantityChange: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  newQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  administrator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  administratorName: {
    type: String,
    default: 'System'
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

InventoryTransactionSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
