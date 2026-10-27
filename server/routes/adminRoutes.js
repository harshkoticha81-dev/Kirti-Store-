const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardSalesChart,
  getTopProducts,
  getCustomers,
  getCustomerById,
  getInventoryTransactions
} = require('../controllers/adminController');
const { getAllOrders, updateOrderStatus, verifyOrderAddress } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

// Dashboard Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/sales', getDashboardSalesChart);
router.get('/dashboard/top-products', getTopProducts);

// Customer Management
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);

// Order Management
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/verify-address', verifyOrderAddress);

// Inventory & Audit Logs
router.get('/inventory/transactions', getInventoryTransactions);

module.exports = router;
