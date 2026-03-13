import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export default function MakePicksPage() {
  const { tournamentKey } = useParams();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [field, setField] = useState([]);
  const [selected, setSelected] = useState([]);
  const [priorPicks, setPriorPicks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load tournament
        const tournDoc = await getDoc(
          doc(db, "tournaments", tournamentKey)
        );
        if (!tournDoc.exists()) {
          setError("Tournament not found.");
          setLoading(false);
          return;
        }
        const tournData = { id: tournDoc.id, ...tournDoc.data() };
        setTournament(tournData);

        // Check if locked
        const startDate = tournData.startDate?.toDate
          ? tournData.startDate.toDate()
          : new Date(tournData.startDate);
        setLocked(new Date() >= startDate);

        // Load field
        const fieldDoc = await getDoc(doc(db, "fields", tournamentKey));
        if (fieldDoc.exists()) {
          setField(fieldDoc.data().golfers || []);
        }

        // Load user's existing pick for this tournament
        const pickId = `${tournamentKey}_${user.uid}`;
        const pickDoc = await getDoc(doc(db, "picks", pickId));
        if (pickDoc.exists()) {
          setSelected(pickDoc.data().golfers || []);
        }

        // Load all of this user's picks for the year to check duplicates
        const year = tournData.year;
        const picksSnap = await getDocs(
          query(
            collection(db, "picks"),
            where("userId", "==", user.uid),
            where("year", "==", year)
          )
        );
        const usedGolfers = [];
        picksSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.tournamentKey !== tournamentKey) {
            usedGolfers.push(...(data.golfers || []));
          }
        });
        setPriorPicks(usedGolfers);
      } catch (err) {
        console.error("Error loading picks data:", err);
        setError("Failed to load tournament data.");
      }
      setLoading(false);
    }
    load();
  }, [tournamentKey, user.uid]);

  const filteredField = useMemo(() => {
    if (!search.trim()) return field;
    const term = search.toLowerCase();
    return field.filter((g) => g.name.toLowerCase().includes(term));
  }, [field, search]);

  const isAlreadyPicked = (name) =>
    priorPicks.some((p) => p.toLowerCase() === name.toLowerCase());

  const isSelected = (name) =>
    selected.some((s) => s.toLowerCase() === name.toLowerCase());

  const toggleGolfer = (name) => {
    if (locked) return;
    if (isSelected(name)) {
      setSelected(selected.filter((s) => s.toLowerCase() !== name.toLowerCase()));
      setSaved(false);
    } else if (selected.length < 4 && !isAlreadyPicked(name)) {
      setSelected([...selected, name]);
      setSaved(false);
    }
  };

  const handleSubmit = async () => {
    if (selected.length !== 4) return;
    if (locked) return;

    setSaving(true);
    setError(null);
    try {
      const pickId = `${tournamentKey}_${user.uid}`;
      await setDoc(doc(db, "picks", pickId), {
        userId: user.uid,
        tournamentKey,
        year: tournament.year,
        golfers: selected,
        submittedAt: Timestamp.now(),
      });
      setSaved(true);
    } catch (err) {
      console.error("Error saving picks:", err);
      setError("Failed to save picks. Make sure you're signed in.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  if (error && !tournament) {
    return <div className="text-center py-12 text-red-400">{error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link to="/" className="text-gold-400 text-sm hover:text-gold-300">
          ← Back to Standings
        </Link>
        <h1 className="text-2xl font-heading text-gold-500 uppercase mt-2">
          {tournament?.name}
        </h1>
        <p className="text-gray-400 text-sm">
          {tournament?.venue} — {tournament?.location}
        </p>
      </div>

      {locked ? (
        <div className="bg-red-900/30 border border-red-700 rounded p-4">
          <p className="font-bold">Picks are locked</p>
          <p className="text-sm text-gray-300">
            The tournament has started. Picks can no longer be changed.
          </p>
          {selected.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-2">Your picks:</p>
              <div className="flex flex-wrap gap-2">
                {selected.map((name) => (
                  <span
                    key={name}
                    className="bg-gold-500/20 text-gold-400 px-3 py-1 rounded text-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Selection bar */}
          <div className="bg-white/10 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg text-gold-400 uppercase">
                Your Picks ({selected.length}/4)
              </h2>
              <button
                onClick={handleSubmit}
                disabled={selected.length !== 4 || saving}
                className={`px-4 py-2 rounded font-heading uppercase text-sm ${
                  selected.length === 4
                    ? "bg-gold-500 hover:bg-gold-600 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Submit Picks"}
              </button>
            </div>
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleGolfer(name)}
                    className="bg-gold-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                    title="Click to remove"
                  >
                    {name} ✕
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Select 4 golfers from the field below.
              </p>
            )}
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {saved && (
              <p className="text-green-400 text-sm mt-2">
                Picks saved successfully!
              </p>
            )}
          </div>

          {/* Prior picks info */}
          {priorPicks.length > 0 && (
            <div className="bg-white/5 rounded p-3 text-sm">
              <p className="text-gray-400 mb-1">
                Already picked this year (unavailable):
              </p>
              <p className="text-gray-500">
                {priorPicks.join(", ")}
              </p>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Search golfers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
          />

          {/* Field list */}
          {field.length === 0 ? (
            <div className="bg-white/10 rounded p-6 text-center text-gray-400">
              No field data available yet. The admin needs to import the
              tournament field.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filteredField.map((g) => {
                const picked = isAlreadyPicked(g.name);
                const sel = isSelected(g.name);
                const disabled = picked || (selected.length >= 4 && !sel);

                return (
                  <button
                    key={g.name}
                    onClick={() => toggleGolfer(g.name)}
                    disabled={disabled}
                    className={`text-left px-3 py-2 rounded text-sm transition-colors ${
                      sel
                        ? "bg-gold-500/30 border border-gold-500 text-white"
                        : picked
                        ? "bg-white/5 text-gray-500 line-through cursor-not-allowed"
                        : disabled
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {g.name}
                    {g.country && (
                      <span className="text-gray-500 ml-2 text-xs">
                        {g.country}
                      </span>
                    )}
                    {picked && (
                      <span className="text-gray-600 ml-2 text-xs">
                        (already picked)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
