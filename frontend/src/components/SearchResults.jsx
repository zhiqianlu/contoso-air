import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { searchFlights } from '../services/flightService';
import { getAirports } from '../services/airportService';
import { Header } from '../App';
import FlightCard from './FlightCard';

function SearchResults() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airports, setAirports] = useState({});
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Extract search criteria from URL
  const searchCriteria = {
    departure: searchParams.get('departure'),
    arrival: searchParams.get('arrival'),
    departureDate: searchParams.get('departureDate'),
    returnDate: searchParams.get('returnDate'),
    passengers: parseInt(searchParams.get('passengers'), 10) || 1,
    travelClass: searchParams.get('travelClass') || 'Economy',
  };

  useEffect(() => {
    const fetchAirportsAndFlights = async () => {
      try {
        const airportList = await getAirports();
        const airportMap = {};
        (Array.isArray(airportList) ? airportList : []).forEach((airport) => {
          airportMap[airport.code] = airport.name;
        });
        setAirports(airportMap);

        // Search for flights based on criteria
        if (searchCriteria.departure && searchCriteria.arrival) {
          const results = await searchFlights(searchCriteria);
          setFlights(results);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAirportsAndFlights();
  }, [searchCriteria.departure, searchCriteria.arrival, searchCriteria.departureDate]);

  // Format the date for display
  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get airport name from code
  const getAirportName = (code) => {
    return airports[code] ? `${airports[code]} (${code})` : code;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading">Loading flights...</div>
      </>
    );
  }

  if (flights.length === 0) {
    return (
      <>
        <Header />
        <div className="search-results-container">
          <div className="search-summary">
            <h2>No flights found</h2>
            <p>
              Try adjusting your search criteria or try different dates.
            </p>
            <Link to="/" className="back-button">Back to Search</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="search-results-container">
        <div className="search-summary">
          <h2>Flight Search Results</h2>
          <p>
            From: {getAirportName(searchCriteria.departure)} |
            To: {getAirportName(searchCriteria.arrival)} |
            Date: {searchCriteria.departureDate} |
            Passengers: {searchCriteria.passengers} |
            Class: {searchCriteria.travelClass}
          </p>
          <Link to="/" className="back-button">Back to Search</Link>
        </div>

        <div className="flight-results">
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} formatDate={formatDate} getAirportName={getAirportName} />
          ))}
        </div>
      </div>
    </>
  );
}

export default SearchResults;