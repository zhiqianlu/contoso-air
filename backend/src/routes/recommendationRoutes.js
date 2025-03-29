import express from 'express';
import recommendationService from '../services/recommendationService.js';

const router = express.Router();

/**
 * @route   POST /api/recommendations/recommend
 * @desc    Get a recommendation based on user input
 * @access  Public
 */
router.post('/recommend', async (req, res) => {
  try {
    const { userInput } = req.body;
    
    if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
      return res.status(400).json({ error: 'User input is required' });
    }
    
    const recommendation = await recommendationService.getRecommendation(userInput);
    res.status(200).json(recommendation);
  } catch (error) {
    console.error('Error getting recommendation:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendation',
      message: error.message 
    });
  }
});

// Endpoint to check if the API is ready to talk to Azure OpenAI
router.get('/ready', (req, res) => {
  const isReady = recommendationService.isReady();
  res.json({ ready: isReady });
});

export default router;