const express = require('express');
const router = express.Router();
const {
  getStores,
  getStoreById,
  bookAppointment
} = require('../controllers/storeController');

// Public endpoints
router.get('/', getStores);
router.get('/:id', getStoreById);
router.post('/appointment', bookAppointment);

module.exports = router;

