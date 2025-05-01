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
    // Initialize service properties
    this.useWorkloadIdentity = !process.env.AZURE_OPENAI_API_KEY;
    this.accessToken = null;
    this.tokenExpiryTime = null;
    
    // Azure OpenAI configuration
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.clientId = process.env.AZURE_OPENAI_CLIENTID;
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15';
    
    // Initialize DefaultAzureCredential for Workload Identity
    if (this.useWorkloadIdentity) {
      try {
        this.credential = new DefaultAzureCredential();
        logger.info('DefaultAzureCredential initialized for Workload Identity');
      } catch (error) {
        logger.error('Error initializing DefaultAzureCredential:', error);
      }
    }
    
    // Request queue for rate limiting
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxConcurrentRequests = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5', 10);
    
    // In-memory cache for embeddings
    this.embeddingCache = new Map();
    
    logger.info('Recommendation service initialized');
    logger.info(`Using Workload Identity: ${this.useWorkloadIdentity}`);
  }

  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
      return this.accessToken;
    }

    try {
      // Use DefaultAzureCredential for modern Workload Identity approach
      if (!this.credential) {
        logger.error('DefaultAzureCredential not initialized');
        throw new Error('Authentication credential not initialized');
      }

      // Get a token for Azure OpenAI
      const scopes = ['https://cognitiveservices.azure.com/.default'];
      const tokenResponse = await this.credential.getToken(scopes);
      
      // Store the token and its expiration time
      this.accessToken = tokenResponse.token;
      // Set token expiry time (subtract 5 minutes to be safe)
      this.tokenExpiryTime = Date.now() + (tokenResponse.expiresOnTimestamp - Date.now() - 300000);
      
      logger.info('Successfully acquired new access token using DefaultAzureCredential');
      return this.accessToken;
    } catch (error) {
      logger.error('Error acquiring access token with DefaultAzureCredential:', error);
      throw new Error(`Failed to authenticate with Workload Identity: ${error.message}`);
    }
  }

  
  /**
   * Generate embeddings for a given text using Azure OpenAI
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array<number>>} - Vector embedding of the text
   */
  async generateEmbedding(text) {
    // Check text input
    if (!text || text.trim() === '') {
      throw new Error('Text is empty or undefined');
    }
    
    // Check if we have the embedding cached
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      logger.debug('Using cached embedding');
      return this.embeddingCache.get(cacheKey);
    }
    
    // Queue the request to respect rate limits
    return this.enqueueRequest(async () => {
      let retries = 0;
      
      while (retries <= MAX_RETRIES) {
        try {
          // Prepare headers based on authentication method
          const headers = {
            'Content-Type': 'application/json'
          };
          
          // Add authentication based on configured method
          if (this.useWorkloadIdentity) {
            const token = await this.getAccessToken();
            headers['Authorization'] = `Bearer ${token}`;
          } else if (process.env.AZURE_OPENAI_API_KEY) {
            headers['api-key'] = process.env.AZURE_OPENAI_API_KEY;
          } else {
            throw new Error('No authentication method configured');
          }
          
          // Make sure required configuration is available
          if (!this.endpoint) {
            throw new Error('AZURE_OPENAI_ENDPOINT is not configured');
          }
          
          if (!this.deploymentName) {
            throw new Error('AZURE_OPENAI_DEPLOYMENT is not configured');
          }
          
          // Create request URL for embeddings
          const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/embeddings?api-version=${this.apiVersion}`;
          
          // Create request body
          const requestBody = {
            input: text,
            model: this.deploymentName // Some APIs require model name in the body as well
          };
          
          // Create controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          
          // Make API request
          logger.debug(`Generating embedding for text: ${text.substring(0, 50)}...`);
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          
          // Clear timeout
          clearTimeout(timeoutId);
          
          // Handle rate limiting
          if (response.status === 429) {
            if (retries >= MAX_RETRIES) {
              throw new Error('Rate limit exceeded after maximum retries');
            }
            
            logger.warn('Rate limit hit, retrying after delay...');
            await sleep(RATE_LIMIT_DELAY_MS * Math.pow(2, retries));
            retries++;
            continue;
          }
          
          // Handle other errors
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
          }
          
          // Parse response
          const data = await response.json();
          
          // Extract embedding vector
          const embedding = data.data[0].embedding;
          
          // Cache the embedding
          this.embeddingCache.set(cacheKey, embedding);
          
          logger.debug('Successfully generated embedding');
          return embedding;
        } catch (error) {
          // Handle specific errors
          if (error.name === 'AbortError') {
            logger.error('Request timed out');
            throw new Error('Request timed out');
          }
          
          // Handle retryable errors
          if (retries < MAX_RETRIES) {
            logger.warn(`Error in embedding generation (attempt ${retries + 1}/${MAX_RETRIES + 1}): ${error.message}`);
            await sleep(RETRY_DELAY_MS * Math.pow(2, retries));
            retries++;
          } else {
            logger.error(`Failed to generate embedding after ${MAX_RETRIES + 1} attempts: ${error.message}`);
            throw error;
          }
        }
      }
    });
  }

  /**
   * Get destination recommendations based on user input
   * @param {string} userInput - User's preferences or query
   * @param {number} limit - Maximum number of recommendations to return
   * @returns {Promise<Array<Object>>} - Array of destination recommendations with similarity scores
   */
  async getRecommendation(userInput, limit = 5) {
    if (!userInput || userInput.trim() === '') {
      throw new Error('User input is empty or undefined');
    }
    
    if (!this.isReady()) {
      throw new Error('Recommendation service is not properly configured');
    }
    
    // Format the query to enhance matching
    const formattedInput = `Travel preferences: ${userInput}. 
                           I want to find destinations that match these interests and preferences.`;
    
    try {
      logger.info(`Generating recommendation for: "${userInput.substring(0, 100)}..."`);
      
      // Generate embedding for user input
      const userEmbedding = await this.generateEmbedding(formattedInput);
      
      // Initialize array to store similarity scores
      const destinationScores = [];
      
      // Process each destination - either use cached embedding or generate on demand
      for (const destination of destinations) {
        try {
          let destinationEmbedding;
          
          // Check if we have a pre-computed embedding for this destination
          if (destinationEmbeddings[destination.id]) {
            destinationEmbedding = destinationEmbeddings[destination.id];
          } else {
            // Create a rich destination description for similarity comparison
            const activitiesText = destination.activities ? `Activities you can enjoy: ${destination.activities.join(', ')}.` : '';
            const travelTypeText = destination.travelType ? `Perfect for: ${destination.travelType.join(', ')} travelers.` : '';
            const keywordsText = destination.keywords ? `Keywords: ${destination.keywords.join(', ')}.` : '';
            const nearbyAttractionsText = destination.nearbyAttractions ? `Nearby attractions: ${destination.nearbyAttractions.join(', ')}.` : '';
            
            const destinationDescription = `${destination.city}, ${destination.country}. ${destination.tagline} ${destination.description || ''}
                               ${activitiesText}
                               ${travelTypeText}
                               Budget category: ${destination.budgetCategory || 'Moderate'}.
                               Best time to visit: ${destination.bestTimeToVisit}.
                               ${keywordsText}
                               ${nearbyAttractionsText}
                               ${destination.usp ? `What makes it special: ${destination.usp}` : ''}`.trim();
            
            // Generate embedding for the destination
            logger.debug(`No cached embedding found for ${destination.city}, generating on demand...`);
            destinationEmbedding = await this.generateEmbedding(destinationDescription);
            
            // Save for future use
            destinationEmbeddings[destination.id] = destinationEmbedding;
          }
          
          // Calculate similarity between user preferences and destination
          const similarity = this.cosineSimilarity(userEmbedding, destinationEmbedding);
          
          // Add to results
          destinationScores.push({
            destination,
            similarity
          });
        } catch (error) {
          logger.error(`Error processing destination ${destination.city}:`, error);
          // Continue with other destinations if one fails
        }
      }
      
      // Sort by similarity score (descending)
      destinationScores.sort((a, b) => b.similarity - a.similarity);
      
      // Return top recommendations
      const recommendations = destinationScores.slice(0, limit).map(item => {
        return {
          ...item.destination,
          similarityScore: item.similarity,
          matchPercentage: Math.round(item.similarity * 100)
        };
      });
      
      // Log recommendations for debugging
      logger.info(`Generated ${recommendations.length} recommendations, top match: ${recommendations[0]?.city || 'None'}`);
      
      return recommendations;
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