import React, { useState, useEffect } from 'react';
import './WeatherCard.css';

const WeatherCard = ({ location }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map of course names to their city/state locations
  const courseLocations = {
    'Augusta National Golf Club': 'Augusta, Georgia',
    'Valhalla Golf Club': 'Louisville, Kentucky',
    'Pinehurst No. 2': 'Pinehurst, North Carolina',
    'Royal Troon Golf Club': 'Troon, Scotland',
    'TPC Sawgrass': 'Ponte Vedra Beach, Florida'
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // For now, return mock weather data
        // TODO: Replace with actual weather API call
        const mockWeather = {
          temp: '72°F',
          condition: 'Sunny',
          wind: '5 mph',
          humidity: '65%'
        };
        setWeather(mockWeather);
      } catch (err) {
        setError('Failed to fetch weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  if (loading) {
    return <div className="weather-loading">Loading weather data...</div>;
  }

  if (error) {
    return <div className="weather-error">{error}</div>;
  }

  const cityState = courseLocations[location] || '';

  return (
    <div className="weather-card">
      <div className="weather-info">
        <div className="weather-location">
          <div className="course-name">{location}</div>
          <div className="city-state">{cityState}</div>
        </div>
        <div className="weather-temp">{weather?.temp}</div>
        <div className="weather-condition">{weather?.condition}</div>
        <div className="weather-details">
          <div className="weather-detail">
            <span className="detail-label">Wind:</span>
            <span className="detail-value">{weather?.wind}</span>
          </div>
          <div className="weather-detail">
            <span className="detail-label">Humidity:</span>
            <span className="detail-value">{weather?.humidity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard; 