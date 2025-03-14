import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

// Mock odds data for testing
const mockOddsData = [
  { name: "Rory McIlroy", odds: "+800" },
  { name: "Scottie Scheffler", odds: "+900" },
  { name: "Jon Rahm", odds: "+1000" },
  { name: "Viktor Hovland", odds: "+1200" },
  { name: "Tommy Fleetwood", odds: "+1500" },
  { name: "Jordan Spieth", odds: "+1800" },
  { name: "Justin Rose", odds: "+2000" },
  { name: "Shane Lowry", odds: "+2500" },
  { name: "Tyrrell Hatton", odds: "+3000" },
  { name: "Matt Fitzpatrick", odds: "+3500" },
  { name: "Max Homa", odds: "+4000" },
  { name: "Cameron Young", odds: "+4500" },
  { name: "Collin Morikawa", odds: "+5000" },
  { name: "Patrick Cantlay", odds: "+5500" },
  { name: "Xander Schauffele", odds: "+6000" }
];

const OpenPage = () => {
  // Mock odds data for The Open Championship
  const oddsData = [
    { name: "Rory McIlroy", odds: "+800" },
    { name: "Scottie Scheffler", odds: "+1000" },
    { name: "Jon Rahm", odds: "+1200" },
    { name: "Viktor Hovland", odds: "+1500" },
    { name: "Patrick Cantlay", odds: "+1800" },
    { name: "Xander Schauffele", odds: "+2000" },
    { name: "Collin Morikawa", odds: "+2200" },
    { name: "Justin Thomas", odds: "+2500" },
    { name: "Jordan Spieth", odds: "+2800" },
    { name: "Matt Fitzpatrick", odds: "+3000" },
    { name: "Brooks Koepka", odds: "+3500" },
    { name: "Tony Finau", odds: "+4000" },
    { name: "Max Homa", odds: "+4500" },
    { name: "Sam Burns", odds: "+5000" },
    { name: "Justin Rose", odds: "+5500" }
  ];

  return (
    <BaseTournamentPage
      name="The Open Championship"
      startDate="2025-07-17"
      endDate="2025-07-20"
      venue="Royal Troon Golf Club"
      location="Troon, Scotland"
      description="The Open Championship returns to Royal Troon, a classic links course known for its challenging back nine and the famous Postage Stamp hole."
      weatherLocation="Troon,Scotland"
      oddsData={oddsData}
    />
  );
};

export default OpenPage; 