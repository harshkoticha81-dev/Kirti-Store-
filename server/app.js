const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const pincodeRoutes = require('./routes/pincodeRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows client to load images
}));

// CORS Configuration
const clientUrl = (process.env.CLIENT_URL || '').replace(/\/+$/, '');
const allowedOrigins = [
  clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'ionic://localhost'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      allowedOrigins.includes(origin.replace(/\/+$/, '')) ||
      /\.vercel\.app$/.test(new URL(origin).hostname) ||
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// Logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Persistent Static Uploads Handler (checks local disk, falls back to MongoDB Atlas, and provides guaranteed fallback)
app.get('/uploads/:filename', async (req, res, next) => {
  const filename = req.params.filename;
  const localPath = path.join(__dirname, 'public/uploads', filename);

  // 1. If exists on local disk, serve directly
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // 2. If missing from disk (e.g. Render free tier restarted), retrieve from MongoDB Atlas
  try {
    const UploadedFile = require('./models/UploadedFile');
    const file = await UploadedFile.findOne({ filename });
    if (file && file.data) {
      // Re-populate disk cache so subsequent requests are lightning fast
      try {
        const uploadDir = path.join(__dirname, 'public/uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(localPath, file.data);
      } catch (cacheErr) {}

      res.set('Content-Type', file.contentType || 'image/webp');
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(file.data);
    }
  } catch (dbErr) {
    console.error('[Upload Fetch Error from MongoDB]:', dbErr.message);
  }

  // 3. Guaranteed Safe Fallback: NEVER show broken image or 404
  res.redirect('https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80');
});

// Fallback static middleware
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Kirti Store API Backend',
    status: 'online',
    health: '/api/health',
    storefront: process.env.CLIENT_URL || 'http://localhost:5173'
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kirti Store API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pincode', pincodeRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
