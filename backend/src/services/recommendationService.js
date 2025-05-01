import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import logger from './logger.js';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Service for generating travel recommendations based on user input
 * Uses Azure OpenAI embeddings to match user preferences with destinations
 * Supports both Workload Identity and API key authentication
 */
class RecommendationService {
  constructor() {
    // Initialize Azure OpenAI configuration
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT;
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15';
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.clientId = process.env.AZURE_OPENAI_CLIENTID;
    
    // Use workload identity if client ID is provided
    this.useWorkloadIdentity = Boolean(this.clientId);
    
    // Request queue for rate limiting
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxConcurrentRequests = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5', 10);
    
    // Caching for embeddings
    this.embeddingCache = new Map();
    this.maxCacheSize = parseInt(process.env.MAX_CACHE_SIZE || '1000', 10);
    
    if (this.useWorkloadIdentity) {
      logger.info('Using Workload Identity authentication for Azure OpenAI');
    } else if (this.apiKey) {
      logger.info('Using API Key authentication for Azure OpenAI');
    } else {
      logger.warn('No authentication method configured for Azure OpenAI');
    }
  }

  async getAccessToken() {
    if (!this.useWorkloadIdentity) {
      return null;
    }

    try {
      // Create credential object using Azure Identity library
      const credential = new DefaultAzureCredential();
      
      // Get access token for Azure OpenAI scope
      const scope = 'https://cognitiveservices.azure.com/.default';
      const tokenResponse = await credential.getToken(scope);
      
      logger.debug('Successfully obtained access token using Workload Identity');
      return tokenResponse.token;
    } catch (error) {
      logger.error('Error getting access token:', error);
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  
  /**
   * Generate embeddings for a given text using Azure OpenAI
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array<number>>} - Vector embedding of the text
   */
  async generateEmbedding(text) {
    // Check if the text is empty
    if (!text || text.trim() === '') {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Check for cached embedding
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      logger.debug('Using cached embedding for text');
      return this.embeddingCache.get(cacheKey);
    }

    // Function to execute the API call
    const executeEmbeddingRequest = async (retryCount = 0) => {
      try {
        // Set up authentication headers
        const headers = {
          'Content-Type': 'application/json'
        };

        // Use appropriate authentication method
        if (this.useWorkloadIdentity) {
          const token = await this.getAccessToken();
          headers['Authorization'] = `Bearer ${token}`;
        } else if (this.apiKey) {
          headers['api-key'] = this.apiKey;
        } else {
          throw new Error('No authentication method available for Azure OpenAI');
        }

        // Prepare the request URL
        const url = `${this.endpoint}/openai/deployments/${this.deploymentId}/embeddings?api-version=${this.apiVersion}`;
        
        // Prepare the request body
        const body = JSON.stringify({
          input: text,
          user: 'contoso-air-recommendation-service'
        });

        // Make the request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          logger.error(`Azure OpenAI API error: ${response.status} ${response.statusText}`, errorData);

          // Handle rate limiting
          if (response.status === 429) {
            if (retryCount < MAX_RETRIES) {
              logger.warn(`Rate limited by Azure OpenAI API. Retrying in ${RETRY_DELAY_MS}ms...`);
              await sleep(RATE_LIMIT_DELAY_MS);
              return executeEmbeddingRequest(retryCount + 1);
            }
            throw new Error('Azure OpenAI API rate limit exceeded maximum retries');
          }

          throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
        }

        // Parse the response
        const data = await response.json();
        const embedding = data.data[0].embedding;

        // Cache the result
        if (this.embeddingCache.size >= this.maxCacheSize) {
          // Remove oldest entry if cache is full
          const firstKey = this.embeddingCache.keys().next().value;
          this.embeddingCache.delete(firstKey);
        }
        this.embeddingCache.set(cacheKey, embedding);

        return embedding;
      } catch (error) {
        // Handle timeout or network errors with retries
        if (error.name === 'AbortError' || error.name === 'FetchError') {
          if (retryCount < MAX_RETRIES) {
            logger.warn(`Request failed. Retrying in ${RETRY_DELAY_MS}ms...`, error);
            await sleep(RETRY_DELAY_MS);
            return executeEmbeddingRequest(retryCount + 1);
          }
        }
        throw error;
      }
    };

    // Use rate limiting queue to manage concurrent requests
    return this.enqueueRequest(() => executeEmbeddingRequest());
  }

  /**
   * Get destination recommendations based on user input
   * @param {string} userInput - User's preferences or query
   * @param {number} limit - Maximum number of recommendations to return
   * @returns {Promise<Array<Object>>} - Array of destination recommendations with similarity scores
   */
  async getRecommendation(userInput, limit = 5) {
    if (!userInput || userInput.trim() === '') {
      throw new Error('User input cannot be empty');
    }
    
    if (!this.isReady()) {
      throw new Error('Recommendation service is not properly configured');
    }
    
    try {
      logger.info(`Generating recommendations for user input: "${userInput}"`);
      
      // Generate embedding for user input
      const userEmbedding = await this.generateEmbedding(userInput);
      
      // Calculate similarities with all destinations
      const recommendations = await Promise.all(
        destinations.map(async (destination) => {
          let destinationEmbedding;
          
          // Try to use pre-computed embeddings if available
          if (destinationEmbeddings[destination.id]) {
            destinationEmbedding = destinationEmbeddings[destination.id];
          } else {
            // Generate embedding for the destination description
            const descriptionText = `${destination.name}: ${destination.description}. Features: ${destination.features.join(', ')}`;
            destinationEmbedding = await this.generateEmbedding(descriptionText);
            
            // Store the generated embedding for future use
            destinationEmbeddings[destination.id] = destinationEmbedding;
          }
          
          // Calculate similarity between user input and destination
          const similarity = this.cosineSimilarity(userEmbedding, destinationEmbedding);
          
          return {
            ...destination,
            similarity
          };
        })
      );
      
      // Sort by similarity (highest first) and limit results
      const topRecommendations = recommendations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      logger.info(`Generated ${topRecommendations.length} recommendations for user input`);
      
      return topRecommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
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