import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/contoso-air-logo.png';
import { getAirports } from './services/airportService';
import { getDestinations } from './services/destinationService';
import Select from 'react-select';
import RecommendationModal from './components/RecommendationModal';
import DestinationCard from './components/DestinationCard';
import recommendationService from './services/recommendationService';

// Replace the named import with a method call on the default export
const isRecommendationServiceReady = recommendationService.isReady.bind(recommendationService);

// Extracted Header component to be reusable across pages
export function Header() {
  return (
    <header className="header-bar">
      <div className="logo">
        <img src={logo} alt="Contoso Air Logo" />
      </div>
      <nav className="navigation">
        <a href="/" className="selected">Book</a>
        <a href="#">Routes</a>
      </nav>
    </header>
  );
}

function DestinationGrid() {
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const destinations = await getDestinations();
        // Filter destinations to only show featured ones
        const featured = destinations.filter(destination => destination.featured === true);
        setFeaturedDestinations(featured);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError('Failed to load destinations. Please try again later.');
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="loading-destinations">
        <p>Loading featured destinations...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="error-destinations">
        <p>{error}</p>
      </div>
    );
  }

  // If no featured destinations exist, display a message
  if (featuredDestinations.length === 0) {
    return (
      <div className="no-featured-destinations">
        <p>No featured destinations available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="destination-grid">
      {featuredDestinations.map((destination, index) => (
        <DestinationCard key={index} destination={destination} />
      ))}
    </div>
  );
}

function AirportDropdown({ name, value, onChange, options }) {
  const [inputValue, setInputValue] = useState('');

  const loadOptions = (inputValue) => {
    if (!inputValue) return options.slice(0, 50);

    return options
      .filter((airport) => {
        // Only include airports that have proper data
        if (!airport || !airport.label) return false;

        return airport.label.toLowerCase().includes(inputValue.toLowerCase()) ||
               (airport.value && airport.value.toLowerCase().includes(inputValue.toLowerCase()));
      })
      .slice(0, 50); // Limit the number of options to improve performance
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

function App() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekDate = nextWeek.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    departure: '',
    arrival: '',
    departureDate: today, // Preselect today's date
    returnDate: nextWeekDate, // Preselect next week's date
    passengers: 1,
    travelClass: 'Economy',
  });
  const [airports, setAirports] = useState([]);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const airportData = await getAirports();
        setAirports(Array.isArray(airportData) ? airportData : []);
      } catch (error) {
        console.error('Error fetching airports:', error);
        setAirports([]);
      }
    };

    fetchAirports();
  }, []);

  const airportOptions = airports.map((airport) => ({
    value: airport.code,
    label: `${airport.name} (${airport.code})`,
  }));

  const handleChange = (selectedOption, actionMeta) => {
    setFormData({ ...formData, [actionMeta.name]: selectedOption ? selectedOption.value : '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Searching flights with data:', formData);

    // Convert form data to URL search params for the results page
    const searchParams = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });

    // Navigate to search results page with search parameters
    navigate(`/search-results?${searchParams.toString()}`);
  };

  const handleInspireClick = () => {
    setIsRecommendationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRecommendationModalOpen(false);
  };

  // Add state to track service readiness
  const [serviceReady, setServiceReady] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <>
      <Header />
      <div className="App">
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
            </div>
          </form>
        </div>
        
        {/* Replace static RecommendationWidget with modal version */}
        <RecommendationModal 
          isOpen={isRecommendationModalOpen} 
          onClose={handleCloseModal} 
        />
        
        <DestinationGrid />
      </div>
    </>
  );
}

export default App;
