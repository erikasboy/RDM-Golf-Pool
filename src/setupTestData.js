import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Function to add test picks for a past tournament
export const addTestPicks = async (userId) => {
  console.log("Starting addTestPicks for userId:", userId);
  
  // Test data for The Masters (previous tournament)
  const testPicks = {
    golfers: [
      {
        PlayerID: 40001274,  // Scottie Scheffler
        Name: "Scottie Scheffler"
      },
      {
        PlayerID: 40003218,  // Viktor Hovland
        Name: "Viktor Hovland"
      },
      {
        PlayerID: 40000965,  // Rory McIlroy
        Name: "Rory McIlroy"
      },
      {
        PlayerID: 40000004,  // Jordan Spieth
        Name: "Jordan Spieth"
      }
    ],
    timestamp: new Date('2025-02-15'),  // Past date
    tournamentId: 'masters-2025'
  };

  try {
    console.log("Attempting to write test picks to Firestore...");
    const docRef = doc(db, 'users', userId, 'picks', 'masters-2025');
    console.log("Document reference created:", docRef.path);
    
    // Add picks for The Masters
    await setDoc(docRef, testPicks);
    console.log('Test picks added successfully to Firestore');
    return true;
  } catch (error) {
    console.error('Error adding test picks:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}; 