const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is down
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    logger.info('Retrying connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB();
  }
};

module.exports = connectDB;
