import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Retrieves the list of destinations.
 * @returns {Promise<Array>} The list of destinations.
 */
export async function getDestinations() {
  try {
    const response = await axios.get(`${API_URL}/destinations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    throw error;
  }
}