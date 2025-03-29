import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import recommendationService from '../services/recommendationService.js';
import dotenv from 'dotenv';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Path to destinations data files
const destinationsPath = path.join(__dirname, '../data/destinations.json');
const destinationEmbeddingsPath = path.join(__dirname, '../data/destination-embeddings.json');

/**
 * Utility to generate embeddings for all destinations in the destinations.json file
 * and save them to the destination-embeddings.json file for future use in similarity comparisons
 */
async function generateAllDestinationEmbeddings() {
  console.log('Starting generation of embeddings for all destinations...');
  
  try {
    // Read destinations from file
    const destinationsData = fs.readFileSync(destinationsPath, 'utf8');
    const destinations = JSON.parse(destinationsData);
    
    console.log(`Found ${destinations.length} destinations to process`);
    
    // Read existing embeddings (if any)
    let embeddingsMap = {};
    try {
      if (fs.existsSync(destinationEmbeddingsPath)) {
        const embeddingsData = fs.readFileSync(destinationEmbeddingsPath, 'utf8');
        embeddingsMap = JSON.parse(embeddingsData);
        console.log(`Loaded ${Object.keys(embeddingsMap).length} existing embeddings`);
      }
    } catch (error) {
      console.warn('Could not load existing embeddings, starting fresh:', error.message);
    }
    
    // Process destinations sequentially to avoid rate limits
    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i];
      console.log(`Processing destination ${i+1}/${destinations.length}: ${destination.city}, ${destination.country}`);
      
      try {
        // Skip destinations that already have embeddings
        if (embeddingsMap[destination.id]) {
          console.log(`Embedding already exists for ${destination.city}, skipping...`);
          continue;
        }
        
        // Create a rich description for the destination similar to what the recommendation service uses
        const activitiesText = destination.activities ? `Activities you can enjoy: ${destination.activities.join(', ')}.` : '';
        const travelTypeText = destination.travelType ? `Perfect for: ${destination.travelType.join(', ')} travelers.` : '';
        const keywordsText = destination.keywords ? `Keywords: ${destination.keywords.join(', ')}.` : '';
        const nearbyAttractionsText = destination.nearbyAttractions ? `Nearby attractions: ${destination.nearbyAttractions.join(', ')}.` : '';
        
        const description = `${destination.city}, ${destination.country}. ${destination.tagline} ${destination.description || ''}
                             ${activitiesText}
                             ${travelTypeText}
                             Budget category: ${destination.budgetCategory || 'Moderate'}.
                             Best time to visit: ${destination.bestTimeToVisit}.
                             ${keywordsText}
                             ${nearbyAttractionsText}
                             ${destination.usp ? `What makes it special: ${destination.usp}` : ''}`.trim();
        
        // Generate embedding for the destination description
        console.log(`Generating embedding for ${destination.city}...`);
        const embedding = await recommendationService.generateEmbedding(description);
        
        // Add embedding to embeddings map
        embeddingsMap[destination.id] = embedding;
        console.log(`Successfully added embedding for ${destination.city}`);
        
        // Add a small delay between requests to avoid triggering rate limits
        if (i < destinations.length - 1) {
          const delay = 1000; // 1 second delay
          console.log(`Waiting ${delay}ms before processing next destination...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Error processing ${destination.city}:`, error);
      }
    }
    
    // Write embeddings to file
    console.log('Writing embeddings to file...');
    fs.writeFileSync(
      destinationEmbeddingsPath, 
      JSON.stringify(embeddingsMap, null, 2),
      'utf8'
    );
    
    console.log('Successfully generated and saved embeddings for all destinations!');
    console.log(`Embeddings file at: ${destinationEmbeddingsPath}`);
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
  }
}

// Execute the function
generateAllDestinationEmbeddings()
  .then(() => console.log('Embedding generation process completed.'))
  .catch(error => console.error('Error in embedding generation process:', error));