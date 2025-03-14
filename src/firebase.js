// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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
console.log('Initializing Firebase app...');
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
console.log('Initializing Firebase auth...');
export const auth = getAuth(app);

// Set persistence to LOCAL (survives browser restart)
console.log('Setting auth persistence to LOCAL...');
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('Auth persistence set to LOCAL successfully');
}).catch(error => {
  console.error('Error setting auth persistence:', error);
});

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  console.log('Global auth state changed:', user ? `User: ${user.email}` : 'No user');
  console.log('Auth change details:', {
    timestamp: new Date().toISOString(),
    hasUser: !!user,
    redirectFlag: localStorage.getItem('authRedirect'),
    currentURL: window.location.href,
    provider: user?.providerData?.[0]?.providerId
  });
  if (user) {
    console.log('User details:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
      metadata: user.metadata
    });
  }
});

export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add login_hint if we have a previous email
  login_hint: localStorage.getItem('lastLoginEmail') || undefined
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// Add authentication helper functions
export const signInWithGoogle = async (useRedirect = true) => {
  console.log('Starting Google sign in process...');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  try {
    // Clear any existing auth state
    localStorage.removeItem('authRedirect');
    localStorage.removeItem('authStartTime');
    localStorage.removeItem('authAttempt');
    localStorage.removeItem('lastAuthAttempt');
    
    // Sign out current user if any
    if (auth.currentUser) {
      console.log('Signing out current user before new sign in:', auth.currentUser.email);
      await auth.signOut();
    }

    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      login_hint: localStorage.getItem('lastLoginEmail') || undefined
    });

    // On mobile, try popup first as it's more reliable
    if (isMobile) {
      try {
        console.log('Attempting popup sign-in on mobile...');
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          console.log('Popup sign-in successful');
          localStorage.setItem('lastLoginEmail', result.user.email);
          return result;
        }
      } catch (popupError) {
        console.log('Popup sign-in failed, falling back to redirect:', popupError.message);
        // Fall through to redirect flow
      }
    }

    if (useRedirect || isMobile) {
      console.log('Using redirect flow for sign in');
      // Set new auth state
      const timestamp = Date.now();
      localStorage.setItem('authRedirect', 'true');
      localStorage.setItem('authStartTime', timestamp.toString());
      localStorage.setItem('authAttempt', 'google');
      localStorage.setItem('lastAuthAttempt', timestamp.toString());
      
      // Log the current URL before redirect
      console.log('Current URL before redirect:', window.location.href);
      console.log('Setting up redirect state:', {
        timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent,
        isMobile
      });
      
      // Ensure persistence is set before redirect
      console.log('Ensuring persistence is set...');
      await setPersistence(auth, browserLocalPersistence);
      
      // Configure additional parameters for mobile
      if (isMobile) {
        googleProvider.setCustomParameters({
          ...googleProvider.customParameters,
          // Force OAuth to use Safari's in-app browser
          mobile: '1',
          redirect_uri: window.location.origin
        });
      }
      
      // Initiate the redirect
      console.log('Initiating redirect to Google...');
      await signInWithRedirect(auth, googleProvider);
      console.log('Redirect initiated successfully');
      
      // Log the final state before redirect
      console.log('Final state before redirect:', {
        authRedirect: localStorage.getItem('authRedirect'),
        authAttempt: localStorage.getItem('authAttempt'),
        lastAuthAttempt: localStorage.getItem('lastAuthAttempt'),
        currentUrl: window.location.href
      });
    } else {
      console.log('Using popup flow for sign in');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.setItem('lastLoginEmail', result.user.email);
      }
      return result;
    }
  } catch (error) {
    console.error("Error in signInWithGoogle:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    if (error.email) console.error("Error email:", error.email);
    if (error.credential) console.error("Error credential:", error.credential);
    
    localStorage.removeItem('authRedirect');
    localStorage.removeItem('authStartTime');
    localStorage.removeItem('authAttempt');
    localStorage.removeItem('lastAuthAttempt');
    throw error;
  }
};

// Handle redirect result with timeout
export const handleRedirectResult = async () => {
  console.log('Checking for redirect result...');
  console.log('Redirect check details:', {
    timestamp: new Date().toISOString(),
    currentURL: window.location.href,
    hasUser: !!auth.currentUser,
    redirectFlag: localStorage.getItem('authRedirect'),
    attemptType: localStorage.getItem('authAttempt'),
    startTime: localStorage.getItem('authStartTime'),
    searchParams: window.location.search,
    hash: window.location.hash
  });
  
  // Check if we're in a redirect flow
  if (!localStorage.getItem('authRedirect')) {
    console.log('No redirect in progress, checking for pending auth...');
    
    // Check if we have a pending auth that's recent (within last 2 minutes)
    const lastAttempt = parseInt(localStorage.getItem('lastAuthAttempt') || '0');
    const timeSinceLastAttempt = Date.now() - lastAttempt;
    console.log('Auth timing:', {
      lastAttempt: new Date(lastAttempt).toISOString(),
      timeSinceLastAttempt,
      isRecent: timeSinceLastAttempt < 120000
    });
    
    if (timeSinceLastAttempt < 120000) {
      console.log('Recent auth attempt found, checking redirect result anyway');
    } else {
      console.log('No recent auth attempt found');
      return null;
    }
  }

  try {
    console.log('Getting redirect result...');
    const result = await getRedirectResult(auth);
    console.log('Redirect result received:', result ? 'Success' : 'No result');
    
    if (result?.user) {
      console.log('User successfully signed in:', result.user.email);
      console.log('User ID:', result.user.uid);
      console.log('Email verified:', result.user.emailVerified);
      console.log('Provider data:', result.user.providerData);
      
      // Store the email for future sign-ins
      localStorage.setItem('lastLoginEmail', result.user.email);
      
      // Double-check the auth state
      const currentUser = auth.currentUser;
      console.log('Current auth state after redirect:', currentUser ? `User: ${currentUser.email}` : 'No user');
      
      // Ensure the auth state persists
      await setPersistence(auth, browserLocalPersistence);
      
      // Only clear auth state after successful sign in
      localStorage.removeItem('authRedirect');
      localStorage.removeItem('authStartTime');
      localStorage.removeItem('authAttempt');
      localStorage.removeItem('lastAuthAttempt');
    } else {
      console.log('No user from redirect result');
      console.log('Current auth state:', auth.currentUser ? `User: ${auth.currentUser.email}` : 'No user');
      // Don't clear auth state if we're still waiting for the redirect
      if (!localStorage.getItem('authRedirect')) {
        localStorage.removeItem('authStartTime');
        localStorage.removeItem('authAttempt');
        localStorage.removeItem('lastAuthAttempt');
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error in handleRedirectResult:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    if (error.email) console.error("Error email:", error.email);
    if (error.credential) console.error("Error credential:", error.credential);
    
    // Clear auth state on error
    localStorage.removeItem('authRedirect');
    localStorage.removeItem('authStartTime');
    localStorage.removeItem('authAttempt');
    localStorage.removeItem('lastAuthAttempt');
    
    // Throw a more specific error
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Sign in was not completed. Please try again.');
    } else if (error.code === 'auth/timeout') {
      throw new Error('Sign in timed out. Please try again.');
    } else {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }
};

// Tournament schedule for 2025
const TOURNAMENTS = {
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

const isTournamentActive = (tournament) => {
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

const isTournamentUpcoming = (tournament) => {
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

    // If we don't have a current tournament, return null
    console.log('No current tournament found in Firestore');
    return null;
  } catch (error) {
    console.error("Error getting current tournament:", error);
    throw error;
  }
}