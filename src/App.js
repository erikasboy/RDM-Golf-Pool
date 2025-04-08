import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { signInWithGoogle } from "./firebase";
import Profile from "./Profile";
import Picks from "./Picks";
import HomePage from "./components/HomePage";
import TournamentPage from "./components/TournamentPage";
import MastersPage from "./components/MastersPage";
import TournamentsPage from "./components/TournamentsPage";
import NextWeekendPage from "./components/NextWeekendPage";
import PGAPage from "./components/PGAPage";
import USOpenPage from "./components/USOpenPage";
import OpenPage from "./components/OpenPage";
import TPCPage from "./components/TPCPage";
import AdminPermissionTest from "./components/AdminPermissionTest";

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
        className="bg-[#215127] text-white px-3 py-1 rounded-tl-lg text-sm"
      >
        {isVisible ? 'Hide Debug' : 'Show Debug'}
      </button>
      {isVisible && (
        <div className="bg-[#215127] text-white p-4 w-full md:w-96 h-[80vh] md:h-[60vh] overflow-auto text-base font-mono absolute bottom-full right-0 mb-2">
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
              <div key={index} className="p-2 hover:bg-[#2a6a33] rounded break-words">
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
  const [isAdmin, setIsAdmin] = useState(false);
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
    console.log('Setting up auth state listener...');
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log(`Auth state changed: ${user ? `User: ${user.email}` : 'No user'}`);
      setUser(user);
      
      if (user) {
        // Check if user is admin
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, [auth]);

  const handleGoogleLogin = async () => {
    console.log('Initiating Google login with popup...');
    try {
      setAuthError(null);
      setAuthMessage("Opening Google sign-in popup...");
      const result = await signInWithGoogle();
      console.log(`Google login successful: ${result.user.email}`);
    } catch (error) {
      console.error('Google login error:', error);
      setAuthError(error.message);
    } finally {
      setAuthMessage("");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    console.log('Initiating email login...');
    try {
      setAuthError(null);
      setAuthMessage("Signing in...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Email login successful: ${result.user.email}`);
    } catch (error) {
      console.error('Email login error:', error);
      setAuthError(error.message);
    } finally {
      setAuthMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
    } catch (error) {
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
      <div className="min-h-screen bg-[#215127] text-white">
        <nav className="bg-[#215127] p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold font-['Roboto_Slab'] uppercase">
              Golf Pool App
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => 
                      isActive 
                        ? "text-[var(--color-gold)] font-['Roboto_Slab'] uppercase" 
                        : "hover:text-gray-300 font-['Roboto_Slab'] uppercase"
                    }
                  >
                    Profile
                  </NavLink>
                  <NavLink 
                    to="/picks" 
                    className={({ isActive }) => 
                      isActive 
                        ? "text-[var(--color-gold)] font-['Roboto_Slab'] uppercase" 
                        : "hover:text-gray-300 font-['Roboto_Slab'] uppercase"
                    }
                  >
                    My Picks
                  </NavLink>
                  <NavLink 
                    to="/tournaments" 
                    className={({ isActive }) => 
                      isActive 
                        ? "text-[var(--color-gold)] font-['Roboto_Slab'] uppercase" 
                        : "hover:text-gray-300 font-['Roboto_Slab'] uppercase"
                    }
                  >
                    Tournaments
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="bg-[var(--color-gold)] hover:bg-[#e6c200] px-4 py-2 rounded-[4px] font-['Roboto_Slab'] uppercase text-black"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-[4px] font-['Roboto_Slab'] uppercase"
                  >
                    Sign in with Google
                  </button>
                  <form onSubmit={handleEmailLogin} className="flex space-x-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-4 py-2 rounded-[4px] bg-gray-700"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="px-4 py-2 rounded-[4px] bg-gray-700"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-[4px] font-['Roboto_Slab'] uppercase"
                    >
                      Login
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </nav>

        <main className="container mx-auto p-4">
          <Routes>
            <Route
              path="/"
              element={user ? <HomePage /> : <div>Please log in to view the pool standings.</div>}
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/picks" element={<Picks />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/next-weekend" element={<NextWeekendPage />} />
            <Route path="/tournaments/masters" element={<MastersPage />} />
            <Route path="/tournaments/pga" element={<PGAPage />} />
            <Route path="/tournaments/us-open" element={<USOpenPage />} />
            <Route path="/tournaments/open" element={<OpenPage />} />
            <Route path="/tournaments/tpc" element={<TPCPage />} />
            <Route path="/tournaments/:id" element={<TournamentPage />} />
            <Route
              path="/admin-test"
              element={
                isAdmin ? (
                  <AdminPermissionTest />
                ) : (
                  <div className="text-center p-4">
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p>You must be an admin to access this page.</p>
                  </div>
                )
              }
            />
          </Routes>
        </main>

        <DebugOverlay logs={debugLogs} />
      </div>
    </Router>
  );
}

export default App;