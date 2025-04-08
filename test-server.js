const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API server is working!' });
});

// Golf API endpoint
app.get('/api/golf', async (req, res) => {
  console.log('Golf API endpoint called');
  console.log('Query:', req.query);
  
  try {
    const { endpoint } = req.query;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint parameter is required' });
      return;
    }

    const apiKey = process.env.REACT_APP_SPORTDATA_API_KEY;
    if (!apiKey) {
      console.error('SPORTDATA_API_KEY is not set');
      res.status(500).json({ error: 'API key is not configured' });
      return;
    }

    const baseUrl = 'https://api.sportsdata.io/golf/v2/json';
    const url = `${baseUrl}${endpoint}?key=${apiKey}`;
    console.log('Requesting URL:', url.replace(apiKey, 'HIDDEN_KEY'));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log('Environment variables loaded:', {
    hasSportDataKey: !!process.env.REACT_APP_SPORTDATA_API_KEY,
    hasWeatherKey: !!process.env.REACT_APP_WEATHER_API_KEY
  });
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

async function testServer() {
  try {
    console.log('Testing server...');
    
    // Test the test endpoint
    console.log('Testing /api/test endpoint...');
    const testResponse = await fetch('http://localhost:3001/api/test');
    console.log('Test endpoint status:', testResponse.status);
    const testData = await testResponse.json();
    console.log('Test endpoint data:', testData);
    
    // Test the picks endpoint
    console.log('Testing /api/picks endpoint...');
    const picksResponse = await fetch('http://localhost:3001/api/picks');
    console.log('Picks endpoint status:', picksResponse.status);
    const picksData = await picksResponse.json();
    console.log('Picks endpoint data:', picksData);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing server:', error);
  }
}

testServer(); 