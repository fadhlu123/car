const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { brand, condition, minPrice, maxPrice, search } = req.query;
    let query = {};

    if (brand) query.brand = brand;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      // Mock DB handles regex search simply for 'brand' or 'model'
      // If we are on mock DB, we just pass regex to search field (it expects an object for regex)
      if (global.USE_MOCK_DB) {
         query.model = { $regex: search, $options: 'i' };
      } else {
         query.$or = [
           { brand: { $regex: search, $options: 'i' } },
           { model: { $regex: search, $options: 'i' } }
         ];
      }
    }

    // if it's mock db with $or, mockdb doesn't support $or, so let's just use $regex on model for simple mock search
    if (global.USE_MOCK_DB && query.$or) {
      delete query.$or;
      query.model = { $regex: search, $options: 'i' };
    }

    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a vehicle
// @route   POST /api/vehicles
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (vehicle) {
      res.json({ message: 'Vehicle removed' });
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
