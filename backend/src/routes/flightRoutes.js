import express from 'express';
import flightService from '../services/flightService.js';

const router = express.Router();

/**
 * @route   POST /api/flights/search
 * @desc    Search for flights based on criteria
 * @access  Public
 */
router.post('/search', (req, res) => {
  try {
    const searchCriteria = req.body;
    const flights = flightService.searchFlights(searchCriteria);
    res.json(flights);
  } catch (error) {
    console.error('Error searching flights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/flights/:id
 * @desc    Get flight by ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
  try {
    const flight = flightService.getFlightById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.json(flight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;