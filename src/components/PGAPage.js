import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

// Mock odds data for testing
const mockOddsData = [
  { name: "Scottie Scheffler", odds: "+800" },
  { name: "Rory McIlroy", odds: "+1000" },
  { name: "Jon Rahm", odds: "+1200" },
  { name: "Brooks Koepka", odds: "+1500" },
  { name: "Justin Thomas", odds: "+1800" },
  { name: "Jordan Spieth", odds: "+2000" },
  { name: "Patrick Cantlay", odds: "+2500" },
  { name: "Xander Schauffele", odds: "+3000" },
  { name: "Collin Morikawa", odds: "+3500" },
  { name: "Viktor Hovland", odds: "+4000" },
  { name: "Max Homa", odds: "+4500" },
  { name: "Tony Finau", odds: "+5000" },
  { name: "Cameron Young", odds: "+5500" },
  { name: "Sam Burns", odds: "+6000" },
  { name: "Matt Fitzpatrick", odds: "+6500" }
];

const PGAPage = () => {
  // Mock odds data for the PGA Championship
  const oddsData = [
    { name: "Scottie Scheffler", odds: "+700" },
    { name: "Rory McIlroy", odds: "+1000" },
    { name: "Jon Rahm", odds: "+1200" },
    { name: "Brooks Koepka", odds: "+1500" },
    { name: "Justin Thomas", odds: "+1800" },
    { name: "Jordan Spieth", odds: "+2000" },
    { name: "Patrick Cantlay", odds: "+2200" },
    { name: "Xander Schauffele", odds: "+2500" },
    { name: "Collin Morikawa", odds: "+2800" },
    { name: "Viktor Hovland", odds: "+3000" },
    { name: "Matt Fitzpatrick", odds: "+3500" },
    { name: "Tony Finau", odds: "+4000" },
    { name: "Max Homa", odds: "+4500" },
    { name: "Sam Burns", odds: "+5000" },
    { name: "Justin Rose", odds: "+5500" }
  ];

  return (
    <BaseTournamentPage
      name="PGA Championship"
      startDate="2025-05-16"
      endDate="2025-05-19"
      venue="Valhalla Golf Club"
      location="Louisville, KY"
      description="The PGA Championship returns to Valhalla Golf Club, a Jack Nicklaus-designed course known for its challenging layout and dramatic finishing holes."
      weatherLocation="Louisville,KY"
      oddsData={oddsData}
    />
  );
};

export default PGAPage; 