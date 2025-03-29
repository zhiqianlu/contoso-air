/**
 * Frontend service for getting travel recommendations
 * This service calls the backend API which handles the Azure OpenAI integration
 */
class RecommendationService {
  constructor() {
    // Backend API URL
    this.apiUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Get destination recommendations based on user input
   * @param {string} userInput - User's preferences or query
   * @returns {Promise<Object>} - Most relevant destination
   */
  async getRecommendation(userInput) {
    try {
      console.log(`Sending recommendation request to backend for: "${userInput.substring(0, 50)}..."`);
      
      const response = await fetch(`${this.apiUrl}/recommendations/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }

      const recommendation = await response.json();
      console.log('Received recommendation from backend:', recommendation.city);
      return recommendation;
    } catch (error) {
      console.error('Error getting recommendation from backend:', error);
      throw error;
    }
  }

  /**
   * Check if the recommendation service is ready
   * @returns {Promise<boolean>} - True if the service is ready, false otherwise
   */
  async isReady() {
    try {
      const response = await fetch(`${this.apiUrl}/recommendations/ready`);
      if (!response.ok) {
        return false;
      }
      const { ready } = await response.json();
      return ready;
    } catch (error) {
      console.error('Error checking recommendation service readiness:', error);
      return false;
    }
  }
}

// Create a singleton instance
const recommendationService = new RecommendationService();

export default recommendationService;