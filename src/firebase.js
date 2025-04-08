// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, browserPopupRedirectResolver, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
console.log('Initializing Firebase with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
console.log('Initializing Firebase auth...');
export const auth = getAuth(app);

// Set persistence to LOCAL
console.log('Setting auth persistence to LOCAL...');
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('Error setting persistence:', error);
});

// Initialize other Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Create Google Auth Provider with custom parameters
const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
  // Disable redirect mode
  redirect_uri: null
});

// Function to sign in with Google using popup
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign in with popup...');
    // Force popup mode with browserPopupRedirectResolver
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    console.log('Google sign in successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('Error during Google sign in:', error);
    throw error;
  }
};

// Tournament schedule for 2025
export const TOURNAMENTS = {
  "players-2025": {
    id: "players-2025",
    name: "The Players Championship",
    startDate: "2025-03-14",
    endDate: "2025-03-17",
    lockTime: "2025-03-14T07:00:00-04:00",
    tournamentId: "1234", // TPC Sawgrass tournament ID
    course: "TPC Sawgrass - Stadium Course",
    description: "The Players Championship is one of the most prestigious events in golf, featuring the strongest field in the sport. The tournament is played at the iconic TPC Sawgrass Stadium Course, home to the famous 17th hole island green."
  },
  "masters-2025": {
    id: "masters-2025",
    name: "The Masters",
    startDate: "2025-04-11",
    endDate: "2025-04-14",
    lockTime: "2025-04-11T07:00:00-04:00",
    tournamentId: "1235", // Augusta National tournament ID
    course: "Augusta National Golf Club",
    description: "The Masters Tournament is one of the four major championships in professional golf. Held annually at Augusta National Golf Club, it is the first major of the year and is known for its traditions, including the green jacket awarded to the winner."
  },
  "pga-2025": {
    id: "pga-2025",
    name: "PGA Championship",
    startDate: "2025-05-16",
    endDate: "2025-05-19",
    lockTime: "2025-05-16T07:00:00-04:00",
    tournamentId: "1236", // Quail Hollow tournament ID
    course: "Quail Hollow Club",
    description: "The PGA Championship is one of the four major championships in professional golf. It is organized by the Professional Golfers' Association of America and is the only major that reserves a majority of its spots for PGA professionals."
  },
  "us-open-2025": {
    id: "us-open-2025",
    name: "U.S. Open",
    startDate: "2025-06-13",
    endDate: "2025-06-16",
    lockTime: "2025-06-13T07:00:00-04:00",
    tournamentId: "1237", // Pinehurst tournament ID
    course: "Pinehurst No. 2",
    description: "The U.S. Open is one of the four major championships in professional golf. It is conducted by the United States Golf Association and is known for its challenging course setups and demanding conditions."
  },
  "open-championship-2025": {
    id: "open-championship-2025",
    name: "The Open Championship",
    startDate: "2025-07-18",
    endDate: "2025-07-21",
    lockTime: "2025-07-18T07:00:00-04:00",
    tournamentId: "1238", // Royal Troon tournament ID
    course: "Royal Troon Golf Club",
    description: "The Open Championship, often referred to as The Open or the British Open, is the oldest of the four major championships in professional golf. It is played on links courses in the United Kingdom and is organized by The R&A."
  }
};

export const isTournamentActive = (tournament) => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  endDate.setHours(23, 59, 59, 999); // Set to end of day

  console.log(`Checking if tournament ${tournament.name} is active:`, {
    now: now.toISOString(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    isActive: now >= startDate && now <= endDate
  });

  // Tournament is active if we're between start and end dates
  return now >= startDate && now <= endDate;
};

export const isTournamentUpcoming = (tournament) => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  startDate.setHours(0, 0, 0, 0); // Set to start of day

  console.log(`Checking if tournament ${tournament.name} is upcoming:`, {
    now: now.toISOString(),
    startDate: startDate.toISOString(),
    isUpcoming: startDate >= now
  });

  // Tournament is upcoming if it starts today or in the future
  return startDate >= now;
};

export async function getCurrentTournament(options = { updateCache: true }) {
  try {
    // Get the current tournament document
    const currentRef = doc(db, 'tournaments', 'current');
    const currentDoc = await getDoc(currentRef);

    // Check if we have a current tournament
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      console.log('Current tournament data from Firestore:', currentData);
      return currentData;
    }

    // If we don't have a current tournament, check the TOURNAMENTS object
    const now = new Date();
    const activeTournament = Object.values(TOURNAMENTS).find(tournament => isTournamentActive(tournament));
    
    if (activeTournament) {
      console.log('Found active tournament in local data:', activeTournament);
      return activeTournament;
    }

    // If no active tournament, find the next upcoming tournament
    const upcomingTournament = Object.values(TOURNAMENTS)
      .filter(tournament => isTournamentUpcoming(tournament))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

    if (upcomingTournament) {
      console.log('Found upcoming tournament:', upcomingTournament);
      return upcomingTournament;
    }

    // If we don't have a current tournament, return null
    console.log('No current or upcoming tournament found');
    return null;
  } catch (error) {
    console.error("Error getting current tournament:", error);
    throw error;
  }
}