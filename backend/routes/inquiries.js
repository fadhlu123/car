const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @desc    Create new inquiry
// @route   POST /api/inquiries
// @access  Public
router.post('/', async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    res.status(201).json(inquiry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({});
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (inquiry) {
      res.json(inquiry);
    } else {
      res.status(404).json({ message: 'Inquiry not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
