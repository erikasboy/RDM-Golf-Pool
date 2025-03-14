import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { signInWithGoogle } from "./firebase";
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
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [debugLogs, setDebugLogs] = useState([]);
  const auth = getAuth();

  // Debug logging function
  const debugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = `[${timestamp}] ${message}`;
    setDebugLogs(prev => {
      const updatedLogs = [...prev, newLog].slice(-100);
      localStorage.setItem('debugLogs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
    console.log(message);
  };

  useEffect(() => {
    debugLog('App mounted');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      debugLog(`Auth state changed: ${user ? `User: ${user.email}` : 'No user'}`);
      setUser(user);
      setLoading(false);
    });

    return () => {
      debugLog('Cleaning up auth listener');
      unsubscribe();
    };
  }, [auth]);

  const handleGoogleLogin = async () => {
    debugLog('Initiating Google login');
    try {
      setAuthError(null);
      setAuthMessage("Signing in with Google...");
      const result = await signInWithGoogle();
      debugLog(`Google login successful: ${result.user.email}`);
    } catch (error) {
      debugLog(`Google login error: ${error.message}`);
      setAuthError(error.message);
    } finally {
      setAuthMessage("");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    debugLog('Initiating email login');
    try {
      setAuthError(null);
      setAuthMessage("Signing in...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      debugLog(`Email login successful: ${result.user.email}`);
    } catch (error) {
      debugLog(`Email login error: ${error.message}`);
      setAuthError(error.message);
    } finally {
      setAuthMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      debugLog('User signed out');
    } catch (error) {
      debugLog(`Logout error: ${error.message}`);
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="card">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gold-500 text-lg font-semibold mb-2">
            {authMessage || "Loading..."}
          </p>
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
                  <h1>Golf Pool App</h1>
                </div>
                <div className="nav-links">
                  <Link to="/profile">Profile</Link>
                  <Link to="/picks">Picks</Link>
                  <Link to="/tournaments">Tournaments</Link>
                  <Link to="/rules">Rules/FAQ</Link>
                  <button onClick={handleLogout} className="logout-button">
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
                  className="primary-button w-full"
                >
                  Login with Email
                </button>
              </form>
              <button
                onClick={handleGoogleLogin}
                className="primary-button w-full"
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