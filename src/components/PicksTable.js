import React from 'react';
import './HomePage.css';

const PicksTable = ({ tournamentName, picks, users, poolStandings }) => {
  return (
    <div className="picks-table">
      <h3>{tournamentName} Picks</h3>
      <table>
        <thead>
          <tr>
            <th>Participant</th>
            <th>Pick 1</th>
            <th>Pick 2</th>
            <th>Pick 3</th>
            <th>Pick 4</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>
                {picks[user.name]?.[0]?.name || '-'}
                {picks[user.name]?.[0]?.name && (
                  <div className="pick-points">
                    {(() => {
                      const playerName = picks[user.name][0].name;
                      const playerResult = poolStandings.find(s => s.name === user.name)?.playerResults?.[playerName];
                      if (!playerResult) return 'No points';
                      if (playerResult.notFound) return 'Player not found';
                      if (playerResult.missedCut) {
                        if (playerResult.isWithdrawn) {
                          return 'Withdrawn: 0 pts';
                        }
                        return 'Missed cut: -2 pts';
                      }
                      return `${playerResult.rank}th place: ${playerResult.points} pts`;
                    })()}
                  </div>
                )}
              </td>
              <td>
                {picks[user.name]?.[1]?.name || '-'}
                {picks[user.name]?.[1]?.name && (
                  <div className="pick-points">
                    {(() => {
                      const playerName = picks[user.name][1].name;
                      const playerResult = poolStandings.find(s => s.name === user.name)?.playerResults?.[playerName];
                      if (!playerResult) return 'No points';
                      if (playerResult.notFound) return 'Player not found';
                      if (playerResult.missedCut) {
                        if (playerResult.isWithdrawn) {
                          return 'Withdrawn: 0 pts';
                        }
                        return 'Missed cut: -2 pts';
                      }
                      return `${playerResult.rank}th place: ${playerResult.points} pts`;
                    })()}
                  </div>
                )}
              </td>
              <td>
                {picks[user.name]?.[2]?.name || '-'}
                {picks[user.name]?.[2]?.name && (
                  <div className="pick-points">
                    {(() => {
                      const playerName = picks[user.name][2].name;
                      const playerResult = poolStandings.find(s => s.name === user.name)?.playerResults?.[playerName];
                      if (!playerResult) return 'No points';
                      if (playerResult.notFound) return 'Player not found';
                      if (playerResult.missedCut) {
                        if (playerResult.isWithdrawn) {
                          return 'Withdrawn: 0 pts';
                        }
                        return 'Missed cut: -2 pts';
                      }
                      return `${playerResult.rank}th place: ${playerResult.points} pts`;
                    })()}
                  </div>
                )}
              </td>
              <td>
                {picks[user.name]?.[3]?.name || '-'}
                {picks[user.name]?.[3]?.name && (
                  <div className="pick-points">
                    {(() => {
                      const playerName = picks[user.name][3].name;
                      const playerResult = poolStandings.find(s => s.name === user.name)?.playerResults?.[playerName];
                      if (!playerResult) return 'No points';
                      if (playerResult.notFound) return 'Player not found';
                      if (playerResult.missedCut) {
                        if (playerResult.isWithdrawn) {
                          return 'Withdrawn: 0 pts';
                        }
                        return 'Missed cut: -2 pts';
                      }
                      return `${playerResult.rank}th place: ${playerResult.points} pts`;
                    })()}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PicksTable; 