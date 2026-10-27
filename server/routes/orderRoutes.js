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
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public order tracking route
router.get('/track', trackOrder);

// Customer order routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/payment-proof', protect, updatePaymentProof);

// Admin order routes
router.get('/admin/orders', protect, adminOnly, getAllOrders);
router.patch('/admin/orders/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
