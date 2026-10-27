require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 KIRTI STORE SERVER RUNNING IN ${process.env.NODE_ENV || 'development'} MODE`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection]: ${err.message}`);
    });
  } catch (error) {
    console.error(`[Fatal Server Start Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
