const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get the endpoint from the query parameters
    const { endpoint } = req.query;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint parameter is required' });
      return;
    }

    // Construct the URL
    const baseUrl = 'https://api.sportsdata.io/golf/v2/json';
    const url = `${baseUrl}${endpoint}?key=${process.env.SPORTDATA_API_KEY}`;

    // Make the request to SportsData.io
    const response = await fetch(url);
    const data = await response.json();

    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in golf API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 