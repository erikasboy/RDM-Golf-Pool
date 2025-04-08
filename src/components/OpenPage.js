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
  const tournamentData = {
    name: 'The Open Championship',
    startDate: '2025-07-18',
    endDate: '2025-07-21',
    venue: 'Royal Troon Golf Club',
    location: 'Troon, Scotland',
    description: 'The Open Championship, one of golf\'s four major championships, returns to Royal Troon. Known for its links-style course and challenging weather conditions.',
    weatherLocation: 'Troon, Scotland',
    oddsData: null // Will be populated when available
  };

  return <BaseTournamentPage {...tournamentData} />;
};

export default OpenPage; 