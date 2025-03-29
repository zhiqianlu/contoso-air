import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Search for flights based on search criteria
 * @param {Object} searchCriteria - Search parameters
 * @param {string} searchCriteria.departure - Departure airport code
 * @param {string} searchCriteria.arrival - Arrival airport code
 * @param {string} searchCriteria.departureDate - Departure date
 * @param {string} searchCriteria.returnDate - Return date (for round trip)
 * @param {number} searchCriteria.passengers - Number of passengers
 * @param {string} searchCriteria.travelClass - Travel class (Economy, Business, First)
 * @returns {Promise<Array>} - Filtered flight results
 */
export async function searchFlights(searchCriteria) {
  try {
    const response = await axios.post(`${API_URL}/flights/search`, searchCriteria);
    return response.data;
  } catch (error) {
    console.error('Error searching flights:', error);
    throw error;
  }
}

/**
 * Get flight details by ID
 * @param {string} id - Flight ID
 * @returns {Promise<Object|null>} - Flight details or null if not found
 */
export async function getFlightById(id) {
  try {
    const response = await axios.get(`${API_URL}/flights/${id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Error fetching flight:', error);
    throw error;
  }
}