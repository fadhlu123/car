require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const bookingRoutes = require('./routes/bookings');
const inquiryRoutes = require('./routes/inquiries');
const favoriteRoutes = require('./routes/favorites');

// Main async start function to ensure DB connects before routing starts
const startServer = async () => {
  // Connect Database (with automatic fallback to Mock DB)
  await connectDB();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/favorites', favoriteRoutes);

  // Root Endpoint
  app.get('/', (req, res) => {
    res.send('Smart Car Dealership API is running...');
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database Engine: ${global.USE_MOCK_DB ? 'JSON Fallback Mock' : 'MongoDB Mongoose'}`);
  });
};

startServer();
