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
    id: '628',
    name: 'The Masters Tournament',
    startDate: '2025-04-11',
    endDate: '2025-04-14',
    venue: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    description: 'The Masters Tournament, one of golf\'s four major championships, is held annually at Augusta National Golf Club. Known for its iconic green jacket, Amen Corner, and the pristine beauty of its course.',
    path: '/tournaments/masters'
  },
  {
    id: '629',
    name: 'PGA Championship',
    startDate: '2025-05-16',
    endDate: '2025-05-19',
    venue: 'Valhalla Golf Club',
    location: 'Louisville, KY',
    description: 'The PGA Championship, one of golf\'s four major championships, returns to Valhalla Golf Club. Known for its challenging layout and dramatic finishes.',
    path: '/tournaments/pga'
  },
  {
    id: '630',
    name: 'U.S. Open',
    startDate: '2025-06-13',
    endDate: '2025-06-16',
    venue: 'Pinehurst No. 2',
    location: 'Pinehurst, NC',
    description: 'The U.S. Open, one of golf\'s four major championships, returns to Pinehurst No. 2. Known for its challenging conditions and demanding test of golf.',
    path: '/tournaments/us-open'
  },
  {
    id: '642',
    name: 'The Open Championship',
    startDate: '2025-07-18',
    endDate: '2025-07-21',
    venue: 'Royal Troon Golf Club',
    location: 'Troon, Scotland',
    description: 'The Open Championship, one of golf\'s four major championships, returns to Royal Troon. Known for its links-style course and challenging weather conditions.',
    path: '/tournaments/open'
  }
];

// Add TPC as a past tournament
const pastTournaments = [
  {
    id: '653',
    name: 'The Players Championship',
    startDate: '2025-03-14',
    endDate: '2025-03-17',
    venue: 'TPC Sawgrass',
    location: 'Ponte Vedra Beach, FL',
    description: 'The Players Championship, often referred to as the \'fifth major\', is one of the most prestigious events in professional golf. Held annually at TPC Sawgrass, this tournament features the strongest field in golf and is known for its challenging Stadium Course, particularly the iconic 17th hole island green.',
    path: '/tournaments/tpc',
    isCompleted: true
  }
];

const TournamentsPage = () => {
  const [weather, setWeather] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [nextTournament, setNextTournament] = useState(null);
  const [field, setField] = useState([]);
  const [odds, setOdds] = useState({});
  const [tournamentStarted, setTournamentStarted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Find the next tournament
        const now = new Date();
        const allTournaments = [...tournaments, ...pastTournaments];
        
        // Sort tournaments by start date
        const sortedTournaments = allTournaments.sort((a, b) => 
          new Date(a.startDate) - new Date(b.startDate)
        );
        
        // Find the next tournament
        const next = sortedTournaments.find(t => new Date(t.startDate) > now);
        setNextTournament(next || sortedTournaments[0]);

        // Check if tournament has started
        if (next) {
          const startDate = new Date(next.startDate);
          setTournamentStarted(now >= startDate);
        }

        // If the next tournament is not completed, fetch its weather and field/leaderboard
        if (next && !next.isCompleted) {
          const weatherUrl = `/api/weather?location=${encodeURIComponent(next.location)}`;
          console.log('Attempting to fetch weather from:', weatherUrl);
          
          const weatherResponse = await fetch(weatherUrl);
          console.log('Weather response status:', weatherResponse.status);
          
          if (weatherResponse.ok) {
            const weatherText = await weatherResponse.text();
            console.log('Raw weather response:', weatherText);
            try {
              const weatherData = JSON.parse(weatherText);
              setWeather(weatherData);
            } catch (parseError) {
              console.error('Error parsing weather data:', parseError);
            }
          }

          // Fetch field or leaderboard data based on tournament status
          if (!tournamentStarted) {
            // Fetch field data
            const fieldUrl = `/api/field?tournament=${next.id}`;
            console.log('Attempting to fetch field from:', fieldUrl);
            const fieldResponse = await fetch(fieldUrl);
            console.log('Field response status:', fieldResponse.status);

            if (fieldResponse.ok) {
              const fieldText = await fieldResponse.text();
              console.log('Raw field response:', fieldText);
              try {
                const fieldData = JSON.parse(fieldText);
                console.log('Parsed field data:', fieldData);
                setField(fieldData);
              } catch (parseError) {
                console.error('Error parsing field data:', parseError);
              }
            }

            // Fetch odds data
            const oddsUrl = `/api/odds?tournament=${next.id}`;
            console.log('Attempting to fetch odds from:', oddsUrl);
            const oddsResponse = await fetch(oddsUrl);
            console.log('Odds response status:', oddsResponse.status);

            if (oddsResponse.ok) {
              const oddsText = await oddsResponse.text();
              console.log('Raw odds response:', oddsText);
              try {
                const oddsData = JSON.parse(oddsText);
                console.log('Parsed odds data:', oddsData);
                // Convert array of odds to object keyed by player name
                const oddsMap = {};
                oddsData.odds.forEach(odd => {
                  oddsMap[odd.name] = odd.odds;
                });
                setOdds(oddsMap);
              } catch (parseError) {
                console.error('Error parsing odds data:', parseError);
              }
            }
          } else {
            // Fetch leaderboard data
            const leaderboardUrl = `/api/golf?endpoint=leaderboard&tournament=${next.id}`;
            console.log('Attempting to fetch leaderboard from:', leaderboardUrl);
            const leaderboardResponse = await fetch(leaderboardUrl);
            console.log('Leaderboard response status:', leaderboardResponse.status);

            if (leaderboardResponse.ok) {
              const leaderboardText = await leaderboardResponse.text();
              console.log('Raw leaderboard response:', leaderboardText);
              try {
                const leaderboardData = JSON.parse(leaderboardText);
                console.log('Parsed leaderboard data:', leaderboardData);
                setLeaderboard(leaderboardData);
              } catch (parseError) {
                console.error('Error parsing leaderboard data:', parseError);
              }
            }
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
  }, [tournamentStarted]);

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
      {/* Featured Tournament Section */}
      {nextTournament && (
        <div className="featured-tournament">
          <div className="tournament-header">
            <h2>{nextTournament.name}</h2>
            <div className="tournament-details">
              <p className="dates">
                {formatDate(nextTournament.startDate)} - {formatDate(nextTournament.endDate)}
              </p>
              <p className="location">
                {nextTournament.venue} • {nextTournament.location}
              </p>
            </div>
            <div className="tournament-description">
              {nextTournament.description}
            </div>
          </div>

          {/* Main Content Area with Weather Sidebar */}
          <div className="main-content">
            {/* Field or Leaderboard Section */}
            {!tournamentStarted ? (
              <section className="field-section">
                <h2>Tournament Field</h2>
                {field.length > 0 ? (
                  <div className="field-info">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {field
                        .sort((a, b) => {
                          const oddsA = odds[a.Name] ? parseFloat(odds[a.Name]) : Infinity;
                          const oddsB = odds[b.Name] ? parseFloat(odds[b.Name]) : Infinity;
                          if (oddsA === Infinity && oddsB === Infinity) {
                            return a.Name.localeCompare(b.Name);
                          }
                          return oddsA - oddsB;
                        })
                        .slice(0, showAllPlayers ? field.length : 30)
                        .map((player) => (
                        <div key={player.PlayerID} className="bg-white rounded-lg shadow p-4">
                          <div className="flex items-center space-x-4">
                            {player.PhotoURI && (
                              <img 
                                src={player.PhotoURI} 
                                alt={player.Name}
                                className="w-16 h-16 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-900">{player.Name}</div>
                              <div className="text-gray-600">{player.Country || 'N/A'}</div>
                              {odds[player.Name] && (
                                <div className="text-sm text-blue-600 font-medium">
                                  Odds: {odds[player.Name]}:1
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {field.length > 30 && (
                      <button
                        onClick={() => setShowAllPlayers(!showAllPlayers)}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                      >
                        {showAllPlayers ? 'Show Less' : `View All Players (${field.length})`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">Field information unavailable</div>
                )}
              </section>
            ) : (
              <section className="leaderboard-section">
                <h2>Tournament Leaderboard</h2>
                {leaderboard ? (
                  <div className="leaderboard-info">
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Rank</th>
                            <th className="px-4 py-2 text-left">Player</th>
                            <th className="px-4 py-2 text-center">Total</th>
                            <th className="px-4 py-2 text-center">Today</th>
                            <th className="px-4 py-2 text-center">Thru</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard.map((player) => (
                            <tr key={player.PlayerID} className="border-t">
                              <td className="px-4 py-2">{getDisplayRank(player.Rank, leaderboard)}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center space-x-2">
                                  <span>{player.Name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">{player.TotalScore}</td>
                              <td className="px-4 py-2 text-center">{player.TodayScore}</td>
                              <td className="px-4 py-2 text-center">{player.HoleNumber || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Leaderboard information unavailable</div>
                )}
              </section>
            )}

            {/* Weather Section */}
            <section className="weather-section">
              <h2>Current Conditions</h2>
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
      )}

      {/* Tournaments Grid */}
      <div className="other-tournaments">
        <h2>Tournaments</h2>
        <div className="tournaments-grid">
          {[...pastTournaments, ...tournaments].map(tournament => {
            const startDate = new Date(tournament.startDate);
            const endDate = new Date(tournament.endDate);
            const now = new Date();
            const isCompleted = tournament.isCompleted || now > endDate;
            const isUpcoming = now < startDate;
            const isNext = nextTournament && tournament.id === nextTournament.id;
            
            return (
              <Link 
                key={tournament.id} 
                to={tournament.path} 
                className={`tournament-card ${isUpcoming ? 'upcoming' : ''} ${isCompleted ? 'completed' : ''} ${isNext ? 'next' : ''}`}
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

export default TournamentsPage; 