const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_car_dealership';
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000 // Give up quickly if no MongoDB found
    });
    console.log(`[MongoDB] Connected Successfully to ${mongoURI}`);
    global.USE_MOCK_DB = false;
  } catch (error) {
    console.error(`[MongoDB] Connection Failed. Switching to JSON Fallback Engine.`);
    console.warn(`=> Reason: ${error.message}`);
    global.USE_MOCK_DB = true;
  }
};

module.exports = connectDB;
