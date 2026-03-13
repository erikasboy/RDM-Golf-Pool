import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const STATUS_COLORS = {
  upcoming: "bg-blue-600",
  field_set: "bg-yellow-600",
  active: "bg-green-600",
  completed: "bg-gray-600",
};

const STATUS_LABELS = {
  upcoming: "Upcoming",
  field_set: "Field Set",
  active: "Active",
  completed: "Completed",
};

export default function HomePage() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [standings, setStandings] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [userPicks, setUserPicks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load standings
        const standingsDoc = await getDoc(
          doc(db, "standings", String(year))
        );
        if (standingsDoc.exists()) {
          setStandings(standingsDoc.data());
        } else {
          setStandings(null);
        }

        // Load tournaments for this year
        const tournamentsSnap = await getDocs(
          query(collection(db, "tournaments"), where("year", "==", year))
        );
        const tournList = tournamentsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const da = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate);
            const db2 = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate);
            return da - db2;
          });
        setTournaments(tournList);

        // Load user's picks for this year
        if (user) {
          const picksSnap = await getDocs(
            query(
              collection(db, "picks"),
              where("userId", "==", user.uid),
              where("year", "==", year)
            )
          );
          const picksMap = {};
          picksSnap.docs.forEach((d) => {
            picksMap[d.data().tournamentKey] = true;
          });
          setUserPicks(picksMap);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      }
      setLoading(false);
    }
    load();
  }, [year, user]);

  // Get tournament short names for column headers
  const tournamentHeaders = tournaments.map(
    (t) => t.shortName || t.id
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  // Find tournaments with field_set status where user hasn't picked yet
  const needsPicks = tournaments.filter(
    (t) => t.status === "field_set" && !userPicks[t.id]
  );

  // Check if any unpicked tournament starts within 24 hours
  const urgentPicks = needsPicks.filter((t) => {
    const startDate = t.startDate?.toDate ? t.startDate.toDate() : new Date(t.startDate);
    const hoursUntilStart = (startDate - new Date()) / (1000 * 60 * 60);
    return hoursUntilStart > 0 && hoursUntilStart <= 24;
  });

  return (
    <div className="space-y-8">
      {/* Urgent Warning - Less than 24 hours */}
      {urgentPicks.length > 0 && (
        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-lg p-4 shadow-lg animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-heading text-white uppercase flex items-center gap-2">
                <span className="text-2xl">&#9888;</span>
                Less Than 24 Hours!
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {urgentPicks.length === 1
                  ? `${urgentPicks[0].name} starts soon! Make your picks now or you'll miss out!`
                  : `${urgentPicks.length} tournaments start within 24 hours!`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {urgentPicks.map((t) => (
                <Link
                  key={t.id}
                  to={`/picks/${t.id}`}
                  className="bg-white text-red-700 hover:bg-gray-100 px-4 py-2 rounded font-heading uppercase text-sm font-bold shadow"
                >
                  Pick Now!
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Picks Needed Banner (non-urgent) */}
      {needsPicks.length > 0 && urgentPicks.length === 0 && (
        <div className="bg-gradient-to-r from-gold-600 to-gold-500 rounded-lg p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-heading text-white uppercase flex items-center gap-2">
                <span className="text-2xl">&#9971;</span>
                Make Your Picks!
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {needsPicks.length === 1
                  ? `The field is set for ${needsPicks[0].name}. Submit your picks before the tournament starts!`
                  : `${needsPicks.length} tournaments are open for picks!`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {needsPicks.map((t) => (
                <Link
                  key={t.id}
                  to={`/picks/${t.id}`}
                  className="bg-white text-gold-700 hover:bg-gray-100 px-4 py-2 rounded font-heading uppercase text-sm font-bold shadow"
                >
                  {needsPicks.length === 1 ? "Make Picks Now" : t.shortName || t.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading text-gold-500 uppercase">
          {year} Standings
        </h1>
        <div className="flex gap-2">
          {[year - 1, year, year + 1].filter(y => y <= new Date().getFullYear() + 1).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1 rounded text-sm font-heading uppercase ${
                y === year
                  ? "bg-gold-500 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="bg-white/10 rounded p-3 flex flex-col"
          >
            <div className="flex items-center justify-between mb-1">
              <Link
                to={`/tournament/${t.id}`}
                className="font-heading text-sm uppercase text-gold-400 hover:text-gold-300"
              >
                {t.name}
              </Link>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  STATUS_COLORS[t.status] || "bg-gray-600"
                }`}
              >
                {STATUS_LABELS[t.status] || t.status}
              </span>
            </div>
            <span className="text-xs text-gray-400">{t.venue}</span>
            <div className="mt-2 flex gap-2">
              {t.status === "field_set" || t.status === "upcoming" ? (
                <Link
                  to={`/picks/${t.id}`}
                  className="text-xs text-gold-400 hover:text-gold-300"
                >
                  Make Picks →
                </Link>
              ) : null}
              {t.status === "completed" && (
                <Link
                  to={`/results/${t.id}`}
                  className="text-xs text-gold-400 hover:text-gold-300"
                >
                  View Results →
                </Link>
              )}
            </div>
          </div>
        ))}
        {tournaments.length === 0 && (
          <p className="text-gray-400 col-span-full">
            No tournaments configured for {year}.
          </p>
        )}
      </div>

      {/* Standings Table */}
      {standings?.rankings?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 px-3 font-heading text-gold-400 uppercase text-xs">
                  Rank
                </th>
                <th className="text-left py-2 px-3 font-heading text-gold-400 uppercase text-xs">
                  Name
                </th>
                {tournamentHeaders.map((name) => (
                  <th
                    key={name}
                    className="text-center py-2 px-3 font-heading text-gold-400 uppercase text-xs"
                  >
                    {name}
                  </th>
                ))}
                <th className="text-center py-2 px-3 font-heading text-gold-400 uppercase text-xs">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.rankings.map((r, idx) => (
                <tr
                  key={r.userId}
                  className={`border-b border-white/10 ${
                    idx < 3 ? "bg-white/5" : ""
                  }`}
                >
                  <td className="py-2 px-3 font-bold">{idx + 1}</td>
                  <td className="py-2 px-3">{r.displayName}</td>
                  {tournamentHeaders.map((name) => (
                    <td key={name} className="text-center py-2 px-3">
                      {r.breakdown[name] !== undefined
                        ? r.breakdown[name]
                        : "—"}
                    </td>
                  ))}
                  <td className="text-center py-2 px-3 font-bold text-gold-400">
                    {r.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white/10 rounded p-6 text-center text-gray-400">
          No standings data yet for {year}. Standings are calculated after
          tournament results are imported.
        </div>
      )}
    </div>
  );
}
