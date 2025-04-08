import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXsCjdajXcnsw7B57bLB2B3_H2AGPcDYc",
  authDomain: "golf-pool-app.firebaseapp.com",
  projectId: "golf-pool-app",
  storageBucket: "golf-pool-app.firebasestorage.app",
  messagingSenderId: "242781444799",
  appId: "1:242781444799:web:b8bdf62d57ee522ed3040a",
  measurementId: "G-ZJKBSB8DRY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadPicksFromDocx(filePath) {
  try {
    // Read the .docx file
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    // Parse the text into picks
    const lines = text.split('\n').filter(line => line.trim());
    const picks = {};

    for (const line of lines) {
      // Split by colon first to separate name from picks
      const [userName, rest] = line.split(':').map(s => s.trim());
      if (!userName || !rest) continue;

      // Split the rest by comma and remove the points column
      const parts = rest.split(',').map(p => p.trim());
      if (parts.length < 4) {
        console.warn(`Warning: ${userName} has ${parts.length} picks instead of 4`);
        continue;
      }

      // Take only the first 4 parts (ignoring points)
      const players = parts.slice(0, 4);
      picks[userName] = players;
    }

    // Save picks to Firestore
    for (const [userName, players] of Object.entries(picks)) {
      const picksData = {
        golfers: players.map(name => ({
          Name: name,
          // Note: PlayerID will need to be looked up from the golf API
          PlayerID: null // We'll need to implement this lookup
        })),
        timestamp: new Date(),
        tournamentId: 'tpc-2025'
      };

      // Get all users and find the one matching the displayName
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userDoc = usersSnapshot.docs.find(doc => 
        doc.data().displayName.toLowerCase() === userName.toLowerCase()
      );

      if (userDoc) {
        await setDoc(userDoc.ref, { picks: picksData }, { merge: true });
        console.log(`Saved picks for ${userName} (${userDoc.id})`);
      } else {
        console.warn(`Warning: Could not find user document for ${userName}`);
      }
    }

    console.log('Successfully loaded all picks');
  } catch (error) {
    console.error('Error loading picks:', error);
  }
}

// Get the .docx file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide the path to the .docx file');
  process.exit(1);
}

loadPicksFromDocx(filePath); 