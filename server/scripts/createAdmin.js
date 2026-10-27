require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirti-store';
    await mongoose.connect(mongoUri);
    console.log('[Connected to MongoDB for Admin Provisioning]');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kirtistore.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@KirtiStore2026';
    const adminName = process.env.ADMIN_NAME || 'Kirti Store Administrator';
    const adminPhone = process.env.ADMIN_PHONE || '+919876543210';

    let admin = await User.findOne({ email: adminEmail });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    if (admin) {
      admin.name = adminName;
      admin.phone = adminPhone;
      admin.passwordHash = passwordHash;
      admin.role = 'admin';
      admin.accountStatus = 'active';
      await admin.save();
      console.log(`[Success] Existing admin account "${adminEmail}" updated successfully.`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        passwordHash,
        role: 'admin',
        accountStatus: 'active'
      });
      console.log(`[Success] New admin account "${adminEmail}" provisioned successfully.`);
    }

    console.log('----------------------------------------------------');
    console.log('Admin Credentials:');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Role:     admin');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[Error Provisioning Admin]: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
