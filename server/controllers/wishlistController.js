const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'products',
      select: 'name slug SKU sellingPrice originalPrice stockQuantity images status rating numReviews categoryName'
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    res.status(200).json({
      success: true,
      wishlist: wishlist.products || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate({
      path: 'products',
      select: 'name slug SKU sellingPrice originalPrice stockQuantity images status rating numReviews categoryName'
    });

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to your wishlist.`,
      wishlist: wishlist.products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(200).json({ success: true, wishlist: [] });
    }

    wishlist.products = wishlist.products.filter(
      id => id.toString() !== productId
    );
    await wishlist.save();

    await wishlist.populate({
      path: 'products',
      select: 'name slug SKU sellingPrice originalPrice stockQuantity images status rating numReviews categoryName'
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
      wishlist: wishlist.products
    });
  } catch (error) {
    next(error);
  }
};
