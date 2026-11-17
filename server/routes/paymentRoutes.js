const express = require('express');
const router = express.Router();
const {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require('../controllers/paymentController');

// Razorpay endpoints
router.get('/razorpay/config', getRazorpayConfig);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

module.exports = router;
