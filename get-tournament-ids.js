const fetch = require('node-fetch');
require('dotenv').config();

async function getTournamentIds() {
  const apiKey = process.env.REACT_APP_SPORTDATA_API_KEY;
  
  try {
    const url = `https://api.sportsdata.io/golf/v2/json/Tournaments/2025?key=${apiKey}`;
    console.log('Fetching tournaments from:', url.replace(apiKey, 'HIDDEN_KEY'));
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tournaments = await response.json();
    console.log(`Found ${tournaments.length} tournaments`);
    
    // Extract tournament IDs and names
    const tournamentInfo = tournaments.map(t => ({
      id: t.TournamentID,
      name: t.Name,
      startDate: t.StartDate,
      endDate: t.EndDate,
      venue: t.Venue,
      location: t.Location
    }));
    
    console.log('\nTournament IDs:');
    tournamentInfo.forEach(t => {
      console.log(`${t.id}: ${t.name} (${t.startDate} to ${t.endDate})`);
      console.log(`   Venue: ${t.venue}, ${t.location}`);
    });
    
    // Look for major tournaments
    const majorTournaments = tournamentInfo.filter(t => 
      t.name.includes('Masters') || 
      t.name.includes('PGA Championship') || 
      t.name.includes('U.S. Open') || 
      t.name.includes('Open Championship') ||
      t.name.includes('Players Championship')
    );
    
    console.log('\nMajor Tournaments:');
    majorTournaments.forEach(t => {
      console.log(`${t.id}: ${t.name} (${t.startDate} to ${t.endDate})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTournamentIds().catch(console.error); 