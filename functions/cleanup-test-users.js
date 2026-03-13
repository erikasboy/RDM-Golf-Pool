/**
 * One-time script to remove participant_ prefixed test user docs.
 * Run from the functions/ directory: node cleanup-test-users.js
 */
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanup() {
  const usersSnap = await db.collection("users").get();

  const testUsers = usersSnap.docs.filter(doc => doc.id.startsWith("participant_"));

  if (testUsers.length === 0) {
    console.log("No participant_ prefixed test users found.");
    process.exit(0);
  }

  console.log(`Found ${testUsers.length} test user docs to delete:`);
  for (const doc of testUsers) {
    console.log(`  - ${doc.id}: ${doc.data().displayName || doc.data().email}`);
  }

  console.log("\nDeleting...");
  for (const doc of testUsers) {
    await db.collection("users").doc(doc.id).delete();
    console.log(`  Deleted ${doc.id}`);
  }

  console.log("\nDone! Cleaned up test user documents.");
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
