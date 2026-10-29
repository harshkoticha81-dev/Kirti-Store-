const mongoose = require('mongoose');
const Order = require('../models/Order');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/kirti-store');
  console.log('Connected to DB');

  const orders = await Order.find({}).limit(2);
  if (orders.length === 0) {
    console.log('No orders to test with.');
    await mongoose.disconnect();
    return;
  }

  const testOrder = orders[0];
  console.log('Test Order Details:');
  console.log('  ID:', testOrder._id.toString());
  console.log('  OrderNumber:', testOrder.orderNumber);
  console.log('  Customer:', testOrder.customerName);
  console.log('  Phone:', testOrder.customerPhone || testOrder.shippingAddress?.phone);

  const testPhone = testOrder.customerPhone || testOrder.shippingAddress?.phone || '9876543210';
  const wrongPhone = '9111111111';

  // Test helper function matching orderController logic
  const get10Digits = (val) => String(val || '').replace(/\D/g, '').slice(-10);

  function verify(order, inputPhone) {
    const orderPhoneDigits = get10Digits(order.customerPhone || order.shippingAddress?.phone);
    if (inputPhone) {
      const inputDigits = get10Digits(inputPhone);
      if (inputDigits && orderPhoneDigits && inputDigits !== orderPhoneDigits) {
        return { success: false, mismatch: true, message: 'Order ID and registered mobile number do not match.' };
      }
    }
    return { success: true, orderNumber: order.orderNumber };
  }

  console.log('\nCase 1: Correct Phone');
  const res1 = verify(testOrder, testPhone);
  console.log('Result:', res1);

  console.log('\nCase 2: Mismatched Phone');
  const res2 = verify(testOrder, wrongPhone);
  console.log('Result:', res2);

  // Test finding by orderNumber in DB
  const foundByNumber = await Order.findOne({ orderNumber: testOrder.orderNumber });
  console.log('\nCase 3: DB Query by orderNumber:', foundByNumber ? `Found (${foundByNumber._id})` : 'FAILED');

  await mongoose.disconnect();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});

