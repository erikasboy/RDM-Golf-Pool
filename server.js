const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = 3001;

// Log all environment variables at startup
console.log('All environment variables:', {
  REACT_APP_SPORTDATA_API_KEY: process.env.REACT_APP_SPORTDATA_API_KEY ? 'Set' : 'Not set',
  REACT_APP_WEATHER_API_KEY: process.env.REACT_APP_WEATHER_API_KEY ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV,
  PWD: process.env.PWD
});

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Query:', req.query);
  console.log('Environment variables:', {
    REACT_APP_SPORTDATA_API_KEY: process.env.REACT_APP_SPORTDATA_API_KEY ? 'Set' : 'Not set',
    REACT_APP_WEATHER_API_KEY: process.env.REACT_APP_WEATHER_API_KEY ? 'Set' : 'Not set'
  });
  next();
});

// Golf API endpoint
app.get('/api/golf', async (req, res) => {
  try {
    const { endpoint } = req.query;
    console.log('Golf API endpoint called');
    console.log('Full URL:', req.originalUrl);
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    if (!process.env.REACT_APP_SPORTDATA_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Construct the API URL
    const baseUrl = 'https://api.sportsdata.io/golf/v2/json';
    const apiUrl = `${baseUrl}${endpoint}?key=${process.env.REACT_APP_SPORTDATA_API_KEY}`;
    
    console.log('Requesting URL:', apiUrl.replace(process.env.REACT_APP_SPORTDATA_API_KEY, 'HIDDEN_KEY'));
    
    const response = await fetch(apiUrl);
    const contentType = response.headers.get('content-type');
    
    console.log('Response status:', response.status);
    console.log('Content-Type:', contentType);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      return res.status(response.status).json({ 
        error: 'API request failed',
        status: response.status,
        details: errorText
      });
    }

    // Handle both JSON and XML responses
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      console.log('Raw response:', text.substring(0, 200) + '...');
      return res.status(500).json({ 
        error: 'Unexpected response format',
        contentType,
        preview: text.substring(0, 200)
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  console.log('Weather API endpoint called');
  console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  
  try {
    const { location } = req.query;
    if (!location) {
      console.log('Missing location parameter');
      res.status(400).json({ error: 'Location parameter is required' });
      return;
    }

    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    if (!apiKey) {
      console.error('WEATHER_API_KEY is not set');
      res.status(500).json({ error: 'API key is not configured' });
      return;
    }

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=no`;
    console.log('Requesting URL:', url.replace(apiKey, 'HIDDEN_KEY'));

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Picks endpoint
app.get('/api/picks', async (req, res) => {
  console.log('Picks endpoint called');
  console.log('Full URL:', req.originalUrl);
  
  try {
    // For testing, return some mock picks data
    const mockPicks = {
      'John Doe': {
        '654': ['Rory McIlroy', 'Jon Rahm', 'Scottie Scheffler', 'Justin Thomas']
      },
      'Jane Smith': {
        '654': ['Xander Schauffele', 'Patrick Cantlay', 'Collin Morikawa', 'Viktor Hovland']
      },
      'Bob Johnson': {
        '654': ['Sam Burns', 'Tony Finau', 'Sungjae Im', 'Corey Conners']
      }
    };
    
    console.log('Returning mock picks data');
    res.json(mockPicks);
  } catch (error) {
    console.error('Error fetching picks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a test endpoint for the golf API
app.get('/api/golf/test', async (req, res) => {
  console.log('Golf API test endpoint called');
  
  try {
    const apiKey = process.env.REACT_APP_SPORTDATA_API_KEY;
    if (!apiKey) {
      console.error('SPORTDATA_API_KEY is not set');
      res.status(500).json({ error: 'API key is not configured' });
      return;
    }

    // Try a different endpoint that should be more reliable
    const url = `https://api.sportsdata.io/golf/v2/json/Players?key=${apiKey}`;
    console.log('Requesting URL:', url.replace(apiKey, 'HIDDEN_KEY'));

    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));

    // Get the raw response text first
    const responseText = await response.text();
    console.log('Raw response preview:', responseText.substring(0, 500));

    // Check if we got an XML response (likely an error page)
    if (responseText.trim().toLowerCase().startsWith('<?xml')) {
      console.error('Received XML response instead of JSON. Full response:', responseText);
      res.status(500).json({ 
        error: 'Received XML response from API',
        details: responseText.substring(0, 500),
        status: response.status
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      res.json({ 
        success: true, 
        message: 'API key is valid',
        playerCount: Array.isArray(data) ? data.length : 'Unknown'
      });
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).json({ 
        error: 'Invalid JSON response from SportsData.io',
        details: responseText.substring(0, 500),
        status: response.status
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is working!' });
});

// Field endpoint
app.get('/api/field', async (req, res) => {
  console.log('Field endpoint called');
  console.log('Full URL:', req.originalUrl);
  console.log('Query parameters:', req.query);
  
  const tournamentId = req.query.tournament;
  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  const apiKey = process.env.REACT_APP_SPORTDATA_API_KEY;
  console.log('API Key available:', apiKey ? 'Yes' : 'No');
  
  if (!apiKey) {
    console.error('REACT_APP_SPORTDATA_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Try different API endpoints for players
    const endpoints = [
      `/PlayerTournamentBasic/${tournamentId}`,  // Add this as the first option
      `/TournamentField/${tournamentId}`,
      `/Players/Tournament/${tournamentId}`,
      `/Leaderboard/${tournamentId}`
    ];

    for (const endpoint of endpoints) {
      const apiUrl = `https://api.sportsdata.io/golf/v2/json${endpoint}?key=${apiKey}`;
      console.log('Making API request to:', apiUrl.replace(apiKey, '[REDACTED]'));

      const response = await fetch(apiUrl);
      console.log('API response status:', response.status);

      if (!response.ok) {
        console.log(`Endpoint ${endpoint} failed with status ${response.status}`);
        continue; // Try next endpoint
      }

      const data = await response.json();
      console.log('Raw data type:', typeof data);
      console.log('Sample of raw data:', JSON.stringify(data).substring(0, 500));
      
      // Extract players array from different response formats
      let players = [];
      if (Array.isArray(data)) {
        players = data;
      } else if (data.Players && Array.isArray(data.Players)) {
        players = data.Players;
      } else if (data.Tournament && data.Tournament.Players) {
        players = data.Tournament.Players;
      } else if (data.PlayerTournamentBasic && Array.isArray(data.PlayerTournamentBasic)) {
        players = data.PlayerTournamentBasic;
      }

      if (players.length > 0) {
        console.log(`Found ${players.length} players using endpoint ${endpoint}`);
        console.log('Sample player from API:', JSON.stringify(players[0]).substring(0, 200));
        
        const field = players
          .filter(player => !player.IsWithdrawn)
          .map(player => ({
            PlayerID: player.PlayerID,
            Name: player.Name,
            Country: player.Country || null,
            PhotoURI: player.PhotoURI || null,
            OddsToWin: player.OddsToWin || null,
            Odds: player.Odds || null,
            OddsWin: player.OddsWin || null,
            MoneyLine: player.MoneyLine || null
          }))
          .sort((a, b) => a.Name.localeCompare(b.Name));
        
        console.log(`Transformed ${field.length} active players`);
        if (field.length > 0) {
          console.log('Sample transformed player:', JSON.stringify(field[0]).substring(0, 200));
        }
        
        return res.json(field);
      }
    }
    
    // If we get here, none of the endpoints worked
    return res.status(404).json({ error: 'No field data found for this tournament' });
  } catch (error) {
    console.error('Error fetching field data:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Add this before the odds endpoint
const tournamentSportKeys = {
  '628': 'golf_masters_tournament_winner',      // Masters Tournament
  '629': 'golf_pga_championship_winner',        // PGA Championship
  '630': 'golf_us_open_winner',                 // U.S. Open
  '642': 'golf_the_open_championship_winner',   // The Open Championship
  // TPC (654) has no odds available
};

// Odds API endpoint
app.get('/api/odds', async (req, res) => {
  console.log('Odds API endpoint called');
  console.log('Full URL:', req.originalUrl);
  console.log('Query parameters:', req.query);
  
  const tournamentId = req.query.tournament;
  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  // Check if this tournament has odds available
  const sportKey = tournamentSportKeys[tournamentId];
  if (!sportKey) {
    console.log(`No odds available for tournament ${tournamentId}`);
    return res.json({ odds: [] });
  }

  const apiKey = process.env.REACT_APP_ODDS_API_KEY;
  console.log('Odds API Key available:', apiKey ? 'Yes' : 'No');
  
  if (!apiKey) {
    console.error('REACT_APP_ODDS_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Fetch the odds data from The Odds API using the correct sport key
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us`;
    console.log('Fetching odds from:', oddsUrl.replace(apiKey, '[REDACTED]'));
    
    const oddsResponse = await fetch(oddsUrl);
    console.log('Odds API response status:', oddsResponse.status);
    
    if (!oddsResponse.ok) {
      const errorText = await oddsResponse.text();
      console.error('Odds API error response:', errorText);
      return res.status(oddsResponse.status).json({ 
        error: `Odds API request failed with status ${oddsResponse.status}: ${errorText}` 
      });
    }
    
    const oddsData = await oddsResponse.json();
    console.log('Odds data:', JSON.stringify(oddsData).substring(0, 200));
    
    // Extract the odds for each player with defensive programming
    let odds = [];
    if (oddsData && Array.isArray(oddsData)) {
      // Create a map to store the best odds for each player
      const playerOddsMap = new Map();
      
      oddsData
        .filter(t => t && t.bookmakers && Array.isArray(t.bookmakers))
        .flatMap(t => t.bookmakers)
        .filter(b => b && b.markets && Array.isArray(b.markets))
        .flatMap(b => b.markets)
        .filter(m => m && m.outcomes && Array.isArray(m.outcomes))
        .flatMap(m => m.outcomes)
        .filter(o => o && o.name && typeof o.price !== 'undefined')
        .forEach(o => {
          // If player doesn't exist in map or has worse odds, update with better odds
          if (!playerOddsMap.has(o.name) || playerOddsMap.get(o.name).odds > o.price) {
            playerOddsMap.set(o.name, {
              name: o.name,
              odds: o.price
            });
          }
        });
      
      // Convert map to array and sort by odds
      odds = Array.from(playerOddsMap.values())
        .sort((a, b) => a.odds - b.odds);
    }
    
    console.log(`Found ${odds.length} unique player odds`);
    if (odds.length > 0) {
      console.log('Sample odds:', odds[0]);
    }
    
    return res.json({ odds });
  } catch (error) {
    console.error('Error fetching odds data:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
  console.log('Environment variables loaded:', {
    hasSportDataKey: !!process.env.REACT_APP_SPORTDATA_API_KEY,
    hasWeatherKey: !!process.env.REACT_APP_WEATHER_API_KEY
  });
}); 