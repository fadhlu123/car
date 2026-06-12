const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const { protect } = require('../middleware/authMiddleware');

// @desc    Toggle favorite status of a vehicle
// @route   POST /api/favorites/toggle
// @access  Private
router.post('/toggle', protect, async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const userId = req.user.id;

    // We can't do findOne({ userId, vehicleId }) easily with custom MockDb if we pass complex queries, 
    // but our MockDB handles basic equality.
    const existsArr = await Favorite.find({ userId, vehicleId });
    const exists = existsArr.length > 0 ? existsArr[0] : null;

    if (exists) {
      await Favorite.findByIdAndDelete(exists._id);
      res.json({ message: 'Removed from favorites', isFavorite: false });
    } else {
      const fav = await Favorite.create({ userId, vehicleId });
      res.json({ message: 'Added to favorites', isFavorite: true, favorite: fav });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
