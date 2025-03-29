import express from 'express';
import airportService from '../services/airportService.js';

const router = express.Router();

/**
 * @route   GET /api/airports
 * @desc    Get all airports
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const airports = airportService.getAirports();
    res.json(airports);
  } catch (error) {
    console.error('Error fetching airports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;