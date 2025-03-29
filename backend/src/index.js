import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import recommendationRoutes from './routes/recommendationRoutes.js';
import client from 'prom-client';
import path from 'path';

// Import our routes
import airportRoutes from './routes/airportRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import flightRoutes from './routes/flightRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/flights', flightRoutes);

// Health check endpoint
app.get('/api/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Metrics endpoint
app.use('/api/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Serve static files from the frontend
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to serve `index.html` for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});