const https = require('https');

// Try with golf_tournament as the sport key
const options = {
  hostname: 'api.the-odds-api.com',
  path: '/v4/sports/golf_tournament/odds/?apiKey=8925a129a4f64a5c6c81f3f9c9336e41&regions=us',
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Golf tournament odds:');
    console.log(JSON.parse(data));
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.end(); 