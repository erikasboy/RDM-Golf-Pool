/**
 * One-time script to seed 2026 tournament data.
 * Run from the functions/ directory: node seed-2026.js
 */
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const tournaments = [
  {
    id: "2026_players",
    name: "The Players Championship",
    shortName: "players",
    year: 2026,
    venue: "TPC Sawgrass",
    location: "Ponte Vedra Beach, FL",
    startDate: new Date("2026-03-12T07:00:00"),
    endDate: new Date("2026-03-15T23:59:59"),
    espnEventId: "",
    status: "upcoming",
    coordinates: { lat: 30.1975, lon: -81.3959 },
  },
  {
    id: "2026_masters",
    name: "The Masters",
    shortName: "masters",
    year: 2026,
    venue: "Augusta National Golf Club",
    location: "Augusta, GA",
    startDate: new Date("2026-04-09T07:00:00"),
    endDate: new Date("2026-04-12T23:59:59"),
    espnEventId: "",
    status: "upcoming",
    coordinates: { lat: 33.5021, lon: -82.0232 },
  },
  {
    id: "2026_pga",
    name: "PGA Championship",
    shortName: "pga",
    year: 2026,
    venue: "Aronimink Golf Club",
    location: "Newtown Square, PA",
    startDate: new Date("2026-05-14T07:00:00"),
    endDate: new Date("2026-05-17T23:59:59"),
    espnEventId: "",
    status: "upcoming",
    coordinates: { lat: 39.9722, lon: -75.3908 },
  },
  {
    id: "2026_us_open",
    name: "U.S. Open",
    shortName: "us_open",
    year: 2026,
    venue: "Shinnecock Hills Golf Club",
    location: "Southampton, NY",
    startDate: new Date("2026-06-18T07:00:00"),
    endDate: new Date("2026-06-21T23:59:59"),
    espnEventId: "",
    status: "upcoming",
    coordinates: { lat: 40.8892, lon: -72.4453 },
  },
  {
    id: "2026_open",
    name: "The Open Championship",
    shortName: "open",
    year: 2026,
    venue: "Royal Portrush Golf Club",
    location: "Portrush, Northern Ireland",
    startDate: new Date("2026-07-16T07:00:00"),
    endDate: new Date("2026-07-19T23:59:59"),
    espnEventId: "",
    status: "upcoming",
    coordinates: { lat: 55.2064, lon: -6.6553 },
  },
];

async function seed() {
  for (const t of tournaments) {
    const { id, ...data } = t;
    data.startDate = admin.firestore.Timestamp.fromDate(data.startDate);
    data.endDate = admin.firestore.Timestamp.fromDate(data.endDate);
    await db.collection("tournaments").doc(id).set(data, { merge: true });
    console.log(`Seeded ${id}: ${data.name}`);
  }
  console.log("Done! 5 tournaments seeded for 2026.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
