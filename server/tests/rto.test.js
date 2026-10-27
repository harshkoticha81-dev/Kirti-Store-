const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { calculateRtoRisk, REMOTE_TRANSIT_PINCODES } = require('../services/rtoService');
const Order = require('../models/Order');
const Product = require('../models/Product');

let adminToken;
let customerToken;
let testOrderId;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirti-store';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

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
});

afterAll(async () => {
  if (testOrderId) {
    await Order.findByIdAndDelete(testOrderId);
  }
  await mongoose.connection.close();
});

describe('RTO (Return to Origin) Risk Detection Engine', () => {

  test('1. Flags incomplete address without house number on COD as HIGH risk', () => {
    const risk = calculateRtoRisk({
      shippingAddress: {
        street: 'MG Road Near Market',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        pincode: '221001',
        phone: '9876543210'
      },
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      totalAmount: 4500
    });

    expect(risk.riskLevel).toBe('HIGH');
    expect(risk.riskScore).toBeGreaterThanOrEqual(60);
    expect(risk.flags.some(f => f.code === 'MISSING_HOUSE_NUMBER')).toBe(true);
    expect(risk.flags.some(f => f.code === 'COD_HIGH_REFUSAL_RISK')).toBe(true);
  });

  test('2. Identifies remote transit PIN code in North-East / Islands', () => {
    const risk = calculateRtoRisk({
      shippingAddress: {
        street: 'House #402, Hill Top Colony, Itanagar',
        landmark: 'Opposite State Museum',
        city: 'Itanagar',
        state: 'Arunachal Pradesh',
        pincode: '791111',
        phone: '9876543210'
      },
      paymentMethod: 'UPI',
      paymentStatus: 'Completed',
      upiTransactionId: '123456789012'
    });

    expect(risk.flags.some(f => f.code === 'REMOTE_TRANSIT_PINCODE')).toBe(true);
    expect(risk.addressVerified).toBe(false);
  });

  test('3. Evaluates well-formed address with landmark & advance UPI as LOW risk', () => {
    const risk = calculateRtoRisk({
      shippingAddress: {
        street: 'Flat 304, Palm Heights, Sector 15, Vashi',
        landmark: 'Near Inorbit Mall',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pincode: '400703',
        phone: '9820012345'
      },
      paymentMethod: 'UPI',
      paymentStatus: 'Completed',
      upiTransactionId: 'UPI-UTR-998877665544'
    });

    expect(risk.riskLevel).toBe('LOW');
    expect(risk.riskScore).toBeLessThan(35);
    expect(risk.flags.some(f => f.code === 'METRO_DELIVERY_HUB')).toBe(true);
  });

  test('4. End-to-end: Create order with vague address and verify automated RTO assignment', async () => {
    let testProduct = await Product.findOne({ status: 'active', stockQuantity: { $gte: 5 } });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Kirti ProMix RTO Appliance',
        slug: 'kirti-promix-rto-appliance',
        SKU: 'RTO-APPLIANCE-01',
        brand: 'Kirti Pro',
        categoryName: 'Kitchen Appliances',
        sellingPrice: 1999,
        mrp: 2999,
        stockQuantity: 20,
        status: 'active'
      });
    }

    // Add item to customer cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProduct._id,
        quantity: 1
      });

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerName: 'Vague Address Test User',
        customerEmail: 'vague@test.com',
        customerPhone: '9123456789',
        shippingAddress: {
          street: 'Gandhi Chowk', // Missing house # & critically short (< 15 chars)
          city: 'Patna',
          state: 'Bihar',
          postalCode: '800001',
          phone: '9123456789'
        },
        paymentMethod: 'COD'
      });

    expect(orderRes.statusCode).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.order.rtoRisk).toBeDefined();
    expect(orderRes.body.order.rtoRisk.riskLevel).toBe('HIGH');
    testOrderId = orderRes.body.order._id;
  });

  test('5. Admin updates address verification status on WhatsApp confirmation', async () => {
    expect(testOrderId).toBeDefined();

    const verifyRes = await request(app)
      .patch(`/api/admin/orders/${testOrderId}/verify-address`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        addressVerified: true,
        verificationNotes: 'Customer confirmed House #14, 2nd Floor on WhatsApp call'
      });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.order.rtoRisk.addressVerified).toBe(true);
    expect(verifyRes.body.order.rtoRisk.riskLevel).toBe('LOW');
    expect(verifyRes.body.order.rtoRisk.riskScore).toBe(5);

    // Verify timeline audit entry
    const lastTimeline = verifyRes.body.order.statusTimeline.slice(-1)[0];
    expect(lastTimeline.note).toContain('WhatsApp');
  });

  test('6. Admin filters orders by rtoRisk in GET /api/admin/orders', async () => {
    const filterRes = await request(app)
      .get('/api/admin/orders?rtoRisk=VERIFIED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(filterRes.statusCode).toBe(200);
    expect(filterRes.body.success).toBe(true);
    expect(filterRes.body.orders.some(o => o._id === testOrderId.toString())).toBe(true);
    expect(filterRes.body.metrics.verifiedAddressOrders).toBeGreaterThanOrEqual(1);
  });
});
