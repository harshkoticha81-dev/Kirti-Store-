const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contentType: {
    type: String,
    default: 'image/webp'
  },
  data: {
    type: Buffer,
    required: true
  },
  size: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
