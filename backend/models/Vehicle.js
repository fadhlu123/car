const mongoose = require('mongoose');
const createModelProxy = require('../utils/modelProxy');

const VehicleSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  mileage: { type: Number, required: true },
  fuelType: { type: String, required: true },
  transmission: { type: String, required: true },
  engineSize: { type: String },
  color: { type: String },
  condition: { type: String, enum: ['New', 'Used'], required: true },
  description: { type: String },
  availabilityStatus: { type: String, enum: ['Available', 'Sold'], default: 'Available' },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

let MongooseVehicle;
try {
  MongooseVehicle = mongoose.model('Vehicle');
} catch (error) {
  MongooseVehicle = mongoose.model('Vehicle', VehicleSchema);
}

module.exports = createModelProxy('Vehicle', MongooseVehicle);
