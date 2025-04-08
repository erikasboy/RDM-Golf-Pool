import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db, getCurrentTournament, TOURNAMENTS } from '../firebase';
import { Link } from 'react-router-dom';
import './HomePage.css';
import PicksTable from './PicksTable';
import WeatherCard from './WeatherCard';

const MAJOR_TOURNAMENTS = [
  {
    id: 'masters',
    name: 'The Masters',
    date: 'April 11-14, 2024',
    location: 'Augusta National Golf Club',
    purse: '$18,000,000',
    description: 'The first major championship of the year, played at the iconic Augusta National.',
    status: 'upcoming'
  },
  {
    id: 'pga',
    name: 'PGA Championship',
    date: 'May 16-19, 2024',
    location: 'Valhalla Golf Club',
    purse: '$17,500,000',
    description: 'The second major of the year, featuring the strongest field in golf.',
    status: 'upcoming'
  },
  {
    id: 'us-open',
    name: 'U.S. Open',
    date: 'June 13-16, 2024',
    location: 'Pinehurst No. 2',
    purse: '$20,000,000',
    description: 'The ultimate test in golf, known for its challenging course setup.',
    status: 'upcoming'
  },
  {
    id: 'open-championship',
    name: 'The Open Championship',
    date: 'July 18-21, 2024',
    location: 'Royal Troon Golf Club',
    purse: '$16,500,000',
    description: 'The oldest major championship, steeped in tradition and history.',
    status: 'upcoming'
  },
  {
    id: 'tpc',
    name: 'The Players Championship',
    date: 'March 14-17, 2024',
    location: 'TPC Sawgrass',
    purse: '$25,000,000',
    description: 'The unofficial fifth major, featuring the iconic island green.',
    status: 'upcoming'
  }
];

const HomePage = () => {
  const [poolStandings, setPoolStandings] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [nextTournament, setNextTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [picks, setPicks] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');
        
        // Get current tournament
        console.log('Fetching current tournament...');
        const tournament = await getCurrentTournament();
        console.log('Current tournament result:', tournament);
        setCurrentTournament(tournament);

        // Find next tournament
        const now = new Date();
        const upcomingTournaments = Object.values(TOURNAMENTS)
          .filter(t => new Date(t.startDate) > now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        setNextTournament(upcomingTournaments[0] || null);

        // Get all users
        console.log('Fetching users...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log('Users snapshot:', usersSnapshot.size, 'documents found');
        
        const tpcPicks = {};
        const allUsers = [];
        const userScores = {};

        // Process each user
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          
          // Skip admin user
          if (userData.role === 'admin') {
            console.log('Skipping admin user:', userData.displayName);
            continue;
          }
          
          // Add user to list
          allUsers.push({
            id: userDoc.id,
            name: userData.displayName || userDoc.id
          });
          
          // Initialize user scores
          userScores[userData.displayName || userDoc.id] = {
            userId: userDoc.id,
            name: userData.displayName || userDoc.id,
            totalPoints: 0,
            'The Players Championship': 0,
            'The Masters': 0,
            'PGA Championship': 0,
            'U.S. Open': 0,
            'The Open Championship': 0
          };
          
          console.log('Processing user:', userData.displayName || userDoc.id);
          
          // Get user's picks
          const picksRef = collection(db, 'users', userDoc.id, 'picks');
          const picksSnapshot = await getDocs(picksRef);
          
          // Find TPC picks
          for (const pickDoc of picksSnapshot.docs) {
            const pickData = pickDoc.data();
            console.log('Pick data for', userData.displayName || userDoc.id, ':', pickData);
            console.log('Tournament name:', pickData.tournamentName, 'Expected: The Players Championship');
            
            // Check for TPC picks with case-insensitive comparison
            if (pickData.tournamentName && 
                pickData.tournamentName.toLowerCase() === 'the players championship'.toLowerCase()) {
              
              // Check for picks in different possible property names
              const picksArray = pickData.picks || pickData.golfers || [];
              console.log('Found TPC picks for', userData.displayName || userDoc.id, ':', picksArray);
              
              if (picksArray.length > 0) {
                tpcPicks[userData.displayName || userDoc.id] = picksArray;
              }
            } else {
              console.log('Not TPC picks for', userData.displayName || userDoc.id, 'Tournament name:', pickData.tournamentName);
            }
          }
        }

        console.log('Final TPC picks:', tpcPicks);
        setPicks(tpcPicks);
        setUsers(allUsers);
        
        // Fetch TPC tournament results
        console.log('Fetching TPC tournament results...');
        const tpcId = getTournamentId('The Players Championship');
        if (tpcId) {
          try {
            const response = await fetch(`http://localhost:3001/api/golf?endpoint=/LeaderboardBasic/${tpcId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch TPC results: ${response.status}`);
            }
            const tpcResults = await response.json();
            console.log('TPC results:', tpcResults);
            
            // Calculate points for TPC picks
            if (tpcResults && tpcResults.Players && tpcResults.Players.length > 0) {
              // Sort results by rank
              const sortedResults = [...tpcResults.Players].sort((a, b) => a.Rank - b.Rank);
              console.log('Sorted results (first 5):', sortedResults.slice(0, 5).map(p => ({ name: p.Name, rank: p.Rank })));
              
              // Calculate points for each user's picks
              Object.entries(tpcPicks).forEach(([userName, userPicks]) => {
                let tournamentPoints = 0;
                const playerResults = {};
                
                userPicks.forEach(pick => {
                  const playerName = pick.name || pick;
                  console.log('Checking pick:', playerName);
                  const playerResult = sortedResults.find(p => p.Name === playerName);
                  
                  // Special case for Jason Day - log detailed information
                  if (playerName === 'Jason Day') {
                    console.log('JASON DAY DETAILS:', playerResult);
                    console.log('Status:', playerResult?.Status);
                    console.log('Rank:', playerResult?.Rank);
                    console.log('Position:', playerResult?.Position);
                    console.log('Raw data:', JSON.stringify(playerResult));
                  }
                  
                  console.log('Player result:', playerResult ? { name: playerResult.Name, rank: playerResult.Rank } : 'Not found');
                  
                  if (playerResult) {
                    // Points calculation based on finish position
                    let points = 0;
                    
                    // Check player status
                    const playerStatus = playerResult.Status || '';
                    const isWithdrawn = playerResult.IsWithdrawn === true || 
                                       playerStatus.toLowerCase().includes('withdrawn') || 
                                       playerStatus.toLowerCase().includes('withdrawal');
                    
                    // Special case for Jason Day - treat as withdrawal
                    const isJasonDay = playerName === 'Jason Day';
                    
                    // Check if player missed the cut (rank is null or undefined)
                    if (playerResult.Rank === null || playerResult.Rank === undefined) {
                      if (isWithdrawn || isJasonDay) {
                        // Check if withdrawal happened before tournament started
                        // This is a simplification - ideally this would be checked against tournament start date
                        // For now, we'll assume withdrawals with no rank are pre-tournament
                        points = 0; // 0 points for pre-tournament withdrawal
                        console.log(`${playerName} withdrew before tournament: 0 points`);
                      } else {
                        points = -2; // -2 points for missed cut
                        console.log(`${playerName} missed the cut: -2 points`);
                      }
                    } else if (isWithdrawn || isJasonDay) {
                      // Player withdrew after making the cut
                      points = 0; // 0 points for post-cut withdrawal
                      console.log(`${playerName} withdrew after making cut: 0 points`);
                    } else {
                      // Points based on finish position
                      if (playerResult.Rank === 1) points = 10;      // Champion
                      else if (playerResult.Rank === 2) points = 7;  // 2nd place
                      else if (playerResult.Rank === 3) points = 6;  // 3rd place
                      else if (playerResult.Rank === 4) points = 5;  // 4th place
                      else if (playerResult.Rank === 5) points = 4;  // 5th place
                      else if (playerResult.Rank <= 10) points = 3;  // 6th-10th place
                      else if (playerResult.Rank <= 20) points = 2;  // 11th-20th place
                      else if (playerResult.Rank <= 30) points = 1;  // 21st-30th place
                      else points = 0;                               // 31st-40th place
                    }
                    
                    tournamentPoints += points;
                    playerResults[playerName] = {
                      rank: playerResult.Rank,
                      points: points,
                      missedCut: playerResult.Rank === null || playerResult.Rank === undefined,
                      status: playerStatus,
                      isWithdrawn: isWithdrawn || isJasonDay
                    };
                    
                    console.log('Points after this pick:', tournamentPoints);
                  } else {
                    // Player not found in results (might be a different spelling or name)
                    console.log(`${playerName} not found in tournament results`);
                    playerResults[playerName] = {
                      rank: null,
                      points: 0,
                      missedCut: false,
                      notFound: true
                    };
                  }
                });
                
                // Update user scores
                userScores[userName]['The Players Championship'] = tournamentPoints;
                userScores[userName].totalPoints += tournamentPoints;
                userScores[userName].playerResults = playerResults;
              });
            }
          } catch (error) {
            console.error('Error fetching TPC results:', error);
          }
        }
        
        // Convert userScores object to array and sort by total points
        const standings = Object.values(userScores).sort((a, b) => b.totalPoints - a.totalPoints);
        console.log('Final standings:', standings);
        setPoolStandings(standings);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to fetch data: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to get tournament ID from name
  const getTournamentId = (tournamentName) => {
    const tournamentMap = {
      'The Players Championship': '654',
      'The Masters': '628',
      'PGA Championship': '629',
      'U.S. Open': '630',
      'The Open Championship': '642'
    };
    
    return tournamentMap[tournamentName] || null;
  };

  // Helper function to check if a tournament is a major or TPC
  const isMajorOrTPC = (tournamentName) => {
    const majorTournaments = [
      'The Players Championship',
      'The Masters',
      'PGA Championship',
      'U.S. Open',
      'The Open Championship'
    ];
    
    return majorTournaments.includes(tournamentName);
  };

  // Helper function to calculate points based on picks and results
  const calculatePoints = (picks, results) => {
    let points = 0;
    
    // Sort results by rank
    const sortedResults = [...results].sort((a, b) => a.Rank - b.Rank);
    console.log('Sorted results (first 5):', sortedResults.slice(0, 5).map(p => ({ name: p.Name, rank: p.Rank })));
    
    // Calculate points for each pick
    picks.forEach((pick, index) => {
      console.log('Checking pick:', pick);
      const playerResult = sortedResults.find(p => p.Name === pick);
      console.log('Player result:', playerResult ? { name: playerResult.Name, rank: playerResult.Rank } : 'Not found');
      
      if (playerResult) {
        // Points calculation based on finish position
        if (playerResult.Rank === 1) points += 10;
        else if (playerResult.Rank <= 5) points += 7;
        else if (playerResult.Rank <= 10) points += 5;
        else if (playerResult.Rank <= 20) points += 3;
        else if (playerResult.Rank <= 30) points += 2;
        else if (playerResult.Rank <= 40) points += 1;
        
        console.log('Points after this pick:', points);
      }
    });
    
    return points;
  };

  if (loading) {
    return <div className="loading">Loading standings...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const displayTournament = currentTournament?.isActive ? currentTournament : nextTournament;

  // Add CSS for pick points
  const pickPointsStyle = document.createElement('style');
  pickPointsStyle.textContent = `
    .pick-points {
      font-size: 0.8em;
      color: #666;
      margin-top: 4px;
    }
  `;
  document.head.appendChild(pickPointsStyle);

  return (
    <div className="home-page">
      {/* Tournament Info Section */}
      {displayTournament && (
        <div className="tournament-info-section">
          <div className="tournament-info-content">
            <h2>{currentTournament?.isActive ? 'Current Tournament' : 'Next Up'}: {displayTournament.name}</h2>
            <div className="tournament-details">
              <p className="dates">
                {new Date(displayTournament.startDate).toLocaleDateString()} - {new Date(displayTournament.endDate).toLocaleDateString()}
              </p>
              <p className="location">{displayTournament.course}</p>
            </div>
            <div className="tournament-description">
              {displayTournament.description}
            </div>
          </div>
          <div className="weather-placeholder">
            <h3>Current Conditions</h3>
            <WeatherCard location={displayTournament.course} />
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="standings-section">
        <h3>Leaderboard</h3>
        <div className="standings-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th className="player-column">Player</th>
                <th>Total Points</th>
                {!isMobile && (
                  <>
                    <th>TPC</th>
                    <th>Masters</th>
                    <th>PGA</th>
                    <th>USO</th>
                    <th>The Open</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {poolStandings.length === 0 ? (
                <tr>
                  <td colSpan={isMobile ? 3 : 8} style={{ textAlign: 'center' }}>No standings available</td>
                </tr>
              ) : (
                poolStandings.map((standing, index) => (
                  <tr key={standing.userId}>
                    <td>{index + 1}</td>
                    <td className="player-column">{standing.name}</td>
                    <td>{standing.totalPoints}</td>
                    {!isMobile && (
                      <>
                        <td>{standing['The Players Championship']}</td>
                        <td>{standing['The Masters']}</td>
                        <td>{standing['PGA Championship']}</td>
                        <td>{standing['U.S. Open']}</td>
                        <td>{standing['The Open Championship']}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tournament Links */}
      <div className="tournament-links">
        <h3 className="section-heading">Tournaments</h3>
        <div className="tournaments-grid">
          {MAJOR_TOURNAMENTS.map((tournament) => (
            <Link 
              key={tournament.id} 
              to={`/tournaments/${tournament.id}`}
              className="tournament-card"
            >
              <h3>{tournament.name}</h3>
              <div className="tournament-details">
                <p className="dates">
                  {tournament.date}
                </p>
                <p className="location">{tournament.location}</p>
                <p className="purse">Purse: {tournament.purse}</p>
              </div>
              <p className="description">{tournament.description}</p>
              <div className="betting-odds-placeholder">
                <p>Betting odds coming soon...</p>
              </div>
              <span className="view-tournament">
                View Tournament
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 