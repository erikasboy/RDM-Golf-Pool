import React from 'react';
import BaseTournamentPage from './BaseTournamentPage';

const MastersPage = () => {
  const tournamentData = {
    name: 'The Masters Tournament',
    startDate: '2025-04-11',
    endDate: '2025-04-14',
    venue: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    description: 'The Masters Tournament, one of golf\'s four major championships, is held annually at Augusta National Golf Club. Known for its iconic green jacket, Amen Corner, and the pristine beauty of its course.',
    weatherLocation: 'Augusta, GA',
    oddsData: null // Will be populated when available
  };

  return <BaseTournamentPage {...tournamentData} />;
};

export default MastersPage; 