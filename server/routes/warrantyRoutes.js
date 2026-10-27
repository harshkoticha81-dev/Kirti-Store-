const express = require('express');
const router = express.Router();
const {
  registerWarranty,
  verifyWarranty,
  getMyWarranties,
  getWarrantyById
} = require('../controllers/warrantyController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public & Optional Auth Routes
router.post('/register', optionalAuth, registerWarranty);
router.get('/verify/:query', verifyWarranty);
router.get('/my-warranties', protect, getMyWarranties);
router.get('/:id', getWarrantyById);

module.exports = router;
