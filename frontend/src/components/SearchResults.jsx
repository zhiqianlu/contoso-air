import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { searchFlights } from '../services/flightService';
import { getAirports } from '../services/airportService';
import { Header } from '../App';
import FlightCard from './FlightCard';
import Select from 'react-select';

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

  // Airport dropdown component for search form
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

  // Handle select change in the form
  const handleChange = (selectedOption, actionMeta) => {
    setFormData({ ...formData, [actionMeta.name]: selectedOption ? selectedOption.value : '' });
  };

  // Handle search form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
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
        {/* Search Form - Same as homepage */}
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
            </div>
          </form>
        </div>

        {/* Search Results */}
        {!loading && (
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
        )}
      </div>
    </>
  );
}

export default SearchResults;