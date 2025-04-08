import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TournamentPage.css';

// Add tournament configurations
const TOURNAMENTS = [
  {
    id: 'masters',
    name: 'The Masters Tournament',
    startDate: '2025-04-11',
    endDate: '2025-04-14',
    venue: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    description: 'The Masters Tournament, one of golf\'s four major championships, is held annually at Augusta National Golf Club. Known for its iconic green jacket, Amen Corner, and the pristine beauty of its course.',
    path: '/tournaments/masters'
  },
  {
    id: 'pga',
    name: 'PGA Championship',
    startDate: '2025-05-16',
    endDate: '2025-05-19',
    venue: 'Valhalla Golf Club',
    location: 'Louisville, KY',
    description: 'The PGA Championship, one of golf\'s four major championships, returns to Valhalla Golf Club. Known for its challenging layout and dramatic finishes.',
    path: '/tournaments/pga'
  },
  {
    id: 'us-open',
    name: 'U.S. Open',
    startDate: '2025-06-13',
    endDate: '2025-06-16',
    venue: 'Pinehurst No. 2',
    location: 'Pinehurst, NC',
    description: 'The U.S. Open, one of golf\'s four major championships, returns to Pinehurst No. 2. Known for its challenging conditions and demanding test of golf.',
    path: '/tournaments/us-open'
  },
  {
    id: 'open',
    name: 'The Open Championship',
    startDate: '2025-07-18',
    endDate: '2025-07-21',
    venue: 'Royal Troon Golf Club',
    location: 'Troon, Scotland',
    description: 'The Open Championship, one of golf\'s four major championships, returns to Royal Troon. Known for its links-style course and challenging weather conditions.',
    path: '/tournaments/open'
  },
  {
    id: 'tpc',
    name: 'The Players Championship',
    startDate: '2025-03-14',
    endDate: '2025-03-17',
    venue: 'TPC Sawgrass',
    location: 'Ponte Vedra Beach, FL',
    description: 'The Players Championship, often referred to as the \'fifth major\', is one of the most prestigious events in professional golf. Held annually at TPC Sawgrass, this tournament features the strongest field in golf and is known for its challenging Stadium Course, particularly the iconic 17th hole island green.',
    path: '/tournaments/tpc'
  }
];

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
  const [tournamentResults, setTournamentResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  
  // Find the tournament ID from the TOURNAMENTS array
  const tournament = TOURNAMENTS.find(t => t.name === name);
  const tournamentId = tournament ? tournament.id : null;
  
  // Map tournament IDs to their numeric IDs in the API
  const tournamentIdMap = {
    'masters': '628',
    'pga': '629',
    'us-open': '630',
    'open': '642',
    'tpc': '654'
  };
  
  const apiTournamentId = tournamentId ? tournamentIdMap[tournamentId] : null;

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
  const isCompleted = today > tournamentEnd;

  console.log('Tournament status:', {
    name,
    today: today.toISOString(),
    startDate: tournamentStart.toISOString(),
    endDate: tournamentEnd.toISOString(),
    daysUntilStart,
    isActive,
    isWithin14Days,
    isFuture,
    isCompleted,
    hasOddsData: !!oddsData,
    tournamentId,
    apiTournamentId,
    rawDates: {
      today: today.toString(),
      start: tournamentStart.toString(),
      end: tournamentEnd.toString()
    }
  });

  // Fetch tournament results if the tournament is completed
  useEffect(() => {
    const fetchResults = async () => {
      if (isCompleted && apiTournamentId) {
        setLoadingResults(true);
        setResultsError(null);
        
        try {
          console.log(`Fetching results for tournament ${name} with ID ${apiTournamentId}`);
          const response = await fetch(`/api/field?tournament=${apiTournamentId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch results: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Tournament results data:', data);
          
          // Check if we have valid results data
          if (data && Array.isArray(data) && data.length > 0) {
            // Check if the data contains position information
            const hasPositionData = data.some(player => 
              player.Position !== undefined && player.Position !== null
            );
            
            if (hasPositionData) {
              // Sort by position
              const sortedData = [...data].sort((a, b) => {
                const posA = a.Position || 999;
                const posB = b.Position || 999;
                return posA - posB;
              });
              setTournamentResults(sortedData);
            } else {
              // If no position data, just use the data as is
              setTournamentResults(data);
            }
          } else {
            setResultsError('No results data available');
          }
        } catch (error) {
          console.error('Error fetching tournament results:', error);
          setResultsError('Failed to load tournament results');
        } finally {
          setLoadingResults(false);
        }
      }
    };
    
    fetchResults();
  }, [isCompleted, name, apiTournamentId]);

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
          ) : isCompleted ? (
            <div className="results-section">
              <h3>Final Results</h3>
              {loadingResults ? (
                <div className="loading">Loading tournament results...</div>
              ) : resultsError ? (
                <div className="error">Error loading results: {resultsError}</div>
              ) : tournamentResults && tournamentResults.length > 0 ? (
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Player</th>
                        <th>Country</th>
                        <th>Score</th>
                        <th>Rounds</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentResults.map((player, index) => (
                        <tr key={player.PlayerID || index}>
                          <td>{player.Position || 'TBD'}</td>
                          <td>{player.Name || 'Unknown'}</td>
                          <td>{player.Country || 'Unknown'}</td>
                          <td>
                            {player.TotalScore !== undefined && player.TotalScore !== null 
                              ? player.TotalScore 
                              : player.Rounds && player.Rounds.length > 0 
                                ? player.Rounds.reduce((sum, round) => sum + (round.Score || 0), 0) 
                                : '-'}
                          </td>
                          <td>
                            {player.Rounds && player.Rounds.length > 0 
                              ? player.Rounds.map((round, i) => round.Score || '-').join(' | ') 
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-results">
                  <p>No results available for this tournament</p>
                </div>
              )}
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
        <aside className="weather-sidebar">
          {weather ? (
            <div className="weather-card">
              <h3>Weather Forecast</h3>
              <div className="weather-location">
                {weather.location.name}, {weather.location.region}
              </div>
              <div className="weather-forecast">
                {weather.forecast.forecastday.map((day, index) => (
                  <div key={index} className="weather-day">
                    <div className="weather-date">
                      {index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="weather-icon">
                      <img src={day.day.condition.icon} alt={day.day.condition.text} />
                    </div>
                    <div className="weather-temp">
                      {Math.round(day.day.avgtemp_c)}°C / {Math.round(day.day.avgtemp_f)}°F
                    </div>
                    <div className="weather-condition">
                      {day.day.condition.text}
                    </div>
                    <div className="weather-details">
                      <div>Wind: {day.day.maxwind_kph} km/h</div>
                      <div>Precip: {day.day.totalprecip_mm} mm</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="weather-placeholder">
              <p>Weather information will be available closer to the tournament</p>
            </div>
          )}
        </aside>
      </div>

      {/* Other Tournaments Section */}
      <div className="other-tournaments">
        <h2>Other Tournaments</h2>
        <div className="tournaments-grid">
          {TOURNAMENTS.map(tournament => {
            const startDate = new Date(tournament.startDate);
            const endDate = new Date(tournament.endDate);
            const now = new Date();
            const isCompleted = now > endDate;
            const isUpcoming = now < startDate;
            const isCurrent = name === tournament.name;
            
            return (
              <Link 
                key={tournament.id} 
                to={tournament.path} 
                className={`tournament-card ${isUpcoming ? 'upcoming' : ''} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <h3>{tournament.name}</h3>
                <div className="tournament-details">
                  <p className="dates">
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </p>
                  <p className="location">
                    {tournament.venue} • {tournament.location}
                  </p>
                </div>
                <p className="description">{tournament.description}</p>
                <span className="view-tournament">
                  {isCompleted ? 'View Results' : 'View Tournament'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BaseTournamentPage; 