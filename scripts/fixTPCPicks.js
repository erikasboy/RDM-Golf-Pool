import { db, auth } from './firebase.js';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

const fixTPCPicks = async () => {
  try {
    console.log('Starting to fix TPC picks...');
    
    // Sign in with admin credentials
    const adminEmail = 'admin@rdmpool.com';
    const adminPassword = 'Admin2025!';
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Successfully authenticated as admin');
      
      // Ensure admin user has the correct role
      const adminDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(adminDocRef, {
        displayName: 'Admin User',
        email: adminEmail,
        role: 'admin',
        isTestAccount: false
      }, { merge: true });
      console.log('Updated admin user role');
      
    } catch (error) {
      console.error('Failed to authenticate or update admin:', error);
      return;
    }
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.size} users`);
    
    let updatedCount = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Skip admin user
      if (userData.role === 'admin') {
        console.log('Skipping admin user:', userData.displayName);
        continue;
      }
      
      console.log('Processing user:', userData.displayName || userDoc.id);
      
      // Get user's picks
      const picksRef = collection(db, 'users', userDoc.id, 'picks');
      const picksSnapshot = await getDocs(picksRef);
      
      // Find and update Valspar Championship picks
      for (const pickDoc of picksSnapshot.docs) {
        const pickData = pickDoc.data();
        
        if (pickData.tournamentName === 'Valspar Championship') {
          console.log(`Found Valspar Championship picks for ${userData.displayName || userDoc.id}`);
          
          // Update the tournament name to The Players Championship
          await updateDoc(doc(db, 'users', userDoc.id, 'picks', pickDoc.id), {
            tournamentName: 'The Players Championship',
            tournamentDate: '2025-03-13' // Update to TPC date
          });
          
          console.log(`Updated picks for ${userData.displayName || userDoc.id}`);
          updatedCount++;
        }
      }
    }
    
    console.log(`Successfully updated ${updatedCount} picks from Valspar Championship to The Players Championship`);
  } catch (error) {
    console.error('Error fixing TPC picks:', error);
  }
};

// Run the fix
fixTPCPicks(); 