import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/contoso-air-logo.png';
import { getAirports } from './services/airportService';
import { getDestinations } from './services/destinationService';
import { FlightSearchForm } from './components/FlightSearchForm';
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

  const handleSubmit = (formData) => {
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

  return (
    <>
      <Header />
      <div className="App">
        <FlightSearchForm
          formData={formData}
          setFormData={setFormData}
          airportOptions={airportOptions}
          onSubmit={handleSubmit}
        />
        
        <DestinationGrid />
      </div>
    </>
  );
}

export default App;
