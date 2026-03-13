import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import MakePicksPage from "./pages/MakePicksPage";
import MyPicksPage from "./pages/MyPicksPage";
import ProfilePage from "./pages/ProfilePage";
import ResultsPage from "./pages/ResultsPage";
import AdminPage from "./pages/AdminPage";
import TournamentPage from "./pages/TournamentPage";
import TournamentsPage from "./pages/TournamentsPage";
import { requestNotificationPermission } from "./utils/notifications";

// PWA install prompt context
const InstallContext = createContext(null);
export function useInstallPrompt() {
  return useContext(InstallContext);
}

function NavBar() {
  const { user, isAdmin, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Request notification permission when user logs in
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  const navLinkClass = ({ isActive }) =>
    `font-heading text-sm uppercase tracking-wider block py-1 ${
      isActive ? "text-gold-400" : "text-gray-300 hover:text-white"
    }`;

  return (
    <nav className="bg-golf-green-800 border-b border-golf-green-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink
          to="/"
          className="text-gold-500 font-heading text-xl font-bold uppercase tracking-wide"
        >
          RDM Golf Pool
        </NavLink>

        {user ? (
          <>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-4">
              <NavLink to="/" className={navLinkClass} end>
                Standings
              </NavLink>
              <NavLink to="/tournaments" className={navLinkClass}>
                Tournaments
              </NavLink>
              <NavLink to="/my-picks" className={navLinkClass}>
                My Picks
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `text-sm ${isActive ? "text-gold-400" : "text-gray-400 hover:text-white"}`
                }
              >
                {user.displayName || user.email}
              </NavLink>
              <button
                onClick={logout}
                className="bg-gold-500 hover:bg-gold-600 text-white px-3 py-1.5 rounded text-sm font-heading uppercase"
              >
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden text-gray-300 hover:text-white p-1"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={login}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-heading uppercase text-sm"
          >
            Sign in with Google
          </button>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {user && menuOpen && (
        <div className="sm:hidden border-t border-golf-green-700 px-4 py-3 space-y-2">
          <NavLink to="/" className={navLinkClass} end onClick={() => setMenuOpen(false)}>
            Standings
          </NavLink>
          <NavLink to="/tournaments" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Tournaments
          </NavLink>
          <NavLink to="/my-picks" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            My Picks
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Admin
            </NavLink>
          )}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <NavLink
              to="/profile"
              className="text-gray-400 hover:text-white text-sm"
              onClick={() => setMenuOpen(false)}
            >
              {user.displayName || user.email}
            </NavLink>
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="bg-gold-500 hover:bg-gold-600 text-white px-3 py-1.5 rounded text-sm font-heading uppercase"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function LoginPage() {
  const { login, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err.code === "auth/user-not-found"
          ? "No account found with that email."
          : err.message
      );
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-3xl font-heading text-gold-500 mb-2 text-center">
        RDM Golf Pool
      </h1>
      <p className="text-gray-300 mb-8 text-center">
        Sign in to view standings, make picks, and compete.
      </p>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded font-heading uppercase text-sm disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 border-t border-white/20" />
        <span className="text-gray-400 text-xs uppercase">or</span>
        <div className="flex-1 border-t border-white/20" />
      </div>

      <button
        onClick={login}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-heading uppercase text-sm"
      >
        Sign in with Google
      </button>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <HomePage /> : <LoginPage />}
      />
      <Route
        path="/tournaments"
        element={
          <ProtectedRoute>
            <TournamentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/picks/:tournamentKey"
        element={
          <ProtectedRoute>
            <MakePicksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-picks"
        element={
          <ProtectedRoute>
            <MyPicksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:tournamentKey"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournament/:tournamentKey"
        element={
          <ProtectedRoute>
            <TournamentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

function App() {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setInstallPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  return (
    <AuthProvider>
      <InstallContext.Provider value={installPrompt}>
        <Router>
          <div className="min-h-screen">
            <NavBar />
            <main className="max-w-6xl mx-auto px-4 py-6">
              <AppRoutes />
            </main>
          </div>
        </Router>
      </InstallContext.Provider>
    </AuthProvider>
  );
}

export default App;
