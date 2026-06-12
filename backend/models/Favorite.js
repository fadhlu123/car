const mongoose = require('mongoose');
const createModelProxy = require('../utils/modelProxy');

const FavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  createdAt: { type: Date, default: Date.now }
});

let MongooseFavorite;
try {
  MongooseFavorite = mongoose.model('Favorite');
} catch (error) {
  MongooseFavorite = mongoose.model('Favorite', FavoriteSchema);
}

module.exports = createModelProxy('Favorite', MongooseFavorite);
