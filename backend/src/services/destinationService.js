import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read destinations data from json file
const destinationsFile = path.join(__dirname, '../data/destinations.json');
const destinations = JSON.parse(fs.readFileSync(destinationsFile, 'utf8'));

/**
 * Retrieves the list of destinations.
 * @returns {Array} The list of destinations.
 */
export function getDestinations() {
  return destinations;
}

/**
 * Retrieves a destination by ID.
 * @param {string} id - The ID of the destination to find.
 * @returns {Object|null} The destination object or null if not found.
 */
export function getDestinationById(id) {
  return destinations.find(destination => destination.id === id) || null;
}

export default {
  getDestinations,
  getDestinationById
};