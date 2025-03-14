import React, { useState, useEffect } from 'react';
import { getCurrentTournament } from '../firebase';
import './TournamentPage.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();
  
  // Add ordinal suffix to day
  const suffix = ['th', 'st', 'nd', 'rd'][
    (dayOfMonth % 10 > 3 ? 0 : dayOfMonth - dayOfMonth % 10 !== 10) * (dayOfMonth % 10)
  ];
  
  return `${day} ${month} ${dayOfMonth}${suffix}`;
};

const TournamentPage = () => {
  const [tournament, setTournament] = useState(null);
  const [weather, setWeather] = useState(null);
  const [odds, setOdds] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        // Get the current tournament (The Players Championship)
        const currentTournamentUrl = `https://api.sportsdata.io/golf/v2/json/LeaderboardBasic/654?key=${process.env.REACT_APP_SPORTDATA_API_KEY}`;
        console.log('Fetching current tournament data from:', currentTournamentUrl);
        
        const currentResponse = await fetch(currentTournamentUrl);
        if (!currentResponse.ok) {
          throw new Error(`Failed to fetch current tournament data: ${currentResponse.status}`);
        }
        const currentData = await currentResponse.json();
        console.log('Current tournament data:', currentData);

        // Set the current tournament data
        if (currentData.Tournament) {
          console.log('Setting tournament data:', currentData.Tournament);
          setTournament(currentData.Tournament);
        }
        
        // Set the current leaderboard data
        if (currentData.Players && Array.isArray(currentData.Players)) {
          console.log('Setting current leaderboard with', currentData.Players.length, 'players');
          const currentLeaderboardData = {
            Tournament: currentData.Tournament,
            Players: currentData.Players
          };
          console.log('Current leaderboard data structure:', {
            hasTournament: !!currentLeaderboardData.Tournament,
            playerCount: currentLeaderboardData.Players.length,
            firstPlayer: currentLeaderboardData.Players[0]
          });
          setLeaderboard(currentLeaderboardData);
        }

        // Only fetch weather if we have an API key
        if (process.env.REACT_APP_WEATHER_API_KEY) {
          // Fetch weather data for TPC Sawgrass (Ponte Vedra Beach, FL)
          const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.REACT_APP_WEATHER_API_KEY}&q=Ponte%20Vedra%20Beach,FL&days=3&aqi=no`;
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
        console.error('Error fetching tournament data:', error);
        setError('Failed to fetch tournament data');
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, []);

  const getDisplayRank = (rank, players) => {
    // Count how many players have this rank
    const rankCount = players.filter(p => p.Rank === rank).length;
    return rankCount > 1 ? `T${rank}` : rank;
  };

  if (loading) {
    return <div className="loading">Loading tournament information...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!tournament) {
    return <div className="error">No tournament information available</div>;
  }

  console.log('Rendering tournament page with data:', {
    tournament,
    leaderboard,
    isActive: tournament.isActive
  });

  return (
    <div className="tournament-page">
      {/* Tournament Header */}
      <header className="tournament-header">
        <h1>{tournament?.Name}</h1>
        <div className="tournament-details">
          <p className="dates">
            {formatDate(tournament?.StartDate)} - {formatDate(tournament?.EndDate)}
          </p>
          <p className="location">
            {tournament?.venue?.name || 'TPC Sawgrass'}
            {weather && weather.location && (
              <span> • {weather.location.name}, {weather.location.region}</span>
            )}
          </p>
          {console.log('Venue data:', tournament?.venue)}
        </div>
        <div className="tournament-description">
          {tournament?.description || "The Players Championship, often referred to as the 'fifth major', is one of the most prestigious events in professional golf. Held annually at TPC Sawgrass, this tournament features the strongest field in golf and is known for its challenging Stadium Course, particularly the iconic 17th hole island green."}
        </div>
      </header>

      {/* Main Content Area with Leaderboard and Weather Sidebar */}
      <div className="main-content">
        {/* Leaderboard Section */}
        <section className="leaderboard-section">
          <h2>Current Tournament Leaderboard</h2>
          {leaderboard ? (
            <>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Player</th>
                      <th>Total</th>
                    <th>Through</th>
                    <th>Strokes</th>
                    <th>R1</th>
                    <th>R2</th>
                    <th>R3</th>
                    <th>R4</th>
                    </tr>
                  </thead>
                  <tbody>
                  {leaderboard.Players && leaderboard.Players.length > 0 ? (
                    leaderboard.Players
                      .slice(0, showAllPlayers ? undefined : 15)
                      .map((player) => {
                        // Get the total score relative to par and total strokes
                        const toPar = player.TotalScore || 0;
                        const totalStrokes = player.TotalStrokes || 0;
                        const through = player.TotalThrough || 'F';
                        
                        // Calculate individual round scores
                        const roundScores = [];
                        if (player.Rounds && player.Rounds.length > 0) {
                          let remainingStrokes = totalStrokes;
                          
                          // For each round, subtract previous rounds from total
                          player.Rounds.forEach((round, index) => {
                            if (index === 0) {
                              // First round is just the total strokes
                              roundScores[index] = totalStrokes;
                            } else {
                              // Subsequent rounds subtract previous rounds
                              const previousRounds = roundScores.slice(0, index).reduce((sum, score) => sum + score, 0);
                              roundScores[index] = totalStrokes - previousRounds;
                            }
                          });
                        }
                        
                        return (
                          <tr key={player.PlayerTournamentID}>
                            <td>{getDisplayRank(player.Rank, leaderboard.Players)}</td>
                            <td>{player.Name || 'Unknown'}</td>
                            <td>{toPar >= 0 ? '+' : ''}{toPar}</td>
                            <td>{through}</td>
                            <td>{totalStrokes}</td>
                            {[0, 1, 2, 3].map((index) => (
                              <td key={index}>{roundScores[index] || '-'}</td>
                            ))}
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center">No player data available</td>
                      </tr>
                  )}
                  </tbody>
                </table>
              {leaderboard.Players && leaderboard.Players.length > 15 && !showAllPlayers && (
                <button className="view-more-button" onClick={() => setShowAllPlayers(true)}>
                  View More Players
                </button>
            )}
          </>
        ) : (
            <p className="error">No leaderboard data available</p>
          )}
        </section>

        {/* Weather Section */}
        <section className="weather-section">
          <h2>Weather Conditions at {tournament?.venue?.name || 'TPC Sawgrass'}</h2>
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

export default TournamentPage; 