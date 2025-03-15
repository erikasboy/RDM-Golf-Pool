const fetch = require('node-fetch');

module.exports = async (req, res) => {
  console.log('Golf API endpoint called');
  
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

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

    console.log('Request query:', req.query);

    // Get the endpoint from the query parameters
    const { endpoint } = req.query;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint parameter is required' });
      return;
    }

    // Log the API key (first few characters)
    const apiKey = process.env.SPORTDATA_API_KEY;
    if (!apiKey) {
      console.error('SPORTDATA_API_KEY is not set');
      res.status(500).json({ error: 'API key is not configured' });
      return;
    }
    console.log('API Key prefix:', apiKey.substring(0, 4) + '...');

    // Construct the URL
    const baseUrl = 'https://api.sportsdata.io/golf/v2/json';
    const url = `${baseUrl}${endpoint}?key=${apiKey}`;
    console.log('Requesting URL:', url.replace(apiKey, 'HIDDEN_KEY'));

    // Make the request to SportsData.io
    console.log('Making request to SportsData.io...');
    const response = await fetch(url).catch(error => {
      console.error('Fetch error:', error);
      throw new Error(`Fetch failed: ${error.message}`);
    });
    
    console.log('SportsData.io response status:', response.status);
    console.log('SportsData.io response headers:', response.headers);

    // Get the response text first to debug any issues
    const responseText = await response.text().catch(error => {
      console.error('Error reading response text:', error);
      throw new Error(`Failed to read response: ${error.message}`);
    });
    
    console.log('Response text preview:', responseText.substring(0, 100));

    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      console.log('Successfully parsed JSON response');
      res.status(response.status).json(data);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).json({ 
        error: 'Invalid JSON response from SportsData.io',
        details: responseText.substring(0, 100),
        status: response.status,
        parseError: parseError.message
      });
    }
  } catch (error) {
    console.error('Error in golf API:', error);
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}; 