import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Retrieves the list of airports.
 * @returns {Promise<Array>} The list of airports.
 */
export async function getAirports() {
  try {
    const response = await axios.get(`${API_URL}/airports`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airports:', error);
    throw error;
  }
}