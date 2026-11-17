const Razorpay = require('razorpay');
const crypto = require('crypto');

// Helper to get initialized Razorpay instance or null if in demo mode
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === 'rzp_test_placeholder' || keySecret === 'rzp_test_secret_placeholder') {
    return null;
  }

  try {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (err) {
    console.warn('[Razorpay Init Warning]:', err.message);
    return null;
  }
};

// @desc    Get Razorpay public configuration / Key ID
// @route   GET /api/payment/razorpay/config
// @access  Public
exports.getRazorpayConfig = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const isConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder' &&
    process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_secret_placeholder'
  );

  res.status(200).json({
    success: true,
    keyId,
    isConfigured,
    currency: 'INR'
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/razorpay/create-order
// @access  Public
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, receipt, notes = {} } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid order amount is required.'
      });
    }

    const numericAmountInPaise = Math.round(Number(amount) * 100);
    const razorpay = getRazorpayInstance();

    // 1. Live/Test Razorpay API order creation if keys are configured
    if (razorpay) {
      const options = {
        amount: numericAmountInPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          store: 'Kirti Store Kitchen Appliances',
          ...notes
        }
      };

      const rzpOrder = await razorpay.orders.create(options);

      return res.status(200).json({
        success: true,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        isLiveMode: !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')
      });
    }

    // 2. Simulated/Sandbox Mode if keys are not yet configured in .env
    const mockOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    return res.status(200).json({
      success: true,
      orderId: mockOrderId,
      amount: numericAmountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isLiveMode: false,
      isSimulated: true
    });
  } catch (error) {
    console.error('[Razorpay Create Order Error]:', error);
    res.status(500).json({
      success: false,
      message: error.error?.description || error.message || 'Failed to initiate Razorpay order'
    });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payment/razorpay/verify
// @access  Public
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay order ID or payment ID.'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC-SHA256 signature when secret is configured
    if (keySecret && keySecret !== 'rzp_test_secret_placeholder') {
      if (!razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature is required for verification.'
        });
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Razorpay payment signature.'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Razorpay payment verified successfully.',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error) {
    console.error('[Razorpay Verify Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed.'
    });
  }
};
