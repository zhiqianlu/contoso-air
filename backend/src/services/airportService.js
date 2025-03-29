import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read airports data from json file
const airportsFile = path.join(__dirname, '../data/airports.json');
const airports = JSON.parse(fs.readFileSync(airportsFile, 'utf8'));

/**
 * Retrieves the list of airports.
 * @returns {Array} The list of airports.
 */
export function getAirports() {
  return airports;
}

export default {
  getAirports
};