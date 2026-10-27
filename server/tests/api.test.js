const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');

let adminToken;
let customerToken;
let testProductId;
let testCategoryId;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirti-store';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Clear stale test carts
  await Cart.deleteMany({});

  // Get Admin token
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@kirtistore.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@KirtiStore2026'
    });
  adminToken = adminRes.body.token;

  // Get Customer token
  const customerRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'customer@kirtistore.com',
      password: 'Customer@2026'
    });
  customerToken = customerRes.body.token;

  let category = await Category.findOne();
  if (!category) {
    category = await Category.create({
      name: 'Mixers & Grinders',
      slug: 'mixers-grinders',
      description: 'Test category'
    });
  }
  testCategoryId = category._id;

  let product = await Product.findOne({ status: 'active', stockQuantity: { $gte: 5 } });
  if (!product) {
    product = await Product.create({
      name: 'Kirti ProMix Test Appliance 750W',
      slug: 'kirti-promix-test-appliance-750w',
      SKU: 'TEST-FIXTURE-SUITE',
      category: testCategoryId,
      categoryName: category.name,
      brand: 'Kirti Test',
      shortDescription: 'High-performance test appliance',
      description: 'High-performance 750W pure copper motor test appliance built for testing suite.',
      sellingPrice: 3499,
      originalPrice: 4999,
      stockQuantity: 40,
      lowStockThreshold: 5,
      images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'],
      status: 'active'
    });
  }
  testProductId = product._id;
});

afterAll(async () => {
  await Product.deleteMany({ SKU: 'TEST-FIXTURE-SUITE' });
  await Cart.deleteMany({});
  await mongoose.disconnect();
});

describe('1. Health Check Endpoint', () => {
  it('GET /api/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('2. Authentication & Authorization', () => {
  it('POST /api/auth/login succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@kirtistore.com',
        password: 'Customer@2026'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('customer@kirtistore.com');
  });

  it('POST /api/auth/login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@kirtistore.com',
        password: 'WrongPassword999'
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me returns current user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('customer@kirtistore.com');
  });

  it('Customer cannot access Admin endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('3. Product Management & Pricing & Inventory', () => {
  it('GET /api/products returns product list and categories', async () => {
    const res = await request(app).get('/api/products?limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.total).toBeDefined();
  });

  it('GET /api/products/:id returns single product with related products', async () => {
    const res = await request(app).get(`/api/products/${testProductId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.product._id).toBe(testProductId.toString());
  });

  it('PATCH /api/products/:id/price allows Admin to update price', async () => {
    const res = await request(app)
      .patch(`/api/products/${testProductId}/price`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sellingPrice: 3599,
        originalPrice: 4999
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.product.sellingPrice).toBe(3599);
  });

  it('PATCH /api/products/:id/price rejects negative prices', async () => {
    const res = await request(app)
      .patch(`/api/products/${testProductId}/price`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sellingPrice: -100
      });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/products/:id/stock allows Admin to adjust stock with audit reason', async () => {
    const res = await request(app)
      .patch(`/api/products/${testProductId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        adjustmentType: 'increase',
        quantity: 10,
        reason: 'Restocking fresh batch from warehouse'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.reason).toBe('Restocking fresh batch from warehouse');
  });
});

describe('4. Cart & Orders', () => {
  it('POST /api/cart/items adds an item to user cart', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        quantity: 1
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.cart.items.length).toBeGreaterThan(0);
  });

  it('POST /api/orders creates order with full customer and shipping details', async () => {
    // Ensure item is in cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        quantity: 1
      });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerName: 'Aarav Patel',
        customerEmail: 'aarav.patel@example.com',
        customerPhone: '+91 9876543210',
        shippingAddress: {
          street: '102 High Street, Bandra West',
          apartment: 'Building 4',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          country: 'India',
          phone: '+91 9876543210'
        },
        paymentMethod: 'UPI',
        notes: 'Pay via Phone Number collect'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.customerName).toBe('Aarav Patel');
    expect(res.body.order.customerEmail).toBe('aarav.patel@example.com');
    expect(res.body.order.paymentMethod).toBe('UPI');
    expect(res.body.order.shippingFee).toBeGreaterThanOrEqual(50);
    expect(res.body.order.shippingFee).toBeLessThanOrEqual(150);
    expect(res.body.order.transportationCharge).toBeDefined();
    expect(res.body.order.items.length).toBeGreaterThan(0);
  });

  it('GET /api/cart returns dynamic appliance transportation charge and packageSize', async () => {
    await Cart.deleteMany({});
    // Add item to cart first
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        quantity: 1
      });

    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cart.transportationCharge).toBeGreaterThanOrEqual(50);
    expect(res.body.cart.transportationCharge).toBeLessThanOrEqual(150);
    expect(res.body.cart.items.length).toBeGreaterThan(0);
    expect(['big', 'small']).toContain(res.body.cart.items[0].packageSize);
    expect(res.body.cart.items[0].unitTransportationCharge).toBeGreaterThanOrEqual(50);
  });

  it('POST /api/orders rejects invalid or removed card payment methods', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerName: 'Pooja Sharma',
        customerEmail: 'customer@kirtistore.com',
        shippingAddress: {
          street: 'Flat 402, Royal Palms',
          city: 'Mumbai',
          postalCode: '400013',
          country: 'India'
        },
        paymentMethod: 'Credit / Debit Card'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/admin/orders returns all orders with full customer details for Admin', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);

    const latestOrder = res.body.orders[0];
    expect(latestOrder.customerName).toBeDefined();
    expect(latestOrder.customerEmail).toBeDefined();
    expect(latestOrder.shippingAddress).toBeDefined();
    expect(latestOrder.items.length).toBeGreaterThan(0);
  });

  it('GET /api/orders/my-orders returns customer order history', async () => {
    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('POST /api/orders saves UPI transaction ID and payment screenshot proof', async () => {
    // Add item to cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProductId, quantity: 1 });

    const testTxnId = '410294829104';
    const testScreenshotUrl = '/uploads/test-payment-screenshot.png';

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerName: 'Pooja Sharma',
        customerEmail: 'customer@kirtistore.com',
        customerPhone: '+91 9812345678',
        shippingAddress: {
          street: 'Flat 402, Royal Palms, Senapati Bapat Marg',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400013',
          country: 'India'
        },
        paymentMethod: 'UPI',
        upiTransactionId: testTxnId,
        paymentScreenshot: testScreenshotUrl,
        notes: 'Paid via GPay QR Code'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.upiTransactionId).toBe(testTxnId);
    expect(res.body.order.paymentScreenshot).toBe(testScreenshotUrl);
    expect(res.body.order.paymentId).toBe(testTxnId);

    // Test PATCH /api/orders/:id/payment-proof
    const orderId = res.body.order._id;
    const patchRes = await request(app)
      .patch(`/api/orders/${orderId}/payment-proof`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        upiTransactionId: '519283746192',
        paymentScreenshot: '/uploads/updated-screenshot.png'
      });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.order.upiTransactionId).toBe('519283746192');
    expect(patchRes.body.order.paymentScreenshot).toBe('/uploads/updated-screenshot.png');
  });
});

describe('5. Image Upload Service & Payment Receipts', () => {
  it('POST /api/upload allows admin to upload appliance image from local storage', async () => {
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', pngBuffer, 'test-appliance.png');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toMatch(/^\/uploads\//);
  });

  it('POST /api/upload/receipt allows customer to upload payment screenshot', async () => {
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('screenshot', pngBuffer, 'upi-payment-screenshot.png');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toMatch(/^\/uploads\//);
    expect(res.body.message).toMatch(/Payment screenshot uploaded successfully/i);
  });

  it('POST /api/upload/receipt-base64 allows base64 receipt upload', async () => {
    const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/upload/receipt-base64')
      .send({ imageBase64: base64Data });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toMatch(/^\/uploads\/kirti-payment-receipt-/);
  });
});

describe('6. Indian Pincode Auto-Fetch Service', () => {
  it('GET /api/pincode/:pincode returns city and state for valid Mumbai PIN', async () => {
    const res = await request(app).get('/api/pincode/400013');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.city).toBe('Mumbai');
    expect(res.body.state).toBe('Maharashtra');
    expect(res.body.pincode).toBe('400013');
  });

  it('GET /api/pincode/:pincode returns city and state for New Delhi PIN', async () => {
    const res = await request(app).get('/api/pincode/110001');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.city).toBe('New Delhi');
    expect(res.body.state).toBe('Delhi');
  });

  it('GET /api/pincode/:pincode rejects invalid or non-6-digit PIN code', async () => {
    const res = await request(app).get('/api/pincode/4000');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

