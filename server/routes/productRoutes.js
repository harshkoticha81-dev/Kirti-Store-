const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductPrice,
  updateProductStock,
  deleteProduct,
  getSpareModels,
  getCompatibleSpares
} = require('../controllers/productController');
const { getProductReviews, createReview } = require('../controllers/reviewController');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

// Public product routes
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/spares/models', getSpareModels);
router.get('/:id/compatible-spares', getCompatibleSpares);
router.get('/:id', getProductById);

// Reviews sub-route
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, createReview);

// Admin product routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.patch('/:id/price', protect, adminOnly, updateProductPrice);
router.patch('/:id/stock', protect, adminOnly, updateProductStock);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
