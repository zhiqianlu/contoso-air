import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read flights data from json file
const flightsFile = path.join(__dirname, '../data/flights.json');
const flightData = JSON.parse(fs.readFileSync(flightsFile, 'utf8'));

/**
 * Search for flights based on search criteria
 * @param {Object} searchCriteria - Search parameters
 * @param {string} searchCriteria.departure - Departure airport code
 * @param {string} searchCriteria.arrival - Arrival airport code
 * @param {string} searchCriteria.departureDate - Departure date
 * @param {string} searchCriteria.returnDate - Return date (for round trip)
 * @param {number} searchCriteria.passengers - Number of passengers
 * @param {string} searchCriteria.travelClass - Travel class (Economy, Business, First)
 * @returns {Array} - Filtered flight results
 */
export function searchFlights(searchCriteria) {
  // For demo purposes, we'll replace the placeholder codes with actual search criteria
  const flights = flightData.map(flight => {
    // Create a deep copy to avoid modifying the original data
    const flightCopy = JSON.parse(JSON.stringify(flight));

    // Replace placeholder codes with actual codes from search criteria
    flightCopy.fromCode = searchCriteria.departure;
    flightCopy.toCode = searchCriteria.arrival;

    // Update the segments as well
    flightCopy.segments.forEach(segment => {
      segment.fromCode = searchCriteria.departure;
      segment.toCode = searchCriteria.arrival;
    });

    return flightCopy;
  });

  return flights;
}

/**
 * Get flight details by ID
 * @param {string} id - Flight ID
 * @returns {Object|null} - Flight details or null if not found
 */
export function getFlightById(id) {
  return flightData.find(flight => flight.id === id) || null;
}

export default {
  searchFlights,
  getFlightById
};