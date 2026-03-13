import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, callImportField, callImportResults, callCalculateStandings, callCreateParticipant } from "../firebase";
import { notifyFieldImported } from "../utils/notifications";

const INITIAL_TOURNAMENT = {
  name: "",
  shortName: "",
  year: new Date().getFullYear(),
  startDate: "",
  endDate: "",
  venue: "",
  location: "",
  espnEventId: "",
  status: "upcoming",
  lat: "",
  lon: "",
  imageUrl: "",
};

export default function AdminPage() {
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState(INITIAL_TOURNAMENT);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [fieldText, setFieldText] = useState("");
  const [activeTab, setActiveTab] = useState("tournaments");
  const [newParticipant, setNewParticipant] = useState({ email: "", displayName: "" });
  const [participantStatus, setParticipantStatus] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load all tournaments
      const tournamentsSnap = await getDocs(collection(db, "tournaments"));
      const tournList = tournamentsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          const da = a.startDate?.toDate ? a.startDate.toDate() : new Date(a.startDate || 0);
          const db2 = b.startDate?.toDate ? b.startDate.toDate() : new Date(b.startDate || 0);
          return da - db2;
        });
      setTournaments(tournList);

      // Load all users
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
    setLoading(false);
  }

  function generateTournamentKey(name, year) {
    return `${year}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "")}`;
  }

  async function handleSaveTournament(e) {
    e.preventDefault();
    try {
      const key =
        editingTournament ||
        generateTournamentKey(formData.shortName || formData.name, formData.year);

      const { lat, lon, imageUrl, ...rest } = formData;
      const data = {
        ...rest,
        year: parseInt(rest.year),
        startDate: rest.startDate
          ? Timestamp.fromDate(new Date(rest.startDate + "T07:00:00"))
          : null,
        endDate: rest.endDate
          ? Timestamp.fromDate(new Date(rest.endDate + "T23:59:59"))
          : null,
      };
      if (lat && lon) {
        data.coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
      }
      if (imageUrl) {
        data.imageUrl = imageUrl.trim();
      }

      await setDoc(doc(db, "tournaments", key), data, { merge: true });
      setEditingTournament(null);
      setFormData(INITIAL_TOURNAMENT);
      loadData();
    } catch (err) {
      console.error("Error saving tournament:", err);
      alert("Failed to save tournament: " + err.message);
    }
  }

  function handleEditTournament(tourn) {
    setEditingTournament(tourn.id);
    setFormData({
      name: tourn.name || "",
      shortName: tourn.shortName || "",
      year: tourn.year || new Date().getFullYear(),
      startDate: tourn.startDate?.toDate
        ? tourn.startDate.toDate().toISOString().split("T")[0]
        : tourn.startDate || "",
      endDate: tourn.endDate?.toDate
        ? tourn.endDate.toDate().toISOString().split("T")[0]
        : tourn.endDate || "",
      venue: tourn.venue || "",
      location: tourn.location || "",
      espnEventId: tourn.espnEventId || "",
      status: tourn.status || "upcoming",
      lat: tourn.coordinates?.lat ?? "",
      lon: tourn.coordinates?.lon ?? "",
      imageUrl: tourn.imageUrl || "",
    });
    // Scroll to form
    setTimeout(() => {
      document.getElementById("tournament-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function handleDeleteTournament(tournId) {
    if (!window.confirm(`Delete tournament "${tournId}"?`)) return;
    try {
      await deleteDoc(doc(db, "tournaments", tournId));
      loadData();
    } catch (err) {
      console.error("Error deleting tournament:", err);
    }
  }

  async function handleImportField(tournamentKey) {
    setActionStatus((s) => ({ ...s, [`field_${tournamentKey}`]: "loading" }));
    try {
      const result = await callImportField({ tournamentKey });
      setActionStatus((s) => ({
        ...s,
        [`field_${tournamentKey}`]: `Imported ${result.data.count} golfers`,
      }));

      // Find tournament name and send notification
      const tournament = tournaments.find((t) => t.id === tournamentKey);
      if (tournament) {
        notifyFieldImported(tournament.name);
      }

      loadData();
    } catch (err) {
      setActionStatus((s) => ({
        ...s,
        [`field_${tournamentKey}`]: `Error: ${err.message}`,
      }));
    }
  }

  async function handleImportResults(tournamentKey) {
    setActionStatus((s) => ({
      ...s,
      [`results_${tournamentKey}`]: "loading",
    }));
    try {
      const result = await callImportResults({ tournamentKey });
      setActionStatus((s) => ({
        ...s,
        [`results_${tournamentKey}`]: `Imported ${result.data.count} results`,
      }));
      loadData();
    } catch (err) {
      setActionStatus((s) => ({
        ...s,
        [`results_${tournamentKey}`]: `Error: ${err.message}`,
      }));
    }
  }

  async function handleCalculateStandings(year) {
    setActionStatus((s) => ({ ...s, [`standings_${year}`]: "loading" }));
    try {
      const result = await callCalculateStandings({ year });
      setActionStatus((s) => ({
        ...s,
        [`standings_${year}`]: `Calculated for ${result.data.count} users`,
      }));
    } catch (err) {
      setActionStatus((s) => ({
        ...s,
        [`standings_${year}`]: `Error: ${err.message}`,
      }));
    }
  }

  async function handleEditField(tournamentKey) {
    const fieldDoc = await getDoc(doc(db, "fields", tournamentKey));
    if (fieldDoc.exists()) {
      const golfers = fieldDoc.data().golfers || [];
      setFieldText(golfers.map((g) => g.name).join("\n"));
    } else {
      setFieldText("");
    }
    setEditingField(tournamentKey);
  }

  async function handleSaveField() {
    if (!editingField) return;
    const names = fieldText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    const golfers = names.map((name) => ({ name, country: "" }));
    await setDoc(doc(db, "fields", editingField), { golfers });
    setEditingField(null);
    setFieldText("");
  }

  async function toggleAdmin(userId, currentIsAdmin) {
    try {
      await updateDoc(doc(db, "users", userId), {
        isAdmin: !currentIsAdmin,
      });
      loadData();
    } catch (err) {
      console.error("Error toggling admin:", err);
    }
  }

  async function handleCreateParticipant(e) {
    e.preventDefault();
    setParticipantStatus({ type: "loading" });
    try {
      const result = await callCreateParticipant({
        email: newParticipant.email,
        displayName: newParticipant.displayName,
      });
      setParticipantStatus({
        type: "success",
        resetLink: result.data.resetLink,
        displayName: newParticipant.displayName,
      });
      setNewParticipant({ email: "", displayName: "" });
      loadData();
    } catch (err) {
      setParticipantStatus({ type: "error", message: err.message });
    }
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
      <h1 className="text-2xl font-heading text-gold-500 uppercase">
        Admin Panel
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/20 pb-2">
        {["tournaments", "users"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t text-sm font-heading uppercase ${
              activeTab === tab
                ? "bg-white/10 text-gold-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Tournaments Tab ─── */}
      {activeTab === "tournaments" && (
        <div className="space-y-6">
          {/* Tournament Form */}
          <div
            id="tournament-form"
            className={`rounded p-4 ${editingTournament ? "bg-gold-500/20 border-2 border-gold-500" : "bg-white/10"}`}
          >
            <h2 className="font-heading text-lg text-gold-400 uppercase mb-3">
              {editingTournament ? `Editing: ${editingTournament}` : "Add Tournament"}
            </h2>
            <form
              onSubmit={handleSaveTournament}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <input
                type="text"
                placeholder="Tournament Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Short Name (e.g. masters)"
                value={formData.shortName}
                onChange={(e) =>
                  setFormData({ ...formData, shortName: e.target.value })
                }
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Year"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="ESPN Event ID"
                value={formData.espnEventId}
                onChange={(e) =>
                  setFormData({ ...formData, espnEventId: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="date"
                placeholder="Start Date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="date"
                placeholder="End Date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Venue"
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Location (e.g. Augusta, GA)"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.lat}
                onChange={(e) =>
                  setFormData({ ...formData, lat: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.lon}
                onChange={(e) =>
                  setFormData({ ...formData, lon: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Image URL (right-click image → Copy image address)"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400 sm:col-span-2"
              />
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
              >
                <option value="upcoming">Upcoming</option>
                <option value="field_set">Field Set</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-heading uppercase"
                >
                  {editingTournament ? "Update" : "Add"}
                </button>
                {editingTournament && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTournament(null);
                      setFormData(INITIAL_TOURNAMENT);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Calculate Standings */}
          <div className="bg-white/10 rounded p-4">
            <span className="font-heading text-sm text-gold-400 uppercase block mb-3">
              Recalculate Standings
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {[...new Set(tournaments.map((t) => t.year))].sort((a, b) => b - a).map((yr) => (
                <div key={yr} className="flex items-center gap-2">
                  <button
                    onClick={() => handleCalculateStandings(yr)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Calculate {yr}
                  </button>
                  {actionStatus[`standings_${yr}`] && (
                    <span className="text-xs text-gray-300">
                      {actionStatus[`standings_${yr}`]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tournament List */}
          <div className="space-y-3">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="bg-white/10 rounded p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading text-gold-400 uppercase">
                      {t.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {t.id} — ESPN ID: {t.espnEventId || "not set"} —
                      Status: {t.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTournament(t)}
                      className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTournament(t.id)}
                      className="text-xs bg-red-900/50 hover:bg-red-800 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Import Field */}
                  <button
                    onClick={() => handleImportField(t.id)}
                    disabled={!t.espnEventId}
                    className={`text-xs px-3 py-1.5 rounded ${
                      t.espnEventId
                        ? "bg-green-700 hover:bg-green-600 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Import Field
                  </button>

                  {/* Import Results */}
                  <button
                    onClick={() => handleImportResults(t.id)}
                    disabled={!t.espnEventId}
                    className={`text-xs px-3 py-1.5 rounded ${
                      t.espnEventId
                        ? "bg-blue-700 hover:bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Import Results
                  </button>

                  {/* Edit Field */}
                  <button
                    onClick={() => handleEditField(t.id)}
                    className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded"
                  >
                    Edit Field
                  </button>
                </div>

                {/* Action Status */}
                {(actionStatus[`field_${t.id}`] ||
                  actionStatus[`results_${t.id}`]) && (
                  <div className="mt-2 text-xs text-gray-300">
                    {actionStatus[`field_${t.id}`] && (
                      <p>
                        Field:{" "}
                        {actionStatus[`field_${t.id}`] === "loading"
                          ? "Importing..."
                          : actionStatus[`field_${t.id}`]}
                      </p>
                    )}
                    {actionStatus[`results_${t.id}`] && (
                      <p>
                        Results:{" "}
                        {actionStatus[`results_${t.id}`] === "loading"
                          ? "Importing..."
                          : actionStatus[`results_${t.id}`]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Add Participant */}
          <div className="bg-white/10 rounded p-4">
            <h2 className="font-heading text-lg text-gold-400 uppercase mb-3">
              Add Participant
            </h2>
            <form onSubmit={handleCreateParticipant} className="flex flex-wrap gap-3 items-end">
              <input
                type="email"
                placeholder="Email"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400 flex-1 min-w-[200px]"
              />
              <input
                type="text"
                placeholder="Display Name"
                value={newParticipant.displayName}
                onChange={(e) => setNewParticipant({ ...newParticipant, displayName: e.target.value })}
                required
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-400 flex-1 min-w-[200px]"
              />
              <button
                type="submit"
                disabled={participantStatus?.type === "loading"}
                className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-heading uppercase disabled:opacity-50"
              >
                {participantStatus?.type === "loading" ? "Creating..." : "Create Account"}
              </button>
            </form>
            {participantStatus?.type === "success" && (
              <div className="mt-3 bg-green-900/30 border border-green-700 rounded p-3">
                <p className="text-sm text-green-300 mb-1">
                  Account created for {participantStatus.displayName}!
                </p>
                <p className="text-xs text-gray-300 mb-2">
                  Send this password-reset link to the participant:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={participantStatus.resetLink}
                    className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(participantStatus.resetLink);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            {participantStatus?.type === "error" && (
              <p className="mt-2 text-sm text-red-400">{participantStatus.message}</p>
            )}
          </div>

          {/* User List */}
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white/10 rounded p-3 flex items-center justify-between"
            >
              <div>
                <span className="text-sm">{u.displayName || u.email}</span>
                <span className="text-xs text-gray-400 ml-2">{u.email}</span>
              </div>
              <button
                onClick={() => toggleAdmin(u.id, u.isAdmin)}
                className={`text-xs px-3 py-1 rounded ${
                  u.isAdmin
                    ? "bg-red-700 hover:bg-red-600"
                    : "bg-green-700 hover:bg-green-600"
                }`}
              >
                {u.isAdmin ? "Remove Admin" : "Make Admin"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Field Edit Modal ─── */}
      {editingField && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-golf-green-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h2 className="font-heading text-lg text-gold-400 uppercase mb-3">
              Edit Field: {editingField}
            </h2>
            <p className="text-xs text-gray-400 mb-2">
              One golfer name per line.
            </p>
            <textarea
              value={fieldText}
              onChange={(e) => setFieldText(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm font-mono min-h-[300px] resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditingField(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-heading uppercase"
              >
                Save Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
