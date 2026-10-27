require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server and connect to MongoDB
const startServer = async () => {
  // Listen on PORT immediately so Render/Cloud platforms detect the open port and pass health checks
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 KIRTI STORE SERVER RUNNING IN ${process.env.NODE_ENV || 'development'} MODE`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Attempt database connection without crashing the HTTP server if URI is pending
  try {
    await connectDB();
  } catch (dbError) {
    console.warn(`⚠️ [MongoDB Waiting]: Could not establish initial DB connection (${dbError.message}).`);
    console.warn(`👉 Please set your MONGODB_URI in your host dashboard (e.g. Render -> Settings -> Environment Variables).`);
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
  });
};

startServer();
