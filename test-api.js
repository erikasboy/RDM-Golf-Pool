const fetch = require('node-fetch');
require('dotenv').config();

async function testApi() {
  const apiKey = process.env.REACT_APP_SPORTDATA_API_KEY;
  console.log('API Key:', apiKey ? 'Present' : 'Missing');
  
  // Test endpoints
  const endpoints = [
    '/Players',
    '/Tournaments/2025',
    '/Leaderboard/1234',
    '/LeaderboardBasic/1234'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    try {
      const url = `https://api.sportsdata.io/golf/v2/json${endpoint}?key=${apiKey}`;
      console.log('URL:', url.replace(apiKey, 'HIDDEN_KEY'));
      
      const response = await fetch(url);
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      const text = await response.text();
      console.log('Response preview:', text.substring(0, 200));
      
      if (text.trim().toLowerCase().startsWith('<?xml')) {
        console.log('Received XML response (likely an error page)');
      } else {
        try {
          const json = JSON.parse(text);
          console.log('Successfully parsed JSON');
          if (Array.isArray(json)) {
            console.log(`Array with ${json.length} items`);
          } else if (json.Players && Array.isArray(json.Players)) {
            console.log(`Object with Players array (${json.Players.length} items)`);
          } else {
            console.log('JSON structure:', Object.keys(json));
          }
        } catch (e) {
          console.log('Failed to parse as JSON:', e.message);
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testApi().catch(console.error); 