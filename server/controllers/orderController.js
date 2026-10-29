const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const InventoryTransaction = require('../models/InventoryTransaction');
const { calculateCartTransportation } = require('../utils/shippingCalculator');
const whatsappService = require('../services/whatsappService');
const pushNotificationService = require('../services/pushNotificationService');
const { calculateRtoRisk } = require('../services/rtoService');

// Helper to extract 10-digit mobile number
const get10Digits = (val) => String(val || '').replace(/\D/g, '').slice(-10);

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentMethod = 'UPI',
      notes = '',
      customerName,
      customerEmail,
      customerPhone,
      upiTransactionId = '',
      paymentScreenshot = ''
    } = req.body;

    const postalCode = (shippingAddress?.postalCode || shippingAddress?.pincode || '').trim();
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address (street, city, state, postal code) is required.'
      });
    }
    shippingAddress.postalCode = postalCode;

    // Retrieve user's cart or items
    let cart = null;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      if (cart && cart.items) {
        const originalCount = cart.items.length;
        cart.items = cart.items.filter((item) => item.product && item.product.status === 'active');
        if (cart.items.length !== originalCount) {
          await cart.save().catch(() => {});
        }
      }
    }

    const sourceItems = (cart && cart.items && cart.items.length > 0) ? cart.items : (req.body.items || []);

    if (!sourceItems || sourceItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Cannot place an order.'
      });
    }

    // Recheck stock & calculate authoritative prices directly from MongoDB
    const orderItems = [];
    let subtotal = 0;

    for (const item of sourceItems) {
      const product = await Product.findById(item.product?._id || item.product || item._id);

      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || 'Item'}" is no longer available.`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`
        });
      }

      const lineTotal = product.sellingPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        SKU: product.SKU,
        image: product.images?.[0] || '',
        price: product.sellingPrice,
        quantity: item.quantity,
        lineTotal
      });
    }

    // Dynamic appliance package transportation charge
    // Big size appliance: standard ₹120 (within ₹100 to ₹150 rs range)
    // Small size appliance: standard ₹60 (within ₹50 to ₹120 rs range)
    const shippingFee = calculateCartTransportation(orderItems);
    const tax = Math.round(subtotal * 0.05); // 5% GST included in appliance price
    const totalAmount = subtotal + shippingFee;

    // Deduct stock and record inventory transaction logs
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      const prevQty = product.stockQuantity;
      const newQty = prevQty - item.quantity;

      product.stockQuantity = newQty;
      await product.save();

      await InventoryTransaction.create({
        product: product._id,
        productName: product.name,
        sku: product.SKU,
        transactionType: 'sale',
        quantityChange: -item.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: `Online order purchase (Qty: ${item.quantity})`,
        administrator: null,
        administratorName: 'Customer Checkout'
      });
    }

    // Determine initial payment status - 100% online UPI payments are completed
    const paymentStatus = 'Completed';

    // Resolve comprehensive customer details
    const resolvedCustomerName = (customerName && customerName.trim()) || req.user?.name || 'Valued Customer';
    const resolvedCustomerEmail = (customerEmail && customerEmail.trim()) || req.user?.email || '';
    const resolvedCustomerPhone = (customerPhone && customerPhone.trim()) || shippingAddress.phone || req.user?.phone || '';

    // Find or link real customer user
    let orderUserId = req.user ? req.user.id : null;
    if (!orderUserId && resolvedCustomerEmail) {
      let existingUser = await User.findOne({ email: resolvedCustomerEmail.toLowerCase() });
      if (!existingUser) {
        existingUser = await User.create({
          name: resolvedCustomerName,
          email: resolvedCustomerEmail.toLowerCase(),
          phone: resolvedCustomerPhone,
          role: 'customer'
        });
      }
      orderUserId = existingUser._id;
    }

    // Update user profile phone if missing
    if (req.user && resolvedCustomerPhone && (!req.user.phone || req.user.phone.trim() === '')) {
      await User.findByIdAndUpdate(req.user.id, { phone: resolvedCustomerPhone }).catch(() => {});
    }

    const trimmedUpiTxnId = (upiTransactionId && typeof upiTransactionId === 'string') ? upiTransactionId.trim() : '';
    const cleanScreenshot = (paymentScreenshot && typeof paymentScreenshot === 'string') ? paymentScreenshot.trim() : '';
    const upiRef = `UPI_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const finalPaymentId = trimmedUpiTxnId || upiRef;

    // Evaluate RTO (Return to Origin) Risk based on address, pincode, phone and payment proof
    let pastDelivered = 0;
    let pastCancelled = 0;
    if (orderUserId) {
      try {
        pastDelivered = await Order.countDocuments({ user: orderUserId, orderStatus: 'Delivered' });
        pastCancelled = await Order.countDocuments({ user: orderUserId, orderStatus: 'Cancelled' });
      } catch (_) {}
    }

    const calculatedRtoRisk = calculateRtoRisk({
      shippingAddress: {
        street: shippingAddress.street,
        apartment: shippingAddress.apartment || '',
        city: shippingAddress.city,
        state: shippingAddress.state || 'Maharashtra',
        postalCode: shippingAddress.postalCode
      },
      customerPhone: resolvedCustomerPhone,
      paymentMethod,
      upiTransactionId: trimmedUpiTxnId,
      paymentScreenshot: cleanScreenshot
    }, {
      hasPastDeliveredOrders: pastDelivered > 0,
      hasPastRtoOrders: pastCancelled > 0
    });

    // Create Order
    const order = await Order.create({
      user: orderUserId,
      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      customerPhone: resolvedCustomerPhone,
      items: orderItems,
      shippingAddress: {
        street: shippingAddress.street,
        apartment: shippingAddress.apartment || '',
        city: shippingAddress.city,
        state: shippingAddress.state || 'Maharashtra',
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
        phone: resolvedCustomerPhone
      },
      subtotal,
      shippingFee,
      transportationCharge: shippingFee,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus,
      paymentId: finalPaymentId,
      upiTransactionId: trimmedUpiTxnId,
      paymentScreenshot: cleanScreenshot,
      orderStatus: 'Confirmed',
      notes,
      rtoRisk: calculatedRtoRisk,
      statusTimeline: [
        {
          status: 'Confirmed',
          timestamp: new Date(),
          note: `Order confirmed via ${paymentMethod} (${finalPaymentId})${cleanScreenshot ? ' [Payment Proof Screenshot Attached]' : ''}`
        }
      ]
    });

    // Clear user's cart if exists
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private / Public (Owner, Admin, or verified order recipient)
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = {
        $or: [
          { orderNumber: new RegExp(`^${id}$`, 'i') },
          { trackingAwb: new RegExp(`^${id}$`, 'i') }
        ]
      };
    }

    const order = await Order.findOne(query).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If user is authenticated and not admin, verify ownership
    if (req.user && req.user.role !== 'admin') {
      const orderUserId = order.user ? (order.user._id || order.user).toString() : null;
      const userPhoneDigits = get10Digits(req.user.phone);
      const orderPhoneDigits = get10Digits(order.customerPhone || order.shippingAddress?.phone);
      const isEmailMatch = (order.customerEmail || '').toLowerCase() === (req.user.email || '').toLowerCase();
      const isPhoneMatch = Boolean(userPhoneDigits && orderPhoneDigits && userPhoneDigits === orderPhoneDigits);
      const isUserMatch = orderUserId && orderUserId === req.user.id;

      if (!isUserMatch && !isEmailMatch && !isPhoneMatch) {
        return res.status(403).json({
          success: false,
          mismatch: true,
          message: 'Access denied: This order belongs to another customer account.'
        });
      }
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track order publicly by Order ID and Phone / Email with real-time verification
// @route   GET /api/orders/track
// @access  Public (with optional auth detection)
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId, phone, email } = req.query;

    if (!orderId && !phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an Order ID / AWB Code or registered phone number.'
      });
    }

    const cleanId = (orderId || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Helper to get last 10 digits of mobile number
    const get10Digits = (val) => String(val || '').replace(/\D/g, '').slice(-10);

    let order = null;

    // 1. Direct MongoDB ID match
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(cleanId);
    }

    // 2. Match by unique orderNumber or trackingAwb
    if (!order && cleanId) {
      order = await Order.findOne({
        $or: [
          { orderNumber: new RegExp(`^${cleanId}$`, 'i') },
          { trackingAwb: new RegExp(`^${cleanId}$`, 'i') }
        ]
      });
    }

    // 3. Match by ID suffix or fallback search
    if (!order && cleanId) {
      const allRecent = await Order.find().sort({ createdAt: -1 }).limit(100);
      order = allRecent.find(o => 
        (o.orderNumber && o.orderNumber.toUpperCase().includes(cleanId.toUpperCase())) ||
        (o.trackingAwb && o.trackingAwb.toUpperCase().includes(cleanId.toUpperCase())) ||
        o._id.toString().toUpperCase().endsWith(cleanId.toUpperCase()) ||
        o._id.toString() === cleanId
      );
    }

    // 4. If no Order ID provided, lookup latest order by phone or email directly
    if (!order && !cleanId && (cleanPhone || cleanEmail)) {
      const q = {};
      if (cleanPhone) {
        const digits = get10Digits(cleanPhone);
        q.$or = [
          { customerPhone: new RegExp(digits, 'i') },
          { 'shippingAddress.phone': new RegExp(digits, 'i') }
        ];
      }
      if (cleanEmail) {
        q.customerEmail = new RegExp(`^${cleanEmail}$`, 'i');
      }
      order = await Order.findOne(q).sort({ createdAt: -1 });
    }

    // If order not found
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No shipment found matching the provided Order ID / Tracking Number. Please check and try again.'
      });
    }

    // 5. VALIDATION: Check User & Order ID Match
    const orderPhoneDigits = get10Digits(order.customerPhone || order.shippingAddress?.phone);
    const orderEmailLower = (order.customerEmail || '').toLowerCase();
    const orderUserId = order.user ? order.user.toString() : '';

    // Check Phone mismatch if phone provided
    if (cleanPhone) {
      const inputDigits = get10Digits(cleanPhone);
      if (inputDigits && orderPhoneDigits && inputDigits !== orderPhoneDigits) {
        return res.status(403).json({
          success: false,
          mismatch: true,
          message: 'Order ID and registered mobile number do not match. Please verify your details.'
        });
      }
    }

    // Check Email mismatch if email provided
    if (cleanEmail) {
      if (cleanEmail !== orderEmailLower) {
        return res.status(403).json({
          success: false,
          mismatch: true,
          message: 'Order ID and registered email address do not match. Please verify your details.'
        });
      }
    }

    // If user is logged in (and not admin), verify ownership
    if (req.user && req.user.role !== 'admin') {
      const userPhoneDigits = get10Digits(req.user.phone);
      const userEmailLower = (req.user.email || '').toLowerCase();
      const isUserMatch = (orderUserId && orderUserId === req.user.id) ||
                          (orderEmailLower && orderEmailLower === userEmailLower) ||
                          (orderPhoneDigits && userPhoneDigits && orderPhoneDigits === userPhoneDigits);

      if (!isUserMatch && !cleanPhone && !cleanEmail) {
        return res.status(403).json({
          success: false,
          mismatch: true,
          message: 'This order does not belong to your logged-in account. Please enter the registered phone number to verify access.'
        });
      }
    }

    const courierPartners = ['Blue Dart Express', 'Delhivery Surface', 'XpressBees Priority', 'DTDC Prime'];
    const hash = (order._id.toString().charCodeAt(0) + order._id.toString().charCodeAt(order._id.toString().length - 1)) % courierPartners.length;
    const courier = order.courier || courierPartners[hash];
    const trackingAwb = order.trackingAwb || `KRT${order._id.toString().substring(order._id.toString().length - 8).toUpperCase()}IN`;

    const estDelivery = order.estimatedDelivery || (() => {
      const d = new Date(order.createdAt);
      d.setDate(d.getDate() + 3);
      return d;
    })();

    const destCity = order.shippingAddress?.city || 'Customer Destination';
    const destStreet = order.shippingAddress?.street || 'Customer Address';

    const orderTime = new Date(order.createdAt);
    const checkpoints = [
      {
        id: 1,
        title: 'Order Verified & Approved',
        location: 'Kirti Appliances Digital Gateway',
        time: orderTime.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' • ' + orderTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        details: `Payment verified (${order.paymentMethod}). Warranty registration code generated.`
      },
      {
        id: 2,
        title: 'Appliance Packed & Quality Sealed',
        location: 'Kirti Store Headquarters & Logistics, Dhoraji',
        time: new Date(orderTime.getTime() + 4 * 3600000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' • ' + new Date(orderTime.getTime() + 4 * 3600000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: ['Processing', 'Shipped', 'Delivered'].includes(order.orderStatus) ? 'completed' : 'in-transit',
        details: 'Motor insulation testing complete. Shockproof protective packaging applied.'
      },
      {
        id: 3,
        title: 'Dispatched via Express Logistics',
        location: `Handed over to ${courier}`,
        time: new Date(orderTime.getTime() + 14 * 3600000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' • ' + new Date(orderTime.getTime() + 14 * 3600000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: ['Shipped', 'Delivered'].includes(order.orderStatus) ? 'completed' : 'pending',
        details: `Courier Consignment AWB: ${trackingAwb}. Express transit initiated.`
      },
      {
        id: 4,
        title: 'In Transit / Local Hub Arrival',
        location: `${destCity} Distribution Center`,
        time: new Date(orderTime.getTime() + 28 * 3600000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' • ' + new Date(orderTime.getTime() + 28 * 3600000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: order.orderStatus === 'Delivered' ? 'completed' : order.orderStatus === 'Shipped' ? 'in-transit' : 'pending',
        details: 'Consignment sorted and prepared for final delivery run.'
      },
      {
        id: 5,
        title: 'Delivered to Doorstep',
        location: `${destStreet}, ${destCity}`,
        time: order.orderStatus === 'Delivered' 
          ? new Date(orderTime.getTime() + 32 * 3600000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' • ' + new Date(orderTime.getTime() + 32 * 3600000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : `Estimated: ${estDelivery.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
        status: order.orderStatus === 'Delivered' ? 'completed' : 'pending',
        details: 'Package handed over and accepted at customer address.'
      }
    ];

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber || `KRT-ORD-${order._id.toString().slice(-8).toUpperCase()}`,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        tax: order.tax,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId,
        upiTransactionId: order.upiTransactionId || '',
        paymentScreenshot: order.paymentScreenshot || '',
        orderStatus: order.orderStatus,
        statusTimeline: order.statusTimeline,
        courier,
        trackingAwb,
        estimatedDelivery: estDelivery,
        checkpoints
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      search,
      rtoRisk,
      page = 1,
      limit = 15
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (rtoRisk && rtoRisk !== 'all') {
      if (rtoRisk === 'UNVERIFIED') {
        query['rtoRisk.addressVerified'] = { $ne: true };
        query['rtoRisk.riskLevel'] = { $in: ['HIGH', 'MEDIUM'] };
      } else if (rtoRisk === 'VERIFIED') {
        query['rtoRisk.addressVerified'] = true;
      } else {
        query['rtoRisk.riskLevel'] = rtoRisk.toUpperCase();
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { trackingAwb: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
        { 'shippingAddress.city': searchRegex },
        { 'shippingAddress.state': searchRegex },
        { 'shippingAddress.postalCode': searchRegex },
        { 'items.name': searchRegex },
        { 'items.SKU': searchRegex },
        { paymentMethod: searchRegex },
        { paymentId: searchRegex },
        { upiTransactionId: searchRegex },
        { _id: search.trim().match(/^[0-9a-fA-F]{24}$/) ? search.trim() : null }
      ].filter(cond => cond._id !== null || !cond.hasOwnProperty('_id'));
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Ensure all returned orders have rich rtoRisk populated
    const enhancedOrders = orders.map((ord) => {
      const ordObj = ord.toObject();
      if (!ordObj.rtoRisk || !ordObj.rtoRisk.riskLevel) {
        ordObj.rtoRisk = calculateRtoRisk(ordObj);
      }
      return ordObj;
    });

    // Compute live metrics for quick dashboard insight
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;
    const pendingOrdersCount = await Order.countDocuments({ orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] } });
    const deliveredOrdersCount = await Order.countDocuments({ orderStatus: 'Delivered' });

    let highRtoRiskCount = 0;
    let mediumRtoRiskCount = 0;
    let verifiedAddressCount = 0;
    try {
      highRtoRiskCount = await Order.countDocuments({
        'rtoRisk.riskLevel': 'HIGH',
        'rtoRisk.addressVerified': { $ne: true },
        orderStatus: { $nin: ['Cancelled', 'Delivered'] }
      });
      mediumRtoRiskCount = await Order.countDocuments({
        'rtoRisk.riskLevel': 'MEDIUM',
        'rtoRisk.addressVerified': { $ne: true },
        orderStatus: { $nin: ['Cancelled', 'Delivered'] }
      });
      verifiedAddressCount = await Order.countDocuments({
        'rtoRisk.addressVerified': true
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      count: enhancedOrders.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      metrics: {
        totalOrders: await Order.countDocuments(),
        totalRevenue,
        pendingOrders: pendingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        highRtoRiskOrders: highRtoRiskCount,
        mediumRtoRiskOrders: mediumRtoRiskCount,
        verifiedAddressOrders: verifiedAddressCount
      },
      orders: enhancedOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note = '', paymentStatus } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    const previousStatus = order.orderStatus;

    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already in "${status}" status.`
      });
    }

    // If order was not cancelled, but is now being cancelled -> Restock inventory safely!
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const prevStock = product.stockQuantity;
          const newStock = prevStock + item.quantity;
          product.stockQuantity = newStock;
          await product.save();

          await InventoryTransaction.create({
            product: product._id,
            productName: product.name,
            sku: product.SKU,
            transactionType: 'cancellation_restock',
            quantityChange: item.quantity,
            previousQuantity: prevStock,
            newQuantity: newStock,
            reason: `Order #${order._id.toString().substring(0, 8)} cancelled. Restocked ${item.quantity} units.`,
            administrator: req.user?._id || null,
            administratorName: req.user?.name || 'Admin',
            relatedOrder: order._id
          });
        }
      }
    }

    // Automatically set payment status to Completed upon Delivery if COD
    if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
      order.paymentStatus = 'Completed';
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (req.body.courier) order.courier = req.body.courier;
    if (req.body.trackingAwb) order.trackingAwb = req.body.trackingAwb;
    if (req.body.estimatedDelivery) order.estimatedDelivery = req.body.estimatedDelivery;
    if (req.body.deliveryDriver && typeof req.body.deliveryDriver === 'object') {
      order.deliveryDriver = { ...order.deliveryDriver, ...req.body.deliveryDriver };
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Order updated to ${status} by administrator`
    });

    await order.save();

    // Trigger automated WhatsApp alerts based on state progression
    if (status === 'Shipped') {
      whatsappService.sendOrderDispatched(order).catch(err => {
        console.warn('[WhatsApp] Dispatch alert warning:', err.message);
      });
      pushNotificationService.sendOrderDispatched(order).catch(err => {
        console.warn('[PushNotification] Dispatch alert warning:', err.message);
      });
    } else if (status === 'Out for Delivery') {
      pushNotificationService.sendOrderOutForDelivery(order).catch(err => {
        console.warn('[PushNotification] Out for delivery alert warning:', err.message);
      });
    } else if (status === 'Delivered') {
      whatsappService.sendOrderDelivered(order).catch(err => {
        console.warn('[WhatsApp] Delivery alert warning:', err.message);
      });
      pushNotificationService.sendOrderDelivered(order).catch(err => {
        console.warn('[PushNotification] Delivery alert warning:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order UPI payment proof (screenshot & transaction ID)
// @route   PATCH /api/orders/:id/payment-proof
// @access  Private (Owner or Admin)
exports.updatePaymentProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { upiTransactionId, paymentScreenshot } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Only owner or admin can update
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to update this order.'
      });
    }

    let updated = false;

    if (upiTransactionId !== undefined && typeof upiTransactionId === 'string' && upiTransactionId.trim() !== '') {
      order.upiTransactionId = upiTransactionId.trim();
      order.paymentId = upiTransactionId.trim();
      updated = true;
    }

    if (paymentScreenshot !== undefined && typeof paymentScreenshot === 'string' && paymentScreenshot.trim() !== '') {
      order.paymentScreenshot = paymentScreenshot.trim();
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a valid upiTransactionId or paymentScreenshot.'
      });
    }

    order.statusTimeline.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: `Payment proof submitted by customer.${order.upiTransactionId ? ` UTR/Txn ID: ${order.upiTransactionId}.` : ''}${order.paymentScreenshot ? ' Payment screenshot uploaded.' : ''}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully!',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order address as verified by Admin via WhatsApp/call
// @route   PATCH /api/admin/orders/:id/verify-address
// @access  Private/Admin
exports.verifyOrderAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationNotes = 'Address & landmark verified directly with customer on WhatsApp', addressVerified = true } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (!order.rtoRisk) {
      order.rtoRisk = calculateRtoRisk(order);
    }

    const isVerified = Boolean(addressVerified);
    order.rtoRisk.addressVerified = isVerified;

    if (isVerified) {
      order.rtoRisk.riskLevel = 'LOW';
      order.rtoRisk.riskScore = 5;
      order.rtoRisk.verifiedBy = req.user?.name || 'Dispatch Admin';
      order.rtoRisk.verifiedAt = new Date();
      order.rtoRisk.verificationNotes = verificationNotes;

      // Add audit checkpoint to statusTimeline
      order.statusTimeline.push({
        status: order.orderStatus,
        timestamp: new Date(),
        note: `Address & landmark verified with customer on WhatsApp by ${req.user?.name || 'Dispatch Admin'}`
      });
    } else {
      const recomputed = calculateRtoRisk(order);
      order.rtoRisk.riskLevel = recomputed.riskLevel;
      order.rtoRisk.riskScore = recomputed.riskScore;
      order.rtoRisk.flags = recomputed.flags;
      order.rtoRisk.verifiedBy = '';
      order.rtoRisk.verifiedAt = null;
      order.rtoRisk.verificationNotes = '';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: isVerified ? 'Address marked as verified. Safe for courier consignment dispatch.' : 'Address verification status reset.',
      order
    });
  } catch (error) {
    next(error);
  }
};

