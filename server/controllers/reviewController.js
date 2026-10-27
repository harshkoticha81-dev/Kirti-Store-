const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product review
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment, title } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating (1-5) and review comment are required.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product.'
      });
    }

    // Check if verified purchase
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
      orderStatus: { $in: ['Delivered', 'Confirmed', 'Processing', 'Shipped'] }
    });

    const review = await Review.create({
      user: req.user.id,
      userName: req.user.name,
      product: productId,
      rating: Number(rating),
      title: title || '',
      comment: comment.trim(),
      verifiedPurchase: Boolean(hasPurchased)
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been posted.',
      review
    });
  } catch (error) {
    next(error);
  }
};
