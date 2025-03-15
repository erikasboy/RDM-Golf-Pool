module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log some basic information
  console.log('Health check called');
  console.log('Environment variables present:', {
    hasSportDataKey: !!process.env.SPORTDATA_API_KEY,
    hasWeatherKey: !!process.env.WEATHER_API_KEY,
    sportDataKeyPrefix: process.env.SPORTDATA_API_KEY ? process.env.SPORTDATA_API_KEY.substring(0, 4) + '...' : 'undefined'
  });

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasSportDataKey: !!process.env.SPORTDATA_API_KEY,
    hasWeatherKey: !!process.env.WEATHER_API_KEY
  });
}; 