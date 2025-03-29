import express from 'express';
import destinationService from '../services/destinationService.js';

const router = express.Router();

/**
 * @route   GET /api/destinations
 * @desc    Get all destinations
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const destinations = destinationService.getDestinations();
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;