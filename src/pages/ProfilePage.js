import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, resetPassword } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useInstallPrompt } from "../App";

export default function ProfilePage() {
  const { user } = useAuth();
  const installPrompt = useInstallPrompt();
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [picks, setPicks] = useState([]);
  const [tournaments, setTournaments] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const picksSnap = await getDocs(
          query(
            collection(db, "picks"),
            where("userId", "==", user.uid),
            where("year", "==", year)
          )
        );
        const picksList = picksSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPicks(picksList);

        const tournamentsSnap = await getDocs(
          query(collection(db, "tournaments"), where("year", "==", year))
        );
        const tournsMap = {};
        tournamentsSnap.docs.forEach((d) => {
          tournsMap[d.id] = { id: d.id, ...d.data() };
        });
        setTournaments(tournsMap);

        const resultsMap = {};
        for (const tKey of Object.keys(tournsMap)) {
          if (tournsMap[tKey].status === "completed") {
            const resultDoc = await getDoc(doc(db, "results", tKey));
            if (resultDoc.exists()) {
              resultsMap[tKey] = resultDoc.data().positions || [];
            }
          }
        }
        setResults(resultsMap);
      } catch (err) {
        console.error("Error loading picks:", err);
      }
      setLoading(false);
    }
    load();
  }, [user.uid, year]);

  async function handleResetPassword() {
    setResetError("");
    setResetSent(false);
    try {
      await resetPassword(user.email);
      setResetSent(true);
    } catch (err) {
      setResetError(err.message);
    }
  }

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
  }

  function getGolferPoints(golferName, tournamentKey) {
    const res = results[tournamentKey];
    if (!res) return null;
    const match = res.find(
      (r) => r.name.toLowerCase() === golferName.toLowerCase()
    );
    return match ? match.points : 0;
  }

  function getTournamentTotal(pick) {
    const res = results[pick.tournamentKey];
    if (!res) return null;
    let total = 0;
    for (const name of pick.golfers || []) {
      const match = res.find(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      total += match ? match.points : 0;
    }
    return total;
  }

  const sortedTournaments = Object.values(tournaments).sort((a, b) => {
    const da = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate);
    const db2 = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
    return da - db2;
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-heading text-gold-500 uppercase">Profile</h1>

      {/* Account info */}
      <div className="bg-white/10 rounded p-5 space-y-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Name</p>
          <p className="text-white text-lg">{user.displayName || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
          <p className="text-white text-lg">{user.email}</p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleResetPassword}
            className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-heading uppercase"
          >
            Reset Password
          </button>
          {resetSent && (
            <p className="text-green-400 text-sm mt-2">
              Password reset email sent to {user.email}.
            </p>
          )}
          {resetError && (
            <p className="text-red-400 text-sm mt-2">{resetError}</p>
          )}
        </div>
      </div>

      {/* Install App */}
      <div className="bg-white/10 rounded p-5">
        <h2 className="font-heading text-lg text-gold-400 uppercase mb-3">
          Install App
        </h2>
        {installPrompt ? (
          <button
            onClick={handleInstall}
            className="bg-golf-green-600 hover:bg-golf-green-700 text-white px-4 py-2 rounded text-sm font-heading uppercase"
          >
            Add to Home Screen
          </button>
        ) : (
          <div className="text-gray-300 text-sm space-y-2">
            <p>To install this app on your device:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li><strong>iPhone/iPad:</strong> Tap the Share button, then "Add to Home Screen"</li>
              <li><strong>Android:</strong> Tap the browser menu (⋮), then "Add to Home Screen"</li>
              <li><strong>Desktop Chrome:</strong> Click the install icon (⊕) in the address bar</li>
            </ul>
          </div>
        )}
      </div>

      {/* Season picks */}
      <div>
        <h2 className="font-heading text-lg text-gold-400 uppercase mb-4">
          My Picks — {year}
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
          </div>
        ) : sortedTournaments.length === 0 ? (
          <p className="text-gray-400">No tournaments configured for {year}.</p>
        ) : (
          <div className="space-y-4">
            {sortedTournaments.map((tourn) => {
              const pick = picks.find((p) => p.tournamentKey === tourn.id);
              const isCompleted = tourn.status === "completed";
              const total = pick ? getTournamentTotal(pick) : null;

              return (
                <div key={tourn.id} className="bg-white/10 rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-base text-gold-400 uppercase">
                        {tourn.name}
                      </h3>
                      <p className="text-xs text-gray-400">{tourn.venue}</p>
                    </div>
                    <div className="text-right">
                      {isCompleted && total !== null && (
                        <span className="text-lg font-bold text-gold-400">
                          {total} pts
                        </span>
                      )}
                      {!pick && tourn.status !== "completed" && (
                        <Link
                          to={`/picks/${tourn.id}`}
                          className="text-sm text-gold-400 hover:text-gold-300"
                        >
                          Make Picks →
                        </Link>
                      )}
                    </div>
                  </div>

                  {pick ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(pick.golfers || []).map((name) => {
                        const pts = getGolferPoints(name, tourn.id);
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between bg-white/5 rounded px-3 py-2"
                          >
                            <span className="text-sm">{name}</span>
                            {pts !== null && (
                              <span
                                className={`text-sm font-bold ${
                                  pts > 0
                                    ? "text-green-400"
                                    : pts < 0
                                    ? "text-red-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {pts > 0 ? "+" : ""}
                                {pts}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No picks submitted.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
