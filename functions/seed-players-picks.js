/**
 * One-time script to:
 * 1. Set ESPN Event ID for 2026 Players Championship
 * 2. Insert participant picks from the PDF into Firestore
 *
 * Run from the functions/ directory: node seed-players-picks.js
 */
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const TOURNAMENT_KEY = "2026_players";
const ESPN_EVENT_ID = "401811937";
const YEAR = 2026;

// Picks from the PDF
const picksByParticipant = [
  { name: "Bill Nash",        golfers: ["Collin Morikawa", "Chris Gotterup", "Si Woo Kim", "Min Woo Lee"] },
  { name: "Melissa Dean",     golfers: ["Tommy Fleetwood", "Akshay Bhatia", "Hideki Matsuyama", "Min Woo Lee"] },
  { name: "Rob Dean",         golfers: ["Collin Morikawa", "Akshay Bhatia", "Si Woo Kim", "Sahith Theegala"] },
  { name: "Jim Dhondt",       golfers: ["Ludvig Aberg", "Akshay Bhatia", "Chris Gotterup", "Min Woo Lee"] },
  { name: "Tom Dean",         golfers: ["Tommy Fleetwood", "Russell Henley", "Si Woo Kim", "Cameron Young"] },
  { name: "Chris Schryer",    golfers: ["Collin Morikawa", "Tommy Fleetwood", "Robert MacIntyre", "Min Woo Lee"] },
  { name: "Glen Soderholm",   golfers: ["Collin Morikawa", "Ludvig Aberg", "Sepp Straka", "Jake Knapp"] },
  { name: "Bill Hazlewood",   golfers: ["Collin Morikawa", "Russell Henley", "Sahith Theegala", "Min Woo Lee"] },
  { name: "Sam Johansen",     golfers: ["Cameron Young", "Russell Henley", "Si Woo Kim", "Min Woo Lee"] },
  { name: "Paul Johansen",    golfers: ["Daniel Berger", "Akshay Bhatia", "Si Woo Kim", "Min Woo Lee"] },
  { name: "Mike Barlow",      golfers: ["Collin Morikawa", "Daniel Berger", "Si Woo Kim", "Cameron Young"] },
];

async function run() {
  // 1. Set ESPN Event ID on the tournament
  console.log(`Setting ESPN Event ID ${ESPN_EVENT_ID} on ${TOURNAMENT_KEY}...`);
  await db.collection("tournaments").doc(TOURNAMENT_KEY).update({
    espnEventId: ESPN_EVENT_ID,
  });
  console.log("  Done.\n");

  // 2. Fetch all existing users and match by displayName
  const usersSnap = await db.collection("users").get();
  const usersByName = {};
  usersSnap.docs.forEach((doc) => {
    const data = doc.data();
    const displayName = (data.displayName || "").trim().toLowerCase();
    usersByName[displayName] = { uid: doc.id, displayName: data.displayName };
  });

  console.log(`Found ${usersSnap.size} users in DB:`);
  for (const [name, info] of Object.entries(usersByName)) {
    console.log(`  ${info.displayName} (${info.uid})`);
  }
  console.log();

  // 3. Match participants to users and insert picks
  const unmatched = [];
  const matched = [];

  for (const pick of picksByParticipant) {
    const key = pick.name.trim().toLowerCase();
    const user = usersByName[key];
    if (!user) {
      unmatched.push(pick.name);
    } else {
      matched.push({ ...pick, uid: user.uid, displayName: user.displayName });
    }
  }

  if (unmatched.length > 0) {
    console.log("WARNING: Could not match these participants to any user:");
    for (const name of unmatched) {
      console.log(`  - "${name}"`);
    }
    console.log("\nAvailable users:");
    for (const [name, info] of Object.entries(usersByName)) {
      console.log(`  - "${info.displayName}"`);
    }
    console.log("\nProceeding with matched participants only.\n");
  }

  console.log(`Inserting ${matched.length} pick documents...\n`);
  for (const pick of matched) {
    const docId = `${TOURNAMENT_KEY}_${pick.uid}`;
    const data = {
      userId: pick.uid,
      tournamentKey: TOURNAMENT_KEY,
      year: YEAR,
      golfers: pick.golfers,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("picks").doc(docId).set(data);
    console.log(`  ${pick.displayName}: ${pick.golfers.join(", ")}`);
  }

  console.log(`\nDone! ${matched.length} picks inserted for ${TOURNAMENT_KEY}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
