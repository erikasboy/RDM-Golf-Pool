import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const createTestUser = async (firstName, lastName, email, password) => {
  try {
    // Check if user already exists
    const userDocRef = doc(db, 'users', email);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log(`User ${email} already exists, skipping creation`);
      return userDoc.id;
    }

    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create the user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      displayName: `${firstName} ${lastName}`,
      email: email,
      isTestAccount: true,
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      role: 'test_user',
      // Add fields that might be useful if we convert to real accounts
      phoneNumber: null,
      profilePicUrl: null,
      preferences: {
        emailNotifications: false,
        pushNotifications: false
      },
      // Add a field to track if this was a converted test account
      convertedFromTest: false,
      // Add a field to track when the account was converted (if applicable)
      convertedAt: null
    });

    return userCredential.user.uid;
  } catch (error) {
    console.error(`Error creating user ${firstName} ${lastName}:`, error);
    throw error;
  }
};

const createTestPick = async (userId, tournamentName, tournamentDate, golfers) => {
  try {
    // Check if pick already exists for this tournament
    const picksRef = collection(db, 'users', userId, 'picks');
    const existingPicks = await getDocs(picksRef);
    const tournamentExists = existingPicks.docs.some(doc => 
      doc.data().tournamentName === tournamentName && 
      doc.data().tournamentDate === tournamentDate
    );

    if (tournamentExists) {
      console.log(`Pick for ${tournamentName} already exists for user ${userId}, skipping`);
      return;
    }

    await addDoc(collection(db, 'users', userId, 'picks'), {
      tournamentName,
      tournamentDate,
      golfers,
      isTestPick: true,
      importedAt: new Date(),
      // Add fields that might be useful if we convert to real picks
      status: 'active',
      lastModified: new Date(),
      // Add a field to track if this was a converted test pick
      convertedFromTest: false,
      // Add a field to track when the pick was converted (if applicable)
      convertedAt: null
    });
  } catch (error) {
    console.error(`Error creating pick for user ${userId}:`, error);
    throw error;
  }
};

const participants = [
  {
    firstName: 'Bill',
    lastName: 'Nash',
    picks: [
      { name: 'Michael Kim', odds: '1500' },
      { name: 'Ludvig Aberg', odds: '1500' },
      { name: 'Jason Day', odds: '1500' },
      { name: 'Sepp Straka', odds: '1500' }
    ]
  },
  {
    firstName: 'Melissa',
    lastName: 'Dean',
    picks: [
      { name: 'Sahith Theegala', odds: '1500' },
      { name: 'Ludvig Aberg', odds: '1500' },
      { name: 'Collin Morikawa', odds: '1500' },
      { name: 'Patrick Cantlay', odds: '1500' }
    ]
  },
  {
    firstName: 'Rob',
    lastName: 'Dean',
    picks: [
      { name: 'Justin Thomas', odds: '1500' },
      { name: 'Russell Henley', odds: '1500' },
      { name: 'Collin Morikawa', odds: '1500' },
      { name: 'Sepp Straka', odds: '1500' }
    ]
  },
  {
    firstName: 'Jim',
    lastName: 'Dhondt',
    picks: [
      { name: 'Justin Thomas', odds: '1500' },
      { name: 'Ludvig Aberg', odds: '1500' },
      { name: 'Shane Lowry', odds: '1500' },
      { name: 'Sepp Straka', odds: '1500' }
    ]
  },
  {
    firstName: 'Tom',
    lastName: 'Dean',
    picks: [
      { name: 'Keegan Bradley', odds: '1500' },
      { name: 'Hideki Matsuyama', odds: '1500' },
      { name: 'Corey Conners', odds: '1500' },
      { name: 'Ludvig Aberg', odds: '1500' }
    ]
  },
  {
    firstName: 'Chris',
    lastName: 'Schryer',
    picks: [
      { name: 'Hideki Matsuyama', odds: '1500' },
      { name: 'Ludvig Aberg', odds: '1500' },
      { name: 'Collin Morikawa', odds: '1500' },
      { name: 'Tommy Fleetwood', odds: '1500' }
    ]
  },
  {
    firstName: 'Glen',
    lastName: 'Soderholm',
    picks: [
      { name: 'Daniel Berger', odds: '1500' },
      { name: 'Hideki Matsuyama', odds: '1500' },
      { name: 'Corey Conners', odds: '1500' },
      { name: 'Tommy Fleetwood', odds: '1500' }
    ]
  },
  {
    firstName: 'Bill',
    lastName: 'Hazlewood',
    picks: [
      { name: 'Keegan Bradley', odds: '1500' },
      { name: 'Tommy Fleetwood', odds: '1500' },
      { name: 'Collin Morikawa', odds: '1500' },
      { name: 'Sepp Straka', odds: '1500' }
    ]
  },
  {
    firstName: 'Sam',
    lastName: 'Johansen',
    picks: [
      { name: 'Justin Thomas', odds: '1500' },
      { name: 'Will Zalatoris', odds: '1500' },
      { name: 'Corey Conners', odds: '1500' },
      { name: 'Shane Lowry', odds: '1500' }
    ]
  },
  {
    firstName: 'Paul',
    lastName: 'Johansen',
    picks: [
      { name: 'Justin Thomas', odds: '1500' },
      { name: 'Hideki Matsuyama', odds: '1500' },
      { name: 'Russell Henley', odds: '1500' },
      { name: 'Sepp Straka', odds: '1500' }
    ]
  },
  {
    firstName: 'Mike',
    lastName: 'Barlow',
    picks: [
      { name: 'Nick Taylor', odds: '1500' },
      { name: 'Harold English', odds: '1500' },
      { name: 'Patrick Cantlay', odds: '1500' },
      { name: 'Sepp Straka', odds: '1500' }
    ]
  },
  {
    firstName: 'Matt',
    lastName: 'Barlow',
    picks: [
      { name: 'Michael Kim', odds: '1500' },
      { name: 'Hideki Matsuyama', odds: '1500' },
      { name: 'Collin Morikawa', odds: '1500' },
      { name: 'Shane Lowry', odds: '1500' }
    ]
  }
];

const main = async () => {
  try {
    console.log('Starting test user creation...');
    
    // Create an admin account first
    const adminEmail = 'admin@rdmpool.com';
    const adminPassword = 'Admin2025!';
    
    try {
      await createTestUser('Admin', 'User', adminEmail, adminPassword);
      console.log('Created admin user');
    } catch (error) {
      console.log('Admin user might already exist, continuing...');
    }
    
    for (const participant of participants) {
      try {
        // Create email and password
        const email = `tpc_${participant.firstName.toLowerCase()}_${participant.lastName.toLowerCase()}@rdmpool.com`;
        const password = `tpc${participant.firstName}${participant.lastName}2025!`;
        
        // Create the user
        const userId = await createTestUser(
          participant.firstName,
          participant.lastName,
          email,
          password
        );
        
        console.log(`Created user: ${participant.firstName} ${participant.lastName}`);
        
        // Create their pick for The Players Championship
        await createTestPick(
          userId,
          'The Players Championship',
          '2025-03-13',
          participant.picks
        );
        
        console.log(`Created picks for: ${participant.firstName} ${participant.lastName}`);
      } catch (error) {
        console.error(`Failed to process participant ${participant.firstName} ${participant.lastName}:`, error);
        // Continue with next participant even if one fails
        continue;
      }
    }
    
    console.log('All test users and picks created successfully!');
    console.log('\nImportant: Please save these credentials securely:');
    console.log('Admin Account:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error in main process:', error);
  }
};

main(); 