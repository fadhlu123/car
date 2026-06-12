const mongoose = require('mongoose');
const createModelProxy = require('../utils/modelProxy');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now }
});

let MongooseUser;
try {
  MongooseUser = mongoose.model('User');
} catch (error) {
  MongooseUser = mongoose.model('User', UserSchema);
}

module.exports = createModelProxy('User', MongooseUser);
