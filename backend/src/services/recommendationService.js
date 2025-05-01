import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import logger from './logger.js';

/**
 * Service for generating travel recommendations based on user input
 * Uses Azure OpenAI embeddings to match user preferences with destinations
 * Supports both Workload Identity and API key authentication
 */
class RecommendationService {
  constructor() {
    // TODO: Add code to initialize the service for generating travel recommendations
  }

  async getAccessToken() {
    // TODO: Add code to acquire an access token using Workload Identity
  }

  
  /**
   * Generate embeddings for a given text using Azure OpenAI
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array<number>>} - Vector embedding of the text
   */
  async generateEmbedding(text) {
    // TODO: Add code to generate embeddings using Azure OpenAI
  }

  /**
   * Get destination recommendations based on user input
   * @param {string} userInput - User's preferences or query
   * @returns {Promise<Object>} - Most relevant destination
   */
  async getRecommendation(userInput) {
    // TODO: Add code to get destination recommendations based on user input
  }






  ///// ===  HELPER FUNCTIONS === /////

  /**
   * Queue a function to be executed with respect to rate limits
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} - Result of the function
   */
  async enqueueRequest(fn) {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        this.activeRequests++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrentRequests) {
        executeRequest();
      } else {
        this.requestQueue.push(executeRequest);
      }
    });
  }

  /**
   * Process the next request in the queue
   */
  processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const nextRequest = this.requestQueue.shift();
      nextRequest();
    }
  }


  /**
   * Generate a cache key for a text string
   * @param {string} text - Text to generate key for
   * @returns {string} - Cache key
   */
  getCacheKey(text) {
    // Simple hash function for text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `text_${hash}`;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vecA - First vector
   * @param {Array<number>} vecB - Second vector
   * @returns {number} - Similarity score between 0 and 1
   */
  cosineSimilarity(vecA, vecB) {
    // Calculate dot product
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    
    // Calculate magnitudes
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    // Calculate cosine similarity
    return dotProduct / (magnitudeA * magnitudeB);
  }  

  isReady() {
    // Check if API key is provided or workload identity is configured
    const isConfigured = Boolean(process.env.AZURE_OPENAI_API_KEY || this.useWorkloadIdentity);
    return isConfigured;
  }
}





// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import destinations data
const destinationsPath = path.join(__dirname, '../data/destinations.json');
const destinationEmbeddingsPath = path.join(__dirname, '../data/destination-embeddings.json');

// Load destinations
const destinations = JSON.parse(fs.readFileSync(destinationsPath, 'utf8'));

// Load destination embeddings (if available)
let destinationEmbeddings = {};
try {
  if (fs.existsSync(destinationEmbeddingsPath)) {
    destinationEmbeddings = JSON.parse(fs.readFileSync(destinationEmbeddingsPath, 'utf8'));
    logger.info(`Loaded ${Object.keys(destinationEmbeddings).length} destination embeddings`);
  } else {
    logger.warn('Destination embeddings file not found. Recommendations will require real-time embedding generation.');
  }
} catch (error) {
  logger.error('Error loading destination embeddings:', error);
}

// Network request timeout and retry settings
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '15000', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS || '2000', 10);
const RATE_LIMIT_DELAY_MS = parseInt(process.env.RATE_LIMIT_DELAY_MS || '1000', 10);

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create a singleton instance
const recommendationService = new RecommendationService();

export default recommendationService;