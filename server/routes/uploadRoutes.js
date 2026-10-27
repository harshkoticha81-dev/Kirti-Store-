const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

// Upload product image (Admin only)
router.post('/', protect, adminOnly, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file.'
      });
    }

    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded.'
      });
    }

    const imageUrl = `/uploads/${file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      url: imageUrl,
      filename: file.filename
    });
  });
});

// Upload UPI Payment Screenshot / Receipt (Multipart form-data)
router.post('/receipt', optionalAuth, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading payment screenshot.'
      });
    }

    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No payment screenshot file uploaded.'
      });
    }

    const imageUrl = `/uploads/${file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Payment screenshot uploaded successfully.',
      url: imageUrl,
      filename: file.filename
    });
  });
});

// Upload UPI Payment Screenshot / Receipt (Base64 clipboard paste / fallback)
router.post('/receipt-base64', optionalAuth, (req, res, next) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing base64 image data.'
      });
    }

    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Must be base64 data URI.'
      });
    }

    const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot size exceeds 5MB limit.'
      });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `kirti-payment-receipt-${uniqueSuffix}.${ext}`;
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/${filename}`;
    res.status(200).json({
      success: true,
      message: 'Payment screenshot stored successfully.',
      url: imageUrl,
      filename
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

