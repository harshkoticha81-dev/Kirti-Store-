const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentProof
} = require('../controllers/orderController');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

// Public order tracking route (with optional auth detection)
router.get('/track', optionalAuth, trackOrder);

// Customer order routes
router.post('/', optionalAuth, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', optionalAuth, getOrderById);
router.patch('/:id/payment-proof', protect, updatePaymentProof);

// Admin order routes
router.get('/admin/orders', protect, adminOnly, getAllOrders);
router.patch('/admin/orders/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
