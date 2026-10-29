const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/kirti-store');
  const orders = await mongoose.connection.collection('orders').find({}).toArray();
  for (const o of orders) {
    if (!o.orderNumber) {
      const timePart = new Date(o.createdAt || Date.now()).getTime().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const num = `KRT-ORD-${timePart}-${randomSuffix}`;
      await mongoose.connection.collection('orders').updateOne(
        { _id: o._id },
        { $set: { orderNumber: num } }
      );
      console.log(`Updated order ${o._id} -> ${num}`);
    } else {
      console.log(`Order ${o._id} already has orderNumber: ${o.orderNumber}`);
    }
  }
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

