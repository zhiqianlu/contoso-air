import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { searchFlights } from '../services/flightService';
import { getAirports } from '../services/airportService';
import { Header } from '../App';
import FlightCard from './FlightCard';
import { FlightSearchForm } from './FlightSearchForm';

function SearchResults() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airports, setAirports] = useState({});
  const [airportOptions, setAirportOptions] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Extract search criteria from URL
  const [formData, setFormData] = useState({
    departure: searchParams.get('departure'),
    arrival: searchParams.get('arrival'),
    departureDate: searchParams.get('departureDate'),
    returnDate: searchParams.get('returnDate'),
    passengers: parseInt(searchParams.get('passengers'), 10) || 1,
    travelClass: searchParams.get('travelClass') || 'Economy',
  });

  useEffect(() => {
    const fetchAirportsAndFlights = async () => {
      try {
        const airportList = await getAirports();
        const airportMap = {};
        (Array.isArray(airportList) ? airportList : []).forEach((airport) => {
          airportMap[airport.code] = airport.name;
        });
        setAirports(airportMap);

        // Create options for the airport dropdowns
        const options = airportList.map((airport) => ({
          value: airport.code,
          label: `${airport.name} (${airport.code})`,
        }));
        setAirportOptions(options);

        // Search for flights based on criteria
        if (formData.departure && formData.arrival) {
          const results = await searchFlights(formData);
          setFlights(results);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAirportsAndFlights();
  }, [formData.departure, formData.arrival, formData.departureDate]);

  // Format the date for display
  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get airport name from code
  const getAirportName = (code) => {
    return airports[code] ? `${airports[code]} (${code})` : code;
  };

  // Handle search form submission
  const handleSubmit = (formData) => {
    // Convert form data to URL search params for the results page
    const newSearchParams = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        newSearchParams.append(key, value);
      }
    });

    // Navigate to search results page with search parameters
    navigate(`/search-results?${newSearchParams.toString()}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading">Loading flights...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="App">
        {/* Use the reusable flight search form component */}
        <FlightSearchForm
          formData={formData}
          setFormData={setFormData}
          airportOptions={airportOptions}
          onSubmit={handleSubmit}
        />

        {/* Search Results */}
        <div className="search-results-container">
          <div className="search-summary">
            <h2>Flight Search Results</h2>
            <p>
              From: {getAirportName(formData.departure)} |
              To: {getAirportName(formData.arrival)} |
              Date: {formData.departureDate} |
              Passengers: {formData.passengers} |
              Class: {formData.travelClass}
            </p>
            <Link to="/" className="back-button">Back to Homepage</Link>
          </div>

          {flights.length === 0 ? (
            <div className="no-flights-found">
              <h3>No flights found</h3>
              <p>
                Try adjusting your search criteria or try different dates.
              </p>
            </div>
          ) : (
            <div className="flight-results">
              {flights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} formatDate={formatDate} getAirportName={getAirportName} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SearchResults;