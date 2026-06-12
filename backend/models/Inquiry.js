const mongoose = require('mongoose');
const createModelProxy = require('../utils/modelProxy');

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  status: { type: String, enum: ['Unread', 'Read'], default: 'Unread' },
  createdAt: { type: Date, default: Date.now }
});

let MongooseInquiry;
try {
  MongooseInquiry = mongoose.model('Inquiry');
} catch (error) {
  MongooseInquiry = mongoose.model('Inquiry', InquirySchema);
}

module.exports = createModelProxy('Inquiry', MongooseInquiry);
