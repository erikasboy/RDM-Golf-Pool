import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

// Mock odds data for testing
const mockOddsData = [
  { name: "Scottie Scheffler", odds: "+500" },
  { name: "Justin Thomas", odds: "+1200" },
  { name: "Jordan Spieth", odds: "+1500" },
  { name: "Sam Burns", odds: "+1800" },
  { name: "Tony Finau", odds: "+2000" },
  { name: "Justin Rose", odds: "+2500" },
  { name: "Brian Harman", odds: "+3000" },
  { name: "Keegan Bradley", odds: "+3500" },
  { name: "Cameron Young", odds: "+4000" },
  { name: "Tommy Fleetwood", odds: "+4500" },
  { name: "Matt Fitzpatrick", odds: "+5000" },
  { name: "Max Homa", odds: "+5500" },
  { name: "Sungjae Im", odds: "+6000" },
  { name: "Corey Conners", odds: "+6500" },
  { name: "Russell Henley", odds: "+7000" }
];

const NextWeekendPage = () => {
  // Mock odds data for the Valspar Championship
  const oddsData = [
    { name: "Scottie Scheffler", odds: "+800" },
    { name: "Justin Thomas", odds: "+1200" },
    { name: "Jordan Spieth", odds: "+1500" },
    { name: "Sam Burns", odds: "+1800" },
    { name: "Tony Finau", odds: "+2000" },
    { name: "Matt Fitzpatrick", odds: "+2200" },
    { name: "Justin Rose", odds: "+2500" },
    { name: "Tommy Fleetwood", odds: "+2800" },
    { name: "Keegan Bradley", odds: "+3000" },
    { name: "Brian Harman", odds: "+3500" },
    { name: "Adam Hadwin", odds: "+4000" },
    { name: "Cam Young", odds: "+4500" },
    { name: "Taylor Moore", odds: "+5000" },
    { name: "Nick Taylor", odds: "+5500" },
    { name: "Davis Riley", odds: "+6000" }
  ];

  return (
    <BaseTournamentPage
      name="Valspar Championship"
      startDate="2025-03-20"
      endDate="2025-03-23"
      venue="Innisbrook Resort"
      location="Palm Harbor, FL"
      description="The Valspar Championship is played on the Copperhead Course at Innisbrook Resort, known for its challenging layout and signature Snake Pit stretch of holes 16-18."
      weatherLocation="Palm Harbor,FL"
      oddsData={oddsData}
    />
  );
};

export default NextWeekendPage; 