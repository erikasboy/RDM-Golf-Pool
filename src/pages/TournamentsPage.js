import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

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

export default function TournamentsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
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
      } catch (err) {
        console.error("Error loading tournaments:", err);
      }
      setLoading(false);
    }
    load();
  }, [year]);

  function formatDate(timestamp) {
    if (!timestamp) return "";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Year Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading text-gold-500 uppercase">
          {year} Tournaments
        </h1>
        <div className="flex gap-2">
          {[year - 1, year, year + 1]
            .filter((y) => y <= new Date().getFullYear() + 1)
            .map((y) => (
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

      {/* Tournament Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            to={`/tournament/${t.id}`}
            className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-heading text-gold-400 uppercase text-sm">
                {t.name}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  STATUS_COLORS[t.status] || "bg-gray-600"
                }`}
              >
                {STATUS_LABELS[t.status] || t.status}
              </span>
            </div>
            <p className="text-gray-300 text-sm">{t.venue}</p>
            <p className="text-gray-400 text-xs">{t.location}</p>
            <p className="text-gray-400 text-xs mt-2">
              {formatDate(t.startDate)} – {formatDate(t.endDate)}
            </p>
            <div className="mt-3 text-xs text-gold-400">
              View Details →
            </div>
          </Link>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="bg-white/10 rounded-lg p-6 text-center text-gray-400">
          No tournaments configured for {year}.
        </div>
      )}
    </div>
  );
}
