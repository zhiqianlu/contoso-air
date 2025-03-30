import { useState, useEffect } from 'react';
import Select from 'react-select';
import RecommendationModal from './RecommendationModal';
import recommendationService from '../services/recommendationService';

// Helper function from recommendation service
const isRecommendationServiceReady = recommendationService.isReady.bind(recommendationService);

/**
 * Airport dropdown component for search form
 */
function AirportDropdown({ name, value, onChange, options }) {
  const [inputValue, setInputValue] = useState('');

  const loadOptions = (inputValue) => {
    if (!inputValue) return options.slice(0, 50);

    return options
      .filter((airport) => {
        if (!airport || !airport.label) return false;
        return airport.label.toLowerCase().includes(inputValue.toLowerCase()) ||
              (airport.value && airport.value.toLowerCase().includes(inputValue.toLowerCase()));
      })
      .slice(0, 50);
  };

  const getOptionValue = (value) => {
    if (!value) return null;
    const option = options.find((option) => option.value === value);
    return option || null;
  };

  return (
    <Select
      name={name}
      value={getOptionValue(value)}
      onChange={onChange}
      onInputChange={(value) => setInputValue(value)}
      options={loadOptions(inputValue)}
      isClearable
      placeholder="Select an airport"
      noOptionsMessage={() => "No airports found"}
    />
  );
}

/**
 * Reusable flight search form component
 */
function FlightSearchForm({ 
  formData, 
  setFormData, 
  airportOptions, 
  onSubmit,
  showInspireButton = true
}) {
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const [serviceReady, setServiceReady] = useState(false);

  // Check if recommendation service is ready (only if inspire button should be shown)
  useEffect(() => {
    if (!showInspireButton) return;

    const checkServiceReady = async () => {
      try {
        const isReady = await isRecommendationServiceReady();
        setServiceReady(isReady);
      } catch (err) {
        console.error('Error checking recommendation service readiness:', err);
        setServiceReady(false);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(checkServiceReady, 5000);
    checkServiceReady(); // Initial check

    return () => clearInterval(interval); // Cleanup on unmount
  }, [showInspireButton]);

  // Handle select change in the form
  const handleChange = (selectedOption, actionMeta) => {
    setFormData({ ...formData, [actionMeta.name]: selectedOption ? selectedOption.value : '' });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handlers for recommendation modal
  const handleInspireClick = () => {
    setIsRecommendationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRecommendationModalOpen(false);
  };

  return (
    <>
      <div className="intro">
        <h1>Search. Book. Fly.</h1>
        <p>Discover your next destination with ease—find flights, view schedules, and book online. ✈️</p>
      </div>
      <div className="form-container">
        <form onSubmit={handleSubmit} className="flight-form">
          <div className="form-row">
            <div className="airport-dropdown-container">
              <label htmlFor="departure">Departure Airport:</label>
              <AirportDropdown
                id="departure"
                name="departure"
                options={airportOptions}
                value={formData.departure}
                onChange={handleChange}
              />
            </div>
            <div className="airport-dropdown-container">
              <label htmlFor="arrival">Arrival Airport:</label>
              <AirportDropdown
                id="arrival"
                name="arrival"
                options={airportOptions}
                value={formData.arrival}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="departureDate">Departure Date:</label>
              <div>
                <input
                  type="date"
                  id="departureDate"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="returnDate">Return Date:</label>
              <div>
                <input
                  type="date"
                  id="returnDate"
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="form-row bottom-row">
            <div className="input-field">
              <label htmlFor="passengers">Number of Passengers:</label>
              <div>
                <input
                  type="number"
                  id="passengers"
                  name="passengers"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="input-field">
              <label htmlFor="travelClass">Class:</label>
              <div>
                <select
                  id="travelClass"
                  name="travelClass"
                  value={formData.travelClass}
                  onChange={(e) => setFormData({ ...formData, travelClass: e.target.value })}
                >
                  <option value="Economy">Economy</option>
                  <option value="Business">Business</option>
                  <option value="First">First</option>
                </select>
              </div>
            </div>
            <button type="submit" className="action-button">Search Flights</button>
            {showInspireButton && (
              <button 
                type="button" 
                className="inspire-button action-button"
                onClick={handleInspireClick}
                style={{
                  backgroundColor: serviceReady ? '#5b8a72' : '#d3d3d3',
                  color: serviceReady ? 'white' : '#808080',
                  cursor: serviceReady ? 'pointer' : 'not-allowed',
                  pointerEvents: serviceReady ? 'auto' : 'none'
                }}
              >
                ✨Inspire Me
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Recommendation Modal */}
      <RecommendationModal 
        isOpen={isRecommendationModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
}

export { FlightSearchForm, AirportDropdown };