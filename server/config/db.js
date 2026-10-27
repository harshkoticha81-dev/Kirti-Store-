const mongoose = require('mongoose');

const getCleanMongoUri = () => {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || '';
  uri = uri.trim();

  // Strip leading/trailing quotes (single, double, backticks)
  uri = uri.replace(/^["'`]+|["'`]+$/g, '').trim();

  // Strip "mongosh " if user copied the Atlas shell command instead of driver string
  if (uri.startsWith('mongosh ')) {
    uri = uri.replace(/^mongosh\s+/, '').replace(/^["'`]+|["'`]+$/g, '').trim();
  }

  // Prepend protocol if user omitted mongodb+srv://
  if (uri && !uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    uri = `mongodb+srv://${uri}`;
  }

  return uri || 'mongodb://127.0.0.1:27017/kirti-store';
};

const connectDB = async () => {
  const uri = getCleanMongoUri();
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.error(`[MongoDB Target Connection]: ${maskedUri}`);
    throw error;
  }
};

module.exports = connectDB;

