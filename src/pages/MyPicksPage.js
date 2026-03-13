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
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export default function MyPicksPage() {
  const { user } = useAuth();
  const [picks, setPicks] = useState([]);
  const [tournaments, setTournaments] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load all picks for this user this year
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

        // Load tournaments for this year
        const tournamentsSnap = await getDocs(
          query(collection(db, "tournaments"), where("year", "==", year))
        );
        const tournsMap = {};
        tournamentsSnap.docs.forEach((d) => {
          tournsMap[d.id] = { id: d.id, ...d.data() };
        });
        setTournaments(tournsMap);

        // Load results for completed tournaments
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

  // Sort tournaments by start date
  const sortedTournaments = Object.values(tournaments).sort((a, b) => {
    const da = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate);
    const db2 = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
    return da - db2;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading text-gold-500 uppercase">
        My Picks — {year}
      </h1>

      {sortedTournaments.length === 0 ? (
        <p className="text-gray-400">No tournaments configured for {year}.</p>
      ) : (
        <div className="space-y-4">
          {sortedTournaments.map((tourn) => {
            const pick = picks.find(
              (p) => p.tournamentKey === tourn.id
            );
            const isCompleted = tourn.status === "completed";
            const total = pick ? getTournamentTotal(pick) : null;

            return (
              <div
                key={tourn.id}
                className="bg-white/10 rounded p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-heading text-lg text-gold-400 uppercase">
                      {tourn.name}
                    </h2>
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
  );
}
