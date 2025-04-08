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
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

        // Initialize selectedGolfers with empty slots
        setSelectedGolfers([null, null, null, null]);

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
              // Only load picks if they exist and the tournament isn't locked
              if (currentPicks.length > 0 && !isLocked) {
                setSelectedGolfers(currentPicks);
              }
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

    // Count non-null selected golfers
    const selectedCount = selectedGolfers.filter(Boolean).length;
    
    if (selectedCount >= 4) {
      alert("You can only select 4 golfers.");
      return;
    }

    if (selectedGolfers.some((g) => g && String(g.PlayerID || g.PlayerId) === golferId)) {
      alert("You've already selected this golfer for this tournament.");
      return;
    }

    if (isUsed) {
      alert("You've already used this golfer in a previous tournament this year.");
      return;
    }

    // Find the first null slot or add to the end
    const newSelectedGolfers = [...selectedGolfers];
    const nullIndex = newSelectedGolfers.findIndex(g => g === null);
    
    if (nullIndex !== -1) {
      // Replace the null slot
      newSelectedGolfers[nullIndex] = golfer;
    } else {
      // Add to the end if no null slots
      newSelectedGolfers.push(golfer);
    }
    
    setSelectedGolfers(newSelectedGolfers);
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

  // Function to get sorted and filtered golfers
  const getSortedGolfers = () => {
    if (!golfers || golfers.length === 0) {
      return [];
    }
    
    return [...golfers]
      .filter(golfer => {
        const searchLower = searchTerm.toLowerCase();
        return golfer.Name.toLowerCase().includes(searchLower);
      })
      .sort((a, b) => {
        const getLastName = (name) => {
          const parts = (name || '').split(' ');
          return parts[parts.length - 1];
        };
        return getLastName(a.Name).localeCompare(getLastName(b.Name));
      });
  };

  // Function to check if a golfer is selected
  const isGolferSelected = (golferId) => {
    return selectedGolfers.some(g => g && String(g.PlayerID || g.PlayerId) === String(golferId));
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
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #215127 0%, #2a6a33 100%)',
      color: '#fff',
      fontFamily: "'Source Sans Pro', sans-serif"
    }}>
      {/* Responsive Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {/* Tournament Info */}
          <div className="mb-4 lg:mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ 
              fontFamily: "'Roboto Slab', serif",
              color: '#A67C0D',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>{currentTournament?.name}</h1>
            <p className="text-base lg:text-lg mb-4" style={{ 
              fontFamily: "'Source Sans Pro', sans-serif",
              fontWeight: 300,
              letterSpacing: '0.02em'
            }}>
              {currentTournament && `${new Date(currentTournament.startDate).toLocaleDateString()} - ${new Date(currentTournament.endDate).toLocaleDateString()}`}
            </p>
            <div className="p-3 lg:p-4 rounded-lg mb-4 lg:mb-6" style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}>
              <h2 className="text-lg lg:text-xl font-bold mb-2" style={{ 
                fontFamily: "'Roboto Slab', serif",
                color: '#A67C0D',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Instructions</h2>
              <ul className="list-disc list-inside text-sm lg:text-base" style={{ 
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 300
              }}>
                <li>Select exactly 4 golfers for this tournament</li>
                <li>Each golfer can only be used once per season</li>
                <li>Picks lock when the tournament begins</li>
              </ul>
            </div>
          </div>

          {/* Search and Dropdown */}
          <div className="mb-4 relative">
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                placeholder="Search golfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full text-white px-4 py-2 rounded-lg border border-green-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px'
                }}
              />
              {isDropdownOpen && (
                <div className="absolute z-10 w-full top-full mt-1 border border-green-700 rounded-lg shadow-lg max-h-96 overflow-y-auto" style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px'
                }}>
                  {getSortedGolfers().map((golfer) => {
                    const golferId = String(golfer.PlayerID || golfer.PlayerId);
                    const isUsed = usedGolfers.some(id => String(id) === golferId);
                    const isSelected = isGolferSelected(golferId);
                    
                    return (
                      <div
                        key={golferId}
                        onClick={() => {
                          if (!tournamentLocked && !isUsed && !isSelected) {
                            handleGolferSelection(golfer);
                            setIsDropdownOpen(false);
                          }
                        }}
                        className={`p-3 cursor-pointer hover:bg-green-700 ${
                          (tournamentLocked || isUsed || isSelected) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px'
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{golfer.Name}</span>
                          {oddsData[golfer.Name] && (
                            <span className="text-sm text-gray-300">
                              {oddsData[golfer.Name].oddsDescription}
                            </span>
                          )}
                        </div>
                        {(isUsed || isSelected) && (
                          <span className="text-xs text-red-400">
                            {isSelected ? "Already selected" : "Used in previous tournament"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Selected Golfers */}
        <div className="w-full lg:w-96 p-4 lg:p-6 border-t lg:border-l lg:border-t-0 border-green-700" style={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px'
        }}>
          <div className="lg:sticky lg:top-0">
            <h2 className="text-xl lg:text-2xl font-bold mb-4" style={{ 
              fontFamily: "'Roboto Slab', serif",
              color: '#A67C0D',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Selected Golfers</h2>
            <div className="space-y-3 lg:space-y-4">
              {[...Array(4)].map((_, index) => {
                const selectedGolfer = selectedGolfers[index];
                return (
                  <div
                    key={index}
                    className={`p-3 lg:p-4 rounded-lg ${
                      selectedGolfer ? 'border-2 border-gold-500' : 'border-2 border-dashed border-green-600'
                    }`}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px'
                    }}
                  >
                    {selectedGolfer ? (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base lg:text-lg font-bold">{selectedGolfer.Name}</h3>
                            {oddsData[selectedGolfer.Name] && (
                              <div className="text-xs lg:text-sm text-gray-300 mt-1">
                                {oddsData[selectedGolfer.Name].oddsDescription && (
                                  <p>Odds to win: {oddsData[selectedGolfer.Name].oddsDescription}</p>
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
                );
              })}
            </div>
            <button
              onClick={handleSubmitPicks}
              disabled={tournamentLocked || selectedGolfers.filter(Boolean).length !== 4}
              className={`w-full bg-gold-500 text-green-900 px-4 py-2 rounded-lg mt-4 text-sm lg:text-base ${
                (tournamentLocked || selectedGolfers.filter(Boolean).length !== 4) ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ 
                background: '#A67C0D',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'background-color 0.2s'
              }}
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