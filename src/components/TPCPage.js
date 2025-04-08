import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

const TPCPage = () => {
  const tournamentData = {
    name: 'The Players Championship',
    startDate: '2025-03-14',
    endDate: '2025-03-17',
    venue: 'TPC Sawgrass',
    location: 'Ponte Vedra Beach, FL',
    description: 'The Players Championship, often referred to as the \'fifth major\', is one of the most prestigious events in professional golf. Held annually at TPC Sawgrass, this tournament features the strongest field in golf and is known for its challenging Stadium Course, particularly the iconic 17th hole island green.',
    weatherLocation: 'Ponte Vedra Beach, FL',
    oddsData: null // Will be populated when available
  };

  return <BaseTournamentPage {...tournamentData} />;
};

export default TPCPage; 