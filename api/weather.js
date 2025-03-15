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
    // Get the location from query parameters
    const { location } = req.query;
    if (!location) {
      res.status(400).json({ error: 'Location parameter is required' });
      return;
    }

    // Log the API key (first few characters)
    const apiKey = process.env.WEATHER_API_KEY;
    console.log('Weather API Key prefix:', apiKey ? apiKey.substring(0, 4) + '...' : 'undefined');

    // Construct the URL
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=no`;
    console.log('Requesting Weather URL:', url.replace(apiKey, 'HIDDEN_KEY'));

    // Make the request to WeatherAPI
    const response = await fetch(url);
    console.log('WeatherAPI response status:', response.status);

    // Get the response text first to debug any issues
    const responseText = await response.text();
    console.log('Weather response text preview:', responseText.substring(0, 100));

    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      res.status(response.status).json(data);
    } catch (parseError) {
      console.error('Error parsing weather JSON:', parseError);
      res.status(500).json({ 
        error: 'Invalid JSON response from WeatherAPI',
        details: responseText.substring(0, 100),
        status: response.status
      });
    }
  } catch (error) {
    console.error('Error in weather API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}; 