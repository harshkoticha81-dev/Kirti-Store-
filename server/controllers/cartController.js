const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { calculateCartTransportation, isBigAppliance } = require('../utils/shippingCalculator');

// Helper to compute cart totals with live authoritative product prices and availability
const formatCartResponse = async (cart) => {
  if (!cart) {
    return {
      items: [],
      subtotal: 0,
      shippingFee: 0,
      totalAmount: 0,
      itemCount: 0
    };
  }

  await cart.populate({
    path: 'items.product',
    select: 'name slug SKU sellingPrice originalPrice stockQuantity images status categoryName packageSize transportationCharge'
  });

  // Filter out any deleted products
  const validItems = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const item of cart.items) {
    if (item.product && item.product.status === 'active') {
      const lineTotal = item.product.sellingPrice * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;

      const isBig = isBigAppliance(item.product);

      validItems.push({
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          SKU: item.product.SKU,
          sellingPrice: item.product.sellingPrice,
          originalPrice: item.product.originalPrice,
          stockQuantity: item.product.stockQuantity,
          image: item.product.images?.[0] || '',
          categoryName: item.product.categoryName,
          packageSize: isBig ? 'big' : 'small',
          transportationCharge: isBig ? 120 : 60
        },
        quantity: item.quantity,
        lineTotal,
        inStock: item.product.stockQuantity >= item.quantity,
        maxAvailable: item.product.stockQuantity,
        packageSize: isBig ? 'big' : 'small',
        unitTransportationCharge: isBig ? 120 : 60
      });
    }
  }

  // Persist cleaned active items if any stale or deleted products were removed
  if (cart.items.length !== validItems.length) {
    cart.items = cart.items.filter((item) => item.product && item.product.status === 'active');
    await cart.save().catch(() => {});
  }

  // Dynamic transportation charge according to appliance package size
  // Big size appliance: standard ₹120 (within ₹100 to ₹150 rs range)
  // Small size appliance: standard ₹60 (within ₹50 to ₹120 rs range)
  const shippingFee = subtotal === 0 ? 0 : calculateCartTransportation(validItems);
  const totalAmount = subtotal + shippingFee;

  return {
    _id: cart._id,
    items: validItems,
    subtotal,
    shippingFee,
    transportationCharge: shippingFee,
    totalAmount,
    itemCount
  };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const formattedCart = await formatCartResponse(cart);
    res.status(200).json({
      success: true,
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.'
      });
    }

    const qty = Math.max(1, parseInt(quantity, 10));

    // Verify product exists and check stock
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product is unavailable or out of stock.'
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    let newTotalQty = qty;
    if (existingItemIndex > -1) {
      newTotalQty = cart.items[existingItemIndex].quantity + qty;
    }

    if (newTotalQty > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot add more. Available stock for ${product.name} is ${product.stockQuantity}.`
      });
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = newTotalQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const formattedCart = await formatCartResponse(cart);

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to cart.`,
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PATCH /api/cart/items/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'A valid quantity number is required.'
      });
    }

    const qty = parseInt(quantity, 10);
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (qty <= 0) {
      // Remove item
      cart.items.pull(itemId);
    } else {
      // Validate with product stock
      const product = await Product.findById(item.product);
      if (!product) {
        cart.items.pull(itemId);
      } else if (qty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockQuantity} units available in stock.`
        });
      } else {
        item.quantity = qty;
      }
    }

    await cart.save();
    const formattedCart = await formatCartResponse(cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated.',
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items.pull(itemId);
    await cart.save();

    const formattedCart = await formatCartResponse(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      cart: formattedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully.',
      cart: {
        items: [],
        subtotal: 0,
        shippingFee: 0,
        totalAmount: 0,
        itemCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
};
