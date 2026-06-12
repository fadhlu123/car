const mongoose = require('mongoose');
const createModelProxy = require('../utils/modelProxy');

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

let MongooseBooking;
try {
  MongooseBooking = mongoose.model('Booking');
} catch (error) {
  MongooseBooking = mongoose.model('Booking', BookingSchema);
}

module.exports = createModelProxy('Booking', MongooseBooking);
