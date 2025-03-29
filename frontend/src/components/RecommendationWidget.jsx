import { useState } from 'react';
import recommendationService from '../services/recommendationService';
import DestinationCard from './DestinationCard';

function RecommendationWidget({ onClose }) {
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userInput.trim()) {
      setError('Please enter your travel preferences');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const recommendedDestination = await recommendationService.getRecommendation(userInput);
      setRecommendation(recommendedDestination);
    } catch (err) {
      console.error('Error getting recommendation:', err);
      setError('Failed to get recommendation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    console.log('Booking selected destination:', recommendation);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="recommendation-widget">
      <h2>Find Your Perfect Destination</h2>
      <p>Tell us what you're looking for in your next trip, and we'll recommend the perfect destination.</p>

      <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="input-container">
          <textarea
            value={userInput}
            onChange={handleInputChange}
            placeholder="Example: 'I want a relaxing beach vacation with good food and cultural experiences' or 'Looking for adventure activities in a mountain setting'"
            rows={3}
            className="recommendation-input"
          />
        </div>

        <div className="button-container">
          <button type="submit" className="recommendation-button" disabled={loading}>
            {loading ? 'Finding destinations...' : '✨Inspire Me'}
          </button>
        </div>

        {error && (
          <div className="recommendation-error">
            {error}
          </div>
        )}
      </form>

      {recommendation && (
        <div className="recommendation-result">
          <div className="recommendation-layout" style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="destination-card-container" style={{ flex: '0 0 50%' }}>
              <DestinationCard destination={recommendation} />
            </div>

            <ul className="recommendation-details-list" style={{ flex: '1', marginLeft: '20px' }}>
              <li><strong>Activities:</strong> {recommendation.activities.join(', ')}</li>
              <li><strong>Travel Type:</strong> {recommendation.travelType.join(', ')}</li>
              <li><strong>Best Time to Visit:</strong> {recommendation.bestTimeToVisit}</li>
              <li><strong>Nearby Attractions:</strong> {recommendation.nearbyAttractions.join(', ')}</li>
              <li><strong>Accessibility:</strong> {recommendation.accessibility}</li>
            </ul>
          </div>
          <div className="recommendation-actions">
          </div>
          <button className="action-button" onClick={handleBookNow}>Book Now</button>
        </div>
      )}
    </div>
  );
}

export default RecommendationWidget;