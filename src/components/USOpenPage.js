import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

// Mock odds data for testing
const mockOddsData = [
  { name: "Scottie Scheffler", odds: "+700" },
  { name: "Rory McIlroy", odds: "+900" },
  { name: "Jon Rahm", odds: "+1000" },
  { name: "Brooks Koepka", odds: "+1200" },
  { name: "Justin Thomas", odds: "+1500" },
  { name: "Jordan Spieth", odds: "+1800" },
  { name: "Patrick Cantlay", odds: "+2000" },
  { name: "Xander Schauffele", odds: "+2500" },
  { name: "Collin Morikawa", odds: "+3000" },
  { name: "Viktor Hovland", odds: "+3500" },
  { name: "Max Homa", odds: "+4000" },
  { name: "Tony Finau", odds: "+4500" },
  { name: "Cameron Young", odds: "+5000" },
  { name: "Sam Burns", odds: "+5500" },
  { name: "Matt Fitzpatrick", odds: "+6000" }
];

const USOpenPage = () => {
  // Mock odds data for the US Open
  const oddsData = [
    { name: "Scottie Scheffler", odds: "+800" },
    { name: "Rory McIlroy", odds: "+1000" },
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
      name="US Open"
      startDate="2025-06-12"
      endDate="2025-06-15"
      venue="Pinehurst No. 2"
      location="Pinehurst, NC"
      description="The US Open returns to Pinehurst No. 2, Donald Ross's masterpiece known for its challenging turtleback greens and strategic bunkering."
      weatherLocation="Pinehurst,NC"
      oddsData={oddsData}
    />
  );
};

export default USOpenPage; 