require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Your Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase config:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set',
  authDomain: firebaseConfig.authDomain ? 'Set' : 'Not set',
  projectId: firebaseConfig.projectId ? 'Set' : 'Not set',
  storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Not set',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Not set',
  appId: firebaseConfig.appId ? 'Set' : 'Not set',
  measurementId: firebaseConfig.measurementId ? 'Set' : 'Not set'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to check user picks
async function checkUserPicks(email, password) {
  try {
    // Sign in
    console.log(`Signing in as ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`Signed in successfully as ${user.email}`);
    
    // Get user picks
    console.log('Fetching user picks...');
    const picksRef = collection(db, 'users', user.uid, 'picks');
    const picksSnapshot = await getDocs(picksRef);
    
    console.log(`Found ${picksSnapshot.size} pick documents`);
    
    // Process each pick document
    const picksData = [];
    picksSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nPick document ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      
      if (data.golfers && data.tournamentName && data.tournamentDate) {
        picksData.push({
          tournamentName: data.tournamentName,
          tournamentDate: data.tournamentDate,
          golfersCount: data.golfers.length,
          firstGolfer: data.golfers[0]
        });
      } else {
        console.log('Missing required fields:', {
          hasGolfers: !!data.golfers,
          hasTournamentName: !!data.tournamentName,
          hasTournamentDate: !!data.tournamentDate
        });
      }
    });
    
    console.log('\nValid picks found:', picksData.length);
    console.log('Picks data:', JSON.stringify(picksData, null, 2));
    
    return picksData;
  } catch (error) {
    console.error('Error checking picks:', error);
    return null;
  }
}

// Replace with your email and password
const email = process.argv[2] || 'your-email@example.com';
const password = process.argv[3] || 'your-password';

checkUserPicks(email, password)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 