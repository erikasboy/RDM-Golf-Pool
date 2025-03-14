import React, { useState, useEffect } from 'react';
import './TournamentPage.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();
  
  const suffix = ['th', 'st', 'nd', 'rd'][
    (dayOfMonth % 10 > 3 ? 0 : dayOfMonth - dayOfMonth % 10 !== 10) * (dayOfMonth % 10)
  ];
  
  return `${day} ${month} ${dayOfMonth}${suffix}`;
};

const BaseTournamentPage = ({ 
  name, 
  startDate, 
  endDate, 
  venue, 
  location, 
  description,
  weatherLocation,
  oddsData
}) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const tournamentStart = new Date(startDate);
  const tournamentEnd = new Date(endDate);
  
  // Set time to midnight for accurate day comparison
  today.setHours(0, 0, 0, 0);
  tournamentStart.setHours(0, 0, 0, 0);
  tournamentEnd.setHours(0, 0, 0, 0);
  
  const daysUntilStart = Math.ceil((tournamentStart - today) / (1000 * 60 * 60 * 24));
  const isActive = today >= tournamentStart && today <= tournamentEnd;
  const isWithin14Days = daysUntilStart <= 14 && daysUntilStart > 0;
  const isFuture = daysUntilStart > 14;

  console.log('Tournament status:', {
    name,
    today: today.toISOString(),
    startDate: tournamentStart.toISOString(),
    daysUntilStart,
    isActive,
    isWithin14Days,
    isFuture,
    hasOddsData: !!oddsData,
    rawDates: {
      today: today.toString(),
      start: tournamentStart.toString(),
      end: tournamentEnd.toString()
    }
  });

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        if (process.env.REACT_APP_WEATHER_API_KEY) {
          const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.REACT_APP_WEATHER_API_KEY}&q=${weatherLocation}&days=3&aqi=no`;
          console.log('Fetching weather data from:', weatherUrl);
          
          const weatherResponse = await fetch(weatherUrl);
          if (!weatherResponse.ok) {
            console.warn('Weather data unavailable:', weatherResponse.status);
            setWeather(null);
          } else {
            const weatherData = await weatherResponse.json();
            console.log('Weather data:', weatherData);
            setWeather(weatherData);
          }
        } else {
          console.log('Weather API key not configured, skipping weather data');
          setWeather(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Failed to fetch weather data');
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [weatherLocation]);

  if (loading) {
    return <div className="loading">Loading tournament information...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="tournament-page">
      {/* Tournament Header */}
      <header className="tournament-header">
        <h1>{name}</h1>
        <div className="tournament-details">
          <p className="dates">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
          <p className="location">
            {venue}
            {weather && weather.location && (
              <span> • {weather.location.name}, {weather.location.region}</span>
            )}
          </p>
        </div>
        <div className="tournament-description">
          {description}
        </div>
      </header>

      {/* Main Content Area with Leaderboard/Odds and Weather Sidebar */}
      <div className="main-content">
        {/* Leaderboard/Odds Section */}
        <section className="leaderboard-section">
          <h2>Tournament Information</h2>
          {isActive ? (
            <div className="leaderboard-placeholder">
              <p>Tournament in progress - Leaderboard will be available soon</p>
            </div>
          ) : isWithin14Days && oddsData ? (
            <div className="odds-section">
              <h3>Top 15 Favorites</h3>
              <div className="odds-grid">
                {oddsData.slice(0, 15).map((player, index) => (
                  <div key={index} className="odds-row">
                    <span className="position">{index + 1}</span>
                    <span className="player-name">{player.name}</span>
                    <span className="odds">{player.odds}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="leaderboard-placeholder">
              <p>Check back on {formatDate(new Date(tournamentStart.getTime() - 14 * 24 * 60 * 60 * 1000))} to see who's favorite to win {name}</p>
            </div>
          )}
        </section>

        {/* Weather Section */}
        <section className="weather-section">
          <h2>Weather Conditions at {venue}</h2>
          {weather ? (
            <div className="weather-info">
              <div className="current-weather">
                <h3>Current Conditions</h3>
                <div className="weather-details">
                  <p>Temperature: {weather.current.temp_f}°F</p>
                  <p>Wind: {weather.current.wind_mph} mph {weather.current.wind_dir}</p>
                  <p>Humidity: {weather.current.humidity}%</p>
                  <p>Precipitation: {weather.current.precip_in} in</p>
                </div>
              </div>
              <div className="forecast">
                <h3>3-Day Forecast</h3>
                <div className="forecast-grid">
                  {weather.forecast.forecastday.map((day, index) => (
                    <div key={index} className="forecast-day">
                      <p className="date">{formatDate(day.date)}</p>
                      <div className="weather-icon">
                        <img src={day.day.condition.icon} alt={day.day.condition.text} />
                      </div>
                      <p className="temp">{day.day.avgtemp_f}°F</p>
                      <p className="wind">{day.day.maxwind_mph} mph</p>
                      <p className="precip">{day.day.daily_chance_of_rain}% rain</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>Weather information unavailable</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default BaseTournamentPage; 