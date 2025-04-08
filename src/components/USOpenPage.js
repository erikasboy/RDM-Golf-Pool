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
  const tournamentData = {
    name: 'U.S. Open',
    startDate: '2025-06-13',
    endDate: '2025-06-16',
    venue: 'Pinehurst No. 2',
    location: 'Pinehurst, NC',
    description: 'The U.S. Open, one of golf\'s four major championships, returns to Pinehurst No. 2. Known for its challenging conditions and demanding test of golf.',
    weatherLocation: 'Pinehurst, NC',
    oddsData: null // Will be populated when available
  };

  return <BaseTournamentPage {...tournamentData} />;
};

export default USOpenPage; 