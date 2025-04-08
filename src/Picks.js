import React, { useState, useEffect } from "react";
import { db, auth, getCurrentTournament } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { addTestPicks } from "./setupTestData";

const Picks = () => {
  console.log("Picks component rendering");
  const [user, setUser] = useState(null);
  const [golfers, setGolfers] = useState([]);
  const [selectedGolfers, setSelectedGolfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournamentLocked, setTournamentLocked] = useState(false);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [usedGolfers, setUsedGolfers] = useState([]);
  const [oddsData, setOddsData] = useState({});
  const [sortOption, setSortOption] = useState('firstNameAsc');

  // Calculate odds whenever golfers data changes
  useEffect(() => {
    console.log('Odds calculation effect running with golfers:', golfers.length);
    if (!golfers.length) return;

    // Log a sample of golfers data
    console.log('First few golfers:', golfers.slice(0, 3).map(g => ({
      name: g.Name,
      odds: g.OddsToWin || g.Odds || g.OddsWin,
      moneyLine: g.MoneyLine
    })));

    // Transform the data into a more usable format
    const transformedOdds = {};
    
    golfers.forEach(player => {
      if (player.Name) {
        // Try to get actual odds from various possible fields
        const odds = player.OddsToWin || player.Odds || player.OddsWin;
        if (odds) {
          transformedOdds[player.Name] = {
            h2h: Math.round(odds),
            oddsDescription: `${Math.round(odds)}:1`
          };
        } else if (player.MoneyLine) {
          // Convert moneyline to decimal odds if that's what we have
          const moneyLine = parseInt(player.MoneyLine);
          if (!isNaN(moneyLine)) {
            const odds = moneyLine > 0 ? Math.round(moneyLine / 100) : Math.round(100 / Math.abs(moneyLine));
            transformedOdds[player.Name] = {
              h2h: odds,
              oddsDescription: `${odds}:1`
            };
          }
        } else if (player.FantasyPoints) {
          // Fallback to fantasy points with a more conservative formula
          const fantasyPoints = player.FantasyPoints || 0;
          const maxPoints = Math.max(...golfers.map(p => p.FantasyPoints || 0));
          const relativeStrength = fantasyPoints / maxPoints;
          // Much wider spread: favorites around 5:1, longshots up to 100:1
          const baseOdds = Math.round(Math.max(5, 100 * (1 - relativeStrength)));
          
          transformedOdds[player.Name] = {
            h2h: baseOdds,
            oddsDescription: `${baseOdds}:1`
          };
        }
      }
    });

    console.log('Calculated odds for players:', Object.keys(transformedOdds).length);
    console.log('Sample odds:', Object.entries(transformedOdds).slice(0, 3));
    setOddsData(transformedOdds);
  }, [golfers]);

  // Fetch golfers from API
  useEffect(() => {
    const fetchTournamentField = async () => {
      if (!currentTournament) {
        console.log("No current tournament set, skipping API call");
        return;
      }

      try {
        // First try to get the tournament schedule
        const scheduleUrl = `/api/golf?endpoint=/Tournaments/${new Date().getFullYear()}`;
        console.log("Fetching tournament schedule from:", scheduleUrl);
        
        const scheduleResponse = await fetch(scheduleUrl);
        console.log("Schedule response status:", scheduleResponse.status);

        if (!scheduleResponse.ok) {
          // If we can't get current year, try next year
          const nextYearUrl = `/api/golf?endpoint=/Tournaments/${new Date().getFullYear() + 1}`;
          console.log("Trying next year's schedule from:", nextYearUrl);
          
          const nextYearResponse = await fetch(nextYearUrl);
          console.log("Next year response status:", nextYearResponse.status);

          if (!nextYearResponse.ok) {
            throw new Error(`Schedule API error: ${nextYearResponse.status}`);
          }

          const tournaments = await nextYearResponse.json();
          console.log("Next year tournaments:", tournaments.slice(0, 2)); // Log first two tournaments
          return processTournaments(tournaments);
        }

        const tournaments = await scheduleResponse.json();
        console.log("Current year tournaments:", tournaments.slice(0, 2)); // Log first two tournaments
        return processTournaments(tournaments);

      } catch (error) {
        console.error("Error:", error.message);
        setError(error.message);
        setGolfers([]);
      } finally {
        setLoading(false);
      }
    };

    const processTournaments = async (tournaments) => {
      // Log all tournaments from the API with more detail
      console.log("All tournaments from API (detailed):", tournaments.map(t => ({
        name: t.Name,
        id: t.TournamentID,
        startDate: t.StartDate || t.Day,
        raw: t
      })));
      
      // Find the tournament by ID - convert both to numbers for comparison
      const matchingTournament = tournaments.find(t => t.TournamentID === Number(currentTournament.tournamentId));
      
      console.log("Looking for tournament:", {
        tournamentId: currentTournament.tournamentId,
        tournamentIdAsNumber: Number(currentTournament.tournamentId),
        ourTournamentName: currentTournament.name,
        tournamentIdType: typeof currentTournament.tournamentId,
        firstFewTournamentIds: tournaments.slice(0, 3).map(t => ({
          id: t.TournamentID,
          type: typeof t.TournamentID
        }))
      });

      if (!matchingTournament) {
        throw new Error(`No matching tournament found for ${currentTournament.name} (ID: ${currentTournament.tournamentId})`);
      }

      console.log("Found matching tournament:", {
        name: matchingTournament.Name,
        id: matchingTournament.TournamentID,
        start: matchingTournament.StartDate || matchingTournament.Day
      });
      
      // Try different API endpoints for players
      const endpoints = [
        `/api/field?tournament=${matchingTournament.TournamentID}`,
        `/api/golf?endpoint=/TournamentField/${matchingTournament.TournamentID}`,
        `/api/golf?endpoint=/Players/Tournament/${matchingTournament.TournamentID}`,
        `/api/golf?endpoint=/Leaderboard/${matchingTournament.TournamentID}`
      ];

      // Try each endpoint until we get a successful response
      for (const endpoint of endpoints) {
        try {
          console.log("Trying endpoint:", endpoint);
          
          const response = await fetch(endpoint);
          console.log("Response status:", response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log("Successfully fetched data from:", endpoint);
            
            // Check if data is an array or has a players property
            let players = [];
            if (Array.isArray(data)) {
              players = data;
            } else if (data.Players && Array.isArray(data.Players)) {
              players = data.Players;
            } else if (data.Tournament && data.Tournament.Players) {
              players = data.Tournament.Players;
            } else if (data.PlayerTournamentBasic && Array.isArray(data.PlayerTournamentBasic)) {
              players = data.PlayerTournamentBasic;
            }
            
            if (players.length > 0) {
              console.log(`Found ${players.length} players`);
              setGolfers(players);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching from endpoint:", endpoint, error);
          continue;
        }
      }

      // If we get here, none of the endpoints worked
      throw new Error("Failed to fetch tournament data from any endpoint");
    };

    setLoading(true);
    setError(null);
    fetchTournamentField();
  }, [currentTournament]);

  // Initialize tournament and user data
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      try {
        // Get current tournament without updating cache during development
        const tournament = await getCurrentTournament({ 
          updateCache: process.env.NODE_ENV === 'production'
        });
        
        if (!isMounted) return;

        if (!tournament) {
          setError("No upcoming tournaments found");
          setLoading(false);
          return;
        }

        console.log("Retrieved tournament:", tournament);
        setCurrentTournament(tournament);

        // Check if tournament is locked
        const lockTime = new Date(tournament.lockTime);
        const isLocked = new Date() > lockTime;
        setTournamentLocked(isLocked);

        // Get user and their picks
        const currentUser = auth.currentUser;
        if (currentUser && isMounted) {
          console.log("Loading picks for user:", currentUser.uid);
          setUser(currentUser);
          
          try {
            // Get all user's picks for the year
            const picksRef = collection(db, 'users', currentUser.uid, 'picks');
            const picksSnapshot = await getDocs(picksRef);
            
            if (!isMounted) return;

            console.log("Retrieved picks snapshot:", picksSnapshot.size, "documents");
            
            const usedGolferIds = new Set();
            picksSnapshot.forEach(doc => {
              console.log("Processing picks document:", doc.id);
              const picks = doc.data().golfers || [];
              console.log("Golfers in document:", picks.length);
              picks.forEach(golfer => usedGolferIds.add(golfer.PlayerID));
            });
            
            const usedGolferArray = Array.from(usedGolferIds);
            console.log("Setting usedGolfers:", usedGolferArray);
            setUsedGolfers(usedGolferArray);

            // Get picks for current tournament
            const tournamentPicksRef = doc(db, 'users', currentUser.uid, 'picks', tournament.id);
            const tournamentPicks = await getDoc(tournamentPicksRef);
            
            if (!isMounted) return;

            if (tournamentPicks.exists()) {
              const currentPicks = tournamentPicks.data().golfers || [];
              setSelectedGolfers(currentPicks);
            }
          } catch (error) {
            if (isMounted) {
              console.error("Error fetching user picks:", error);
              setError("Failed to load your picks");
            }
          }
        } else if (isMounted) {
          setError("Please log in to make picks");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error:", error.message);
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setError(null);
    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle golfer selection
  const handleGolferSelection = (golfer) => {
    console.log("Attempting to select golfer:", golfer);
    console.log("Current usedGolfers:", usedGolfers.map(String));
    
    const golferId = String(golfer.PlayerID || golfer.PlayerId);
    console.log("Golfer being selected:", {
      name: golfer.Name,
      id: golferId,
      rawId: golfer.PlayerID || golfer.PlayerId,
      usedGolfers: usedGolfers
    });
    
    const isUsed = usedGolfers.some(id => {
      const match = String(id) === golferId;
      console.log(`Comparing ${id} (${typeof id}) with ${golferId} (${typeof golferId}): ${match}`);
      return match;
    });
    
    console.log("Is golfer used?", isUsed, "ID:", golferId);

    if (tournamentLocked) {
      alert("Tournament picks are locked!");
      return;
    }

    if (selectedGolfers.length >= 4) {
      alert("You can only select 4 golfers.");
      return;
    }

    if (selectedGolfers.some((g) => String(g.PlayerID || g.PlayerId) === golferId)) {
      alert("You've already selected this golfer for this tournament.");
      return;
    }

    if (isUsed) {
      alert("You've already used this golfer in a previous tournament this year.");
      return;
    }

    setSelectedGolfers([...selectedGolfers, golfer]);
  };

  // Handle submission of picks
  const handleSubmitPicks = async () => {
    if (!currentTournament) {
      alert("No active tournament found.");
      return;
    }

    if (selectedGolfers.length !== 4) {
      alert("Please select exactly 4 golfers.");
      return;
    }

    try {
      // Save picks for the current tournament
      const tournamentPicksRef = doc(db, 'users', user.uid, 'picks', currentTournament.id);
      await setDoc(tournamentPicksRef, {
        golfers: selectedGolfers,
        timestamp: new Date(),
        tournamentId: currentTournament.id
      });

      // Update used golfers list
      setUsedGolfers([...usedGolfers, ...selectedGolfers.map(g => g.PlayerID)]);
      
      alert("Picks submitted successfully!");
    } catch (error) {
      console.error("Error submitting picks:", error);
      alert("Error submitting picks: " + error.message);
    }
  };

  // Function to clear a selected golfer
  const handleClearGolfer = (index) => {
    if (tournamentLocked) {
      alert("Tournament picks are locked!");
      return;
    }
    
    const newSelectedGolfers = [...selectedGolfers];
    newSelectedGolfers[index] = null;
    setSelectedGolfers(newSelectedGolfers);
  };

  // Function to sort golfers based on selected option
  const getSortedGolfers = () => {
    if (!golfers || golfers.length === 0) {
      return [];
    }
    
    return [...golfers].sort((a, b) => {
      switch (sortOption) {
        case 'firstNameAsc':
          return (a.Name || '').localeCompare(b.Name || '');
        case 'lastNameAsc':
          const getLastName = (name) => {
            const parts = (name || '').split(' ');
            return parts[parts.length - 1];
          };
          return getLastName(a.Name).localeCompare(getLastName(b.Name));
        case 'oddsAsc':
          const oddsA = oddsData[a.Name]?.h2h || Number.MAX_VALUE;
          const oddsB = oddsData[b.Name]?.h2h || Number.MAX_VALUE;
          return oddsA - oddsB;
        case 'oddsDesc':
          const oddsADesc = oddsData[a.Name]?.h2h || 0;
          const oddsBDesc = oddsData[b.Name]?.h2h || 0;
          return oddsBDesc - oddsADesc;
        default:
          return 0;
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-900 text-white p-4">
        <h2 className="text-red-500 text-xl">{error}</h2>
        <div className="mt-4 text-sm font-mono bg-green-800 p-4 rounded">
          <p>Current time (local): {new Date().toLocaleString()}</p>
          <p>Current time (UTC): {new Date().toUTCString()}</p>
          <p>Debug info:</p>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(currentTournament, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-900 text-white">
      {/* Responsive Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {/* Tournament Info */}
          <div className="mb-4 lg:mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">{currentTournament?.name}</h1>
            <p className="text-base lg:text-lg mb-4">
              {currentTournament && `${new Date(currentTournament.startDate).toLocaleDateString()} - ${new Date(currentTournament.endDate).toLocaleDateString()}`}
            </p>
            <div className="bg-green-800 p-3 lg:p-4 rounded-lg mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-xl font-bold mb-2">Instructions</h2>
              <ul className="list-disc list-inside text-sm lg:text-base">
                <li>Select exactly 4 golfers for this tournament</li>
                <li>Each golfer can only be used once per season</li>
                <li>Picks lock when the tournament begins</li>
              </ul>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mb-4">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full lg:w-auto bg-green-800 text-white px-4 py-2 rounded-lg border border-green-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="firstNameAsc">Sort by First Name</option>
              <option value="lastNameAsc">Sort by Last Name</option>
              <option value="oddsAsc">Sort by Odds (Favorites First)</option>
              <option value="oddsDesc">Sort by Odds (Longshots First)</option>
            </select>
          </div>

          {/* Golfers Grid - Responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
            {golfers && golfers.length > 0 ? (
              getSortedGolfers().map((golfer) => {
                const golferId = String(golfer.PlayerID || golfer.PlayerId);
                const isUsed = usedGolfers.some(id => String(id) === golferId);
                const isSelected = selectedGolfers.some(g => String(g.PlayerID || g.PlayerId) === golferId);
                
                return (
                  <div
                    key={golferId}
                    className={`bg-green-800 p-3 lg:p-4 rounded-lg shadow-lg ${isUsed ? 'opacity-50' : ''}`}
                  >
                    <h2 className="text-lg lg:text-xl font-bold">{golfer.Name}</h2>
                    {oddsData[golfer.Name] && (
                      <div className="text-xs lg:text-sm text-gray-300 mt-1">
                        {oddsData[golfer.Name].oddsDescription && (
                          <p>Odds to win: {oddsData[golfer.Name].oddsDescription}</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleGolferSelection(golfer)}
                      disabled={tournamentLocked || isUsed || isSelected}
                      className={`w-full bg-gold-500 text-green-900 px-3 lg:px-4 py-2 rounded-lg mt-2 text-sm lg:text-base ${
                        (tournamentLocked || isUsed || isSelected) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSelected ? "Selected" : isUsed ? "Already Used" : "Select Golfer"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-xl">No golfers available for this tournament.</p>
                <p className="text-sm mt-2">Please try again later or contact support if the issue persists.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Moves to bottom on mobile */}
        <div className="w-full lg:w-96 bg-green-800 p-4 lg:p-6 border-t lg:border-l lg:border-t-0 border-green-700">
          <div className="lg:sticky lg:top-0">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">Selected Golfers</h2>
            <div className="space-y-3 lg:space-y-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className={`bg-green-700 p-3 lg:p-4 rounded-lg ${
                    selectedGolfers[index] ? 'border-2 border-gold-500' : 'border-2 border-dashed border-green-600'
                  }`}
                >
                  {selectedGolfers[index] ? (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base lg:text-lg font-bold">{selectedGolfers[index].Name}</h3>
                          {oddsData[selectedGolfers[index].Name] && (
                            <div className="text-xs lg:text-sm text-gray-300 mt-1">
                              {oddsData[selectedGolfers[index].Name].oddsDescription && (
                                <p>Odds to win: {oddsData[selectedGolfers[index].Name].oddsDescription}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleClearGolfer(index)}
                          disabled={tournamentLocked}
                          className={`text-red-400 hover:text-red-300 ${tournamentLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-green-500 text-sm lg:text-base">Golfer slot {index + 1}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmitPicks}
              disabled={tournamentLocked || selectedGolfers.filter(Boolean).length !== 4}
              className={`w-full bg-gold-500 text-green-900 px-4 py-2 rounded-lg mt-4 text-sm lg:text-base ${
                (tournamentLocked || selectedGolfers.filter(Boolean).length !== 4) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Submit Picks
            </button>
            {tournamentLocked ? (
              <p className="text-red-500 mt-2 text-center text-sm lg:text-base">Picks locked for current tournament</p>
            ) : (
              <p className="text-green-500 mt-2 text-center text-sm lg:text-base">
                {4 - selectedGolfers.filter(Boolean).length} picks remaining
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Picks;