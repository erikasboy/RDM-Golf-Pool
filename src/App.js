import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { auth, signInWithGoogle } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import Profile from "./Profile";
import Picks from "./Picks";
import TournamentPage from "./components/TournamentPage";
import MastersPage from "./components/MastersPage";
import TournamentsPage from "./components/TournamentsPage";
import NextWeekendPage from "./components/NextWeekendPage";
import PGAPage from "./components/PGAPage";
import USOpenPage from "./components/USOpenPage";
import OpenPage from "./components/OpenPage";

// Debug overlay component
const DebugOverlay = ({ logs }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const copyLogs = () => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = logs.join('\n');
      document.body.appendChild(textarea);
      
      // Select and copy the text
      textarea.select();
      document.execCommand('copy');
      
      // Remove the temporary textarea
      document.body.removeChild(textarea);
      
      // Show success message
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
    }
  };
  
  return (
    <div className="fixed bottom-0 right-0 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-1 rounded-tl-lg text-sm"
      >
        {isVisible ? 'Hide Debug' : 'Show Debug'}
      </button>
      {isVisible && (
        <div className="bg-gray-900 text-white p-4 w-full md:w-96 h-[80vh] md:h-[60vh] overflow-auto text-base font-mono absolute bottom-full right-0 mb-2">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-lg">Debug Logs:</div>
            <button
              onClick={copyLogs}
              className="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              {copySuccess ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="p-2 hover:bg-gray-800 rounded break-words">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [debugLogs, setDebugLogs] = useState(() => {
    // Load persisted logs on mount
    const persistedLogs = localStorage.getItem('debugLogs');
    return persistedLogs ? JSON.parse(persistedLogs) : [];
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug logging function
  const debugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = `[${timestamp}] ${message}`;
    setDebugLogs(prev => {
      const updatedLogs = [...prev, newLog].slice(-100);
      // Persist logs to localStorage
      localStorage.setItem('debugLogs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
    console.log(message);
  };

  // Clear any stale auth state on mount
  useEffect(() => {
    if (isInitialized) {
      debugLog('Skipping duplicate mount');
      return;
    }

    // Clear any stale auth state
    const lastAttempt = parseInt(localStorage.getItem('lastAuthAttempt') || '0');
    const timeSinceLastAttempt = Date.now() - lastAttempt;
    debugLog(`Time since last auth attempt: ${timeSinceLastAttempt}ms`);
    
    // Validate timestamp - ensure it's not too old
    const isValidTimestamp = lastAttempt > 0 && timeSinceLastAttempt < 300000;
    const hasRedirectFlag = localStorage.getItem('authRedirect') === 'true';
    
    debugLog(`Auth state check:
      - Last attempt: ${new Date(lastAttempt).toLocaleString()}
      - Time since: ${timeSinceLastAttempt}ms
      - Valid timestamp: ${isValidTimestamp}
      - Has redirect flag: ${hasRedirectFlag}
    `);
    
    // Clear auth state if:
    // 1. More than 5 minutes have passed
    // 2. No redirect in progress
    // 3. Invalid timestamp
    // 4. Max check attempts reached
    if (timeSinceLastAttempt > 300000 || !hasRedirectFlag || !isValidTimestamp) {
      debugLog('Clearing stale auth state');
      localStorage.removeItem('authRedirect');
      localStorage.removeItem('authStartTime');
      localStorage.removeItem('authAttempt');
      localStorage.removeItem('lastAuthAttempt');
    } else {
      debugLog('Keeping auth state - active redirect and valid timestamp');
    }

    if (auth.currentUser) {
      debugLog(`Current user found on mount: ${auth.currentUser.email}`);
      setUser(auth.currentUser);
      setLoading(false);
    } else {
      setLoading(false);
    }

    setIsInitialized(true);
  }, [isInitialized]);

  // Initial mount logging
  useEffect(() => {
    if (isInitialized) {
      debugLog('App mounted');
      debugLog(`Current URL: ${window.location.href}`);
      debugLog(`Current auth state: ${auth.currentUser ? `User: ${auth.currentUser.email}` : 'No user'}`);
      debugLog(`User Agent: ${navigator.userAgent}`);
      debugLog(`Screen size: ${window.innerWidth}x${window.innerHeight}`);
      debugLog(`Is mobile: ${/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)}`);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      debugLog('Waiting for initialization');
      return;
    }

    debugLog('Setting up auth state listeners');
    let mounted = true;
    let checkCount = 0;
    let checkInterval;

    // Function to check redirect result
    const checkRedirectResult = async () => {
      if (!mounted) {
        debugLog('Component unmounted, skipping redirect result handling');
        return;
      }

      try {
        debugLog(`Checking for redirect result (attempt ${checkCount + 1})
          URL: ${window.location.href}
          Auth state: ${auth.currentUser ? `User: ${auth.currentUser.email}` : 'No user'}
          Redirect flag: ${localStorage.getItem('authRedirect')}
          Attempt type: ${localStorage.getItem('authAttempt')}
          Last attempt: ${new Date(parseInt(localStorage.getItem('lastAuthAttempt') || '0')).toLocaleString()}
        `);
        
        const result = await handleRedirectResult();
        
        if (!mounted) {
          debugLog('Component unmounted, skipping redirect result handling');
          return;
        }

        if (result?.user) {
          debugLog(`Redirect result successful: ${result.user.email}`);
          setUser(result.user);
          setAuthError(null);
          setAuthMessage("");
          setLoading(false);
          setAuthInProgress(false);
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        } else if (localStorage.getItem('authRedirect') === 'true') {
          debugLog('Redirect in progress but no result yet');
          setAuthMessage("Completing sign in...");
          if (checkCount < 5) {
            checkCount++;
          } else {
            debugLog('Max check attempts reached, clearing auth state');
            setAuthError("Sign in taking too long. Please try again.");
            setAuthMessage("");
            setAuthInProgress(false);
            setLoading(false);
            // Clear auth state on max attempts
            localStorage.removeItem('authRedirect');
            localStorage.removeItem('authStartTime');
            localStorage.removeItem('authAttempt');
            localStorage.removeItem('lastAuthAttempt');
            if (checkInterval) {
              clearInterval(checkInterval);
            }
          }
        } else {
          debugLog('No redirect in progress');
          setLoading(false);
          setAuthInProgress(false);
        }
      } catch (error) {
        debugLog(`Error handling redirect: ${error.message}`);
        if (!mounted) return;
        
        setAuthError(error.message);
        setAuthMessage("");
        setAuthInProgress(false);
        setLoading(false);
        // Clear auth state on error
        localStorage.removeItem('authRedirect');
        localStorage.removeItem('authStartTime');
        localStorage.removeItem('authAttempt');
        localStorage.removeItem('lastAuthAttempt');
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      }
    };

    // Add Firebase auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!mounted) {
        debugLog('Component unmounted, skipping state updates');
        return;
      }

      debugLog(`Auth state changed: ${user ? `User: ${user.email}` : 'No user'}`);
      debugLog(`Current URL: ${window.location.href}`);
      debugLog(`Auth redirect flag: ${localStorage.getItem('authRedirect')}`);
      
      if (user) {
        debugLog('Setting user in state from auth change');
        setUser(user);
        setLoading(false);
        setAuthInProgress(false);
        setAuthError(null);
        setAuthMessage("");
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      } else if (!localStorage.getItem('authRedirect')) {
        debugLog('No user and no redirect in progress');
        setLoading(false);
        setAuthInProgress(false);
      }
    });

    // Check for redirect result immediately
    checkRedirectResult();
    
    // Check every 2 seconds for the first 10 seconds
    checkInterval = setInterval(() => {
      if (checkCount < 5) {
        checkRedirectResult();
      } else {
        debugLog('Max check attempts reached, clearing interval and auth state');
        clearInterval(checkInterval);
        // Clear auth state when max attempts reached
        localStorage.removeItem('authRedirect');
        localStorage.removeItem('authStartTime');
        localStorage.removeItem('authAttempt');
        localStorage.removeItem('lastAuthAttempt');
        if (mounted) {
          setLoading(false);
          setAuthInProgress(false);
        }
      }
    }, 2000);

    return () => {
      debugLog('Cleaning up auth listeners');
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      // Only unsubscribe if component is actually unmounting
      if (!document.hidden) {
        unsubscribe();
      }
    };
  }, [isInitialized]);

  const handleGoogleLogin = async () => {
    debugLog('Initiating Google login');
    try {
      setAuthInProgress(true);
      setAuthError(null);
      setAuthMessage("Signing in with Google...");
      
      const result = await signInWithGoogle(false); // false means use popup
      debugLog(`Google login successful: ${result.user.email}`);
      setUser(result.user);
    } catch (error) {
      debugLog(`Google login error: ${error.message}`);
      setAuthError(error.message);
    } finally {
      setAuthMessage("");
      setAuthInProgress(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    debugLog('Initiating email login');
    try {
      setAuthInProgress(true);
      setAuthError(null);
      setAuthMessage("Signing in...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      debugLog(`Email login successful: ${result.user.email}`);
      setUser(result.user);
    } catch (error) {
      debugLog(`Email login error: ${error.message}`);
      setAuthError(error.message);
    } finally {
      setAuthMessage("");
      setAuthInProgress(false);
    }
  };

  const handleRetry = () => {
    debugLog('Retrying authentication');
    debugLog(`Current URL: ${window.location.href}`);
    debugLog(`User Agent: ${navigator.userAgent}`);
    setAuthError(null);
    setAuthMessage("");
    setAuthInProgress(false);
    localStorage.removeItem('authRedirect');
    localStorage.removeItem('authStartTime');
    localStorage.removeItem('authAttempt');
    localStorage.removeItem('lastAuthAttempt');
    auth.signOut().catch(console.error);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The auth state listener will handle updating the UI
    } catch (error) {
      console.error('Error signing out:', error);
      // You might want to show an error message to the user here
    }
  };

  if (loading || authInProgress) {
    return (
      <div className="loading">
        <div className="card">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gold-500 text-lg font-semibold mb-2">
            {authMessage || (authInProgress ? "Signing in..." : "Loading...")}
          </p>
          {(authInProgress || authError) && (
            <button
              onClick={handleRetry}
              className="text-sm text-gold-300 hover:text-gold-100 underline mt-4"
            >
              Cancel and try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        {user ? (
          <>
            <nav className="nav-bar">
              <div className="nav-container">
                <div className="nav-logo">
                  {/* Placeholder for logo image */}
                  <h1>Golf Pool App</h1>
                </div>
                <div className="nav-links">
                  <Link to="/profile">Profile</Link>
                  <Link to="/picks">Picks</Link>
                  <Link to="/tournaments">Tournaments</Link>
                  <Link to="/rules">Rules/FAQ</Link>
                  <button 
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>

            <Routes>
              <Route path="/profile" element={<Profile />} />
              <Route path="/picks" element={<Picks />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/next-weekend" element={<NextWeekendPage />} />
              <Route path="/tournaments/masters" element={<MastersPage />} />
              <Route path="/tournaments/pga" element={<PGAPage />} />
              <Route path="/tournaments/us-open" element={<USOpenPage />} />
              <Route path="/tournaments/open" element={<OpenPage />} />
              <Route path="/rules" element={<div className="card">Rules/FAQ Page Coming Soon</div>} />
              <Route path="*" element={<Profile />} />
            </Routes>
          </>
        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="card w-full max-w-md mx-4">
              <h1 className="mb-4">Welcome to the Golf Pool App</h1>
              {authError && (
                <div className="error mb-4">
                  <p>{authError}</p>
                  <button
                    onClick={handleRetry}
                    className="text-sm text-white hover:text-gray-200 underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              )}
              <form onSubmit={handleEmailLogin} className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mb-4 rounded-lg text-black"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 mb-4 rounded-lg text-black"
                />
                <button
                  type="submit"
                  disabled={authInProgress}
                  className="primary-button w-full disabled:opacity-50"
                >
                  Login with Email
                </button>
              </form>
              <button
                onClick={handleGoogleLogin}
                disabled={authInProgress}
                className="primary-button w-full disabled:opacity-50"
              >
                Login with Google
              </button>
            </div>
          </div>
        )}
        <DebugOverlay logs={debugLogs} />
      </div>
    </Router>
  );
}

export default App;