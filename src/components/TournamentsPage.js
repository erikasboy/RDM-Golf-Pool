import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const tournaments = [
  {
    id: 'next-weekend',
    name: 'Valspar Championship',
    startDate: '2025-03-21',
    endDate: '2025-03-24',
    venue: 'Innisbrook Resort',
    location: 'Palm Harbor, FL',
    description: 'The Valspar Championship is played on the Copperhead Course at Innisbrook Resort, known for its challenging layout and the famous "Snake Pit" finishing holes.',
    path: '/tournaments/next-weekend'
  },
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
    description: 'The Open Championship, golf\'s oldest major, returns to Royal Troon. Known for its challenging links layout and unpredictable weather conditions.',
    path: '/tournaments/open'
  }
];

const TournamentsPage = () => {
  const [weather, setWeather] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch TPC Sawgrass leaderboard
        const leaderboardUrl = `https://api.sportsdata.io/golf/v2/json/LeaderboardBasic/654?key=${process.env.REACT_APP_SPORTDATA_API_KEY}`;
        const leaderboardResponse = await fetch(leaderboardUrl);
        if (!leaderboardResponse.ok) {
          throw new Error(`Failed to fetch leaderboard data: ${leaderboardResponse.status}`);
        }
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData);

        // Fetch weather data for TPC Sawgrass
        if (process.env.REACT_APP_WEATHER_API_KEY) {
          const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.REACT_APP_WEATHER_API_KEY}&q=Ponte%20Vedra%20Beach,FL&days=3&aqi=no`;
          const weatherResponse = await fetch(weatherUrl);
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            setWeather(weatherData);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch tournament data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDisplayRank = (rank, players) => {
    const rankCount = players.filter(p => p.Rank === rank).length;
    return rankCount > 1 ? `T${rank}` : rank;
  };

  if (loading) {
    return <div className="loading">Loading tournament information...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="tournaments-page">
      <h1>Tournaments</h1>
      
      {/* Featured Tournament Section - TPC Sawgrass */}
      <div className="featured-tournament">
        <div className="tournament-header">
          <h2>The Players Championship</h2>
          <div className="tournament-details">
            <p className="dates">
              {formatDate('2025-03-14')} - {formatDate('2025-03-17')}
            </p>
            <p className="location">
              TPC Sawgrass • Ponte Vedra Beach, FL
            </p>
          </div>
          <div className="tournament-description">
            The Players Championship, often referred to as the 'fifth major', is one of the most prestigious events in professional golf. Held annually at TPC Sawgrass, this tournament features the strongest field in golf and is known for its challenging Stadium Course, particularly the iconic 17th hole island green.
          </div>
        </div>

        {/* Main Content Area with Leaderboard and Weather Sidebar */}
        <div className="main-content">
          {/* Leaderboard Section */}
          <section className="leaderboard-section">
            <h2>Current Leaderboard</h2>
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
                        .map(player => {
                          const toPar = player.TotalScore || 0;
                          const totalStrokes = player.TotalStrokes || 0;
                          const through = player.TotalThrough || 'F';
                          
                          return (
                            <tr key={player.PlayerTournamentID}>
                              <td>{getDisplayRank(player.Rank, leaderboard.Players)}</td>
                              <td>{player.Name || 'Unknown'}</td>
                              <td>{toPar >= 0 ? '+' : ''}{toPar}</td>
                              <td>{through}</td>
                              <td>{totalStrokes}</td>
                              {[0, 1, 2, 3].map((index) => (
                                <td key={index}>{player.Rounds?.[index]?.Score || '-'}</td>
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
            <h2>Weather Conditions</h2>
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

      {/* Other Tournaments Grid */}
      <div className="other-tournaments">
        <h2>Upcoming Tournaments</h2>
        <div className="tournaments-grid">
          {tournaments.map(tournament => {
            const startDate = new Date(tournament.startDate);
            const isUpcoming = new Date() < startDate;
            
            return (
              <Link 
                key={tournament.id} 
                to={tournament.path} 
                className={`tournament-card ${isUpcoming ? 'upcoming' : ''}`}
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
                  View Tournament
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage; 