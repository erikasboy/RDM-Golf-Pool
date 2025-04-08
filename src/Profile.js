import React, { useState, useEffect } from "react";
import { auth, storage, db } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import './Profile.css';

// Add tournament configurations
const TOURNAMENTS = {
  'masters-2025': {
    name: 'The Masters',
    date: '2025-04-10'
  },
  'tpc-2025': {
    name: 'TPC Sawgrass',
    date: '2025-03-13'
  }
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [tournamentPicks, setTournamentPicks] = useState([]);
  const [currentRank, setCurrentRank] = useState("5th Place");
  const [motownQuote, setMotownQuote] = useState("");

  const motownQuotes = [
    "Ain't no mountain high enough",
    "I heard it through the grapevine",
    "My girl, talking about my girl",
    "Stop! In the name of love",
    "I can't help myself",
    "Reach out, I'll be there",
    "You're all I need to get by",
    "Dancing in the street",
    "What's going on",
    "Signed, sealed, delivered"
  ];

  useEffect(() => {
    // Set a random Motown quote on mount
    const randomIndex = Math.floor(Math.random() * motownQuotes.length);
    setMotownQuote(motownQuotes[randomIndex]);
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          setUser(user);

          // Fetch user document from Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setDisplayName(userDoc.data().displayName || "");
            setProfilePicUrl(userDoc.data().profilePicUrl || "");
          }

          // Fetch user picks
          const picksRef = collection(db, 'users', user.uid, 'picks');
          const picksSnapshot = await getDocs(picksRef);
          
          console.log("Fetched picks snapshot:", picksSnapshot.size, "documents");
          
          const picksData = [];
          
          picksSnapshot.forEach(doc => {
            const data = doc.data();
            console.log("Pick document data:", doc.id, data);
            
            // Get tournament info from our config
            const tournamentInfo = TOURNAMENTS[data.tournamentId];
            
            if (data.golfers && tournamentInfo) {
              console.log("Valid pick found:", {
                tournamentName: tournamentInfo.name,
                tournamentDate: tournamentInfo.date,
                golfersCount: data.golfers.length,
                firstGolfer: data.golfers[0]
              });
              
              picksData.push({
                tournamentName: tournamentInfo.name,
                tournamentDate: tournamentInfo.date,
                golfers: data.golfers
              });
            } else {
              console.log("Invalid pick data (missing required fields):", {
                hasGolfers: !!data.golfers,
                hasTournamentInfo: !!tournamentInfo,
                documentId: doc.id
              });
            }
          });

          // Sort picks by tournament date (newest first)
          picksData.sort((a, b) => new Date(b.tournamentDate) - new Date(a.tournamentDate));
          console.log("Final picks data:", picksData);
          setTournamentPicks(picksData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicUpload = async () => {
    if (!profilePic || !user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      // Create a canvas to crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        // Calculate dimensions to maintain aspect ratio while filling the square
        const size = 150;
        const scale = Math.max(size / img.width, size / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image
        const x = (scaledWidth - size) / 2;
        const y = (scaledHeight - size) / 2;
        
        canvas.width = size;
        canvas.height = size;
        
        // Draw the scaled and centered image
        ctx.drawImage(img, -x, -y, scaledWidth, scaledHeight);

        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        
        // Upload the cropped image
        const fileRef = ref(storage, `profilePics/${user.uid}`);
        await uploadBytes(fileRef, blob);
        
        const downloadURL = await getDownloadURL(fileRef);
        
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          profilePicUrl: downloadURL,
        });

        setProfilePicUrl(downloadURL);
        setSuccessMessage("Profile picture updated successfully!");
        setPreviewImage(null);
      };
      
      img.src = previewImage;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setError("Failed to upload profile picture");
    } finally {
      setLoading(false);
    }
  };

  // Handle display name update
  const handleDisplayNameUpdate = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      // Update Firestore with the new display name
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName,
      });

      setSuccessMessage("Display name updated successfully!");
    } catch (error) {
      console.error("Error updating display name:", error);
      setError("Failed to update display name");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">Profile</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {user && (
          <div className="profile-content">
            <div className="profile-section account-section">
              <div className="account-header">
                <img
                  src={profilePicUrl || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="account-profile-pic"
                />
                <div className="account-details">
                  <h2>{displayName || 'Set Display Name'}</h2>
                  <p className="account-email">{user.email}</p>
                  <p className="account-rank">{currentRank}</p>
                  <p className="account-quote">"{motownQuote}"</p>
                </div>
                <button 
                  className="settings-toggle"
                  onClick={() => setIsProfileSettingsOpen(!isProfileSettingsOpen)}
                >
                  {isProfileSettingsOpen ? 'Hide Settings' : 'Edit Profile'}
                </button>
              </div>

              {isProfileSettingsOpen && (
                <div className="profile-settings">
                  <div className="profile-pic-container">
                    <div className="profile-pic-preview">
                      <img
                        src={previewImage || profilePicUrl || "https://via.placeholder.com/150"}
                        alt="Profile"
                        className="profile-pic"
                      />
                    </div>
                    <div className="profile-pic-actions">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="file-input"
                        id="profile-pic-input"
                      />
                      <label htmlFor="profile-pic-input" className="file-input-label">
                        Choose File
                      </label>
                      <button
                        onClick={handleProfilePicUpload}
                        disabled={!profilePic || loading}
                        className="upload-button"
                      >
                        Make Profile
                      </button>
                    </div>
                  </div>

                  <div className="display-name-container">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      className="display-name-input"
                    />
                    <button
                      onClick={handleDisplayNameUpdate}
                      disabled={loading}
                      className="update-button"
                    >
                      Update Name
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="profile-section picks-section">
              <h2>Tournament Picks</h2>
              <div className="picks-list">
                {tournamentPicks.map((tournament, index) => (
                  <div key={index} className="tournament-picks">
                    <h3>{tournament.tournamentName}</h3>
                    <p className="tournament-date">
                      {new Date(tournament.tournamentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="golfers-list">
                      {tournament.golfers.map((golfer, golferIndex) => (
                        <div key={golferIndex} className="golfer-pick">
                          <span className="golfer-name">{golfer.Name || golfer.name}</span>
                          {golfer.OddsToWin || golfer.Odds || golfer.OddsWin ? (
                            <span className="golfer-odds">+{golfer.OddsToWin || golfer.Odds || golfer.OddsWin}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {tournamentPicks.length === 0 && (
                  <p className="no-picks">No picks made yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;