import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

const MastersPage = () => {
  // Mock odds data for The Masters
  const oddsData = [
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

  return (
    <BaseTournamentPage
      name="The Masters Tournament"
      startDate="2025-04-11"
      endDate="2025-04-14"
      venue="Augusta National Golf Club"
      location="Augusta, GA"
      description="The Masters Tournament, one of golf's four major championships, is held annually at Augusta National Golf Club. Known for its iconic green jacket, Amen Corner, and the pristine beauty of its course, The Masters is the first major of the year and one of the most prestigious events in golf."
      weatherLocation="Augusta,GA"
      oddsData={oddsData}
    />
  );
};

export default MastersPage; 