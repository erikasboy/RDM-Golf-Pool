import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export default function ResultsPage() {
  const { tournamentKey } = useParams();
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [poolPicks, setPoolPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load tournament
        const tournDoc = await getDoc(
          doc(db, "tournaments", tournamentKey)
        );
        if (tournDoc.exists()) {
          setTournament({ id: tournDoc.id, ...tournDoc.data() });
        }

        // Load results
        const resultDoc = await getDoc(doc(db, "results", tournamentKey));
        if (resultDoc.exists()) {
          setResults(resultDoc.data().positions || []);
        }

        // Load all picks for this tournament
        const picksSnap = await getDocs(
          query(
            collection(db, "picks"),
            where("tournamentKey", "==", tournamentKey)
          )
        );
        const picksWithNames = [];
        for (const pickDoc of picksSnap.docs) {
          const pick = pickDoc.data();
          // Get user display name
          const userDoc = await getDoc(doc(db, "users", pick.userId));
          const displayName = userDoc.exists()
            ? userDoc.data().displayName || userDoc.data().email
            : pick.userId;
          picksWithNames.push({ ...pick, displayName });
        }
        setPoolPicks(picksWithNames);
      } catch (err) {
        console.error("Error loading results:", err);
      }
      setLoading(false);
    }
    load();
  }, [tournamentKey]);

  function getGolferResult(golferName) {
    return results.find(
      (r) => r.name.toLowerCase() === golferName.toLowerCase()
    );
  }

  function getUserTotal(pick) {
    let total = 0;
    for (const name of pick.golfers || []) {
      const res = getGolferResult(name);
      total += res ? res.points : 0;
    }
    return total;
  }

  // Sort pool members by total points
  const sortedPoolPicks = [...poolPicks].sort(
    (a, b) => getUserTotal(b) - getUserTotal(a)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12 text-gray-400">
        Tournament not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-gold-400 text-sm hover:text-gold-300">
          ← Back to Standings
        </Link>
        <h1 className="text-2xl font-heading text-gold-500 uppercase mt-2">
          {tournament.name} Results
        </h1>
        <p className="text-gray-400 text-sm">{tournament.venue}</p>
      </div>

      {/* Pool Member Results */}
      {sortedPoolPicks.length > 0 && (
        <div>
          <h2 className="text-lg font-heading text-gold-400 uppercase mb-3">
            Pool Standings
          </h2>
          <div className="space-y-3">
            {sortedPoolPicks.map((pick, idx) => {
              const total = getUserTotal(pick);
              return (
                <div
                  key={pick.userId}
                  className="bg-white/10 rounded p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading text-sm">
                      <span className="text-gold-400 mr-2">{idx + 1}.</span>
                      {pick.displayName}
                    </span>
                    <span className="font-bold text-gold-400">
                      {total} pts
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                    {(pick.golfers || []).map((name) => {
                      const res = getGolferResult(name);
                      const pts = res ? res.points : 0;
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between bg-white/5 rounded px-2 py-1 text-xs"
                        >
                          <span className="truncate mr-1">{name}</span>
                          <span
                            className={`font-bold flex-shrink-0 ${
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-heading text-gold-400 uppercase mb-3">
            Full Leaderboard
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2 px-2 text-xs text-gold-400 font-heading uppercase">
                    Pos
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gold-400 font-heading uppercase">
                    Name
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase">
                    Score
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase hidden sm:table-cell">
                    R1
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase hidden sm:table-cell">
                    R2
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase hidden sm:table-cell">
                    R3
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase hidden sm:table-cell">
                    R4
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase">
                    Status
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-gold-400 font-heading uppercase">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  // Highlight if any pool member picked this golfer
                  const pickedBy = poolPicks
                    .filter((p) =>
                      (p.golfers || []).some(
                        (g) =>
                          g.toLowerCase() === r.name.toLowerCase()
                      )
                    )
                    .map((p) => p.displayName);

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-white/10 ${
                        pickedBy.length > 0 ? "bg-gold-500/10" : ""
                      }`}
                    >
                      <td className="py-1.5 px-2">
                        {r.status === "cut"
                          ? "CUT"
                          : r.status === "wd"
                          ? "WD"
                          : r.status === "dq"
                          ? "DQ"
                          : r.position
                          ? `T${r.position}`.replace("TT", "T")
                          : "—"}
                      </td>
                      <td className="py-1.5 px-2">
                        {r.name}
                        {pickedBy.length > 0 && (
                          <span className="text-xs text-gold-400 ml-2">
                            ({pickedBy.join(", ")})
                          </span>
                        )}
                      </td>
                      <td className="text-center py-1.5 px-2">{r.score}</td>
                      <td className="text-center py-1.5 px-2 text-gray-400 hidden sm:table-cell">
                        {r.roundScores?.[0] ?? "—"}
                      </td>
                      <td className="text-center py-1.5 px-2 text-gray-400 hidden sm:table-cell">
                        {r.roundScores?.[1] ?? "—"}
                      </td>
                      <td className="text-center py-1.5 px-2 text-gray-400 hidden sm:table-cell">
                        {r.roundScores?.[2] ?? "—"}
                      </td>
                      <td className="text-center py-1.5 px-2 text-gray-400 hidden sm:table-cell">
                        {r.roundScores?.[3] ?? "—"}
                      </td>
                      <td className="text-center py-1.5 px-2 capitalize">
                        {r.status}
                      </td>
                      <td
                        className={`text-center py-1.5 px-2 font-bold ${
                          r.points > 0
                            ? "text-green-400"
                            : r.points < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {r.points > 0 ? "+" : ""}
                        {r.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length === 0 && (
        <div className="bg-white/10 rounded p-6 text-center text-gray-400">
          No results available yet for this tournament.
        </div>
      )}
    </div>
  );
}
