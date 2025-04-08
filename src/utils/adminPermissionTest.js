import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const testAdminPermissions = async () => {
  const db = getFirestore();
  const auth = getAuth();
  const results = {
    readUserScores: false,
    writeUserScores: false,
    readAdminData: false,
    writeAdminData: false,
    errors: []
  };

  try {
    // Test reading userScores collection
    const testUserScoreRef = doc(db, 'userScores', 'test-doc');
    await getDoc(testUserScoreRef);
    results.readUserScores = true;
  } catch (error) {
    results.errors.push(`Failed to read userScores: ${error.message}`);
  }

  try {
    // Test writing to userScores collection
    const testUserScoreRef = doc(db, 'userScores', 'test-doc');
    await setDoc(testUserScoreRef, { test: true });
    await deleteDoc(testUserScoreRef);
    results.writeUserScores = true;
  } catch (error) {
    results.errors.push(`Failed to write to userScores: ${error.message}`);
  }

  try {
    // Test reading admin data
    const adminDataRef = doc(db, 'adminData', 'test-doc');
    await getDoc(adminDataRef);
    results.readAdminData = true;
  } catch (error) {
    results.errors.push(`Failed to read adminData: ${error.message}`);
  }

  try {
    // Test writing to admin data
    const adminDataRef = doc(db, 'adminData', 'test-doc');
    await setDoc(adminDataRef, { test: true });
    await deleteDoc(adminDataRef);
    results.writeAdminData = true;
  } catch (error) {
    results.errors.push(`Failed to write to adminData: ${error.message}`);
  }

  return results;
}; 