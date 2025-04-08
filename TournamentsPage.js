import React, { useState, useEffect } from 'react';

const TournamentsPage = () => {
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [field, setField] = useState([]);

  useEffect(() => {
    const fetchFieldData = async () => {
      const response = await fetch(`/api/field?tournament=${next.id}`);
      const data = await response.json();
      setField(data);
    };

    fetchFieldData();
  }, [next.id]);

  return (
    <div className="field-section mt-8">
      <h2 className="text-2xl font-bold mb-4">Tournament Field</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {field.slice(0, showAllPlayers ? field.length : 30).map((player) => (
          <div key={player.PlayerID} className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold">{player.Name}</div>
            <div className="text-gray-600">{player.Country}</div>
            <div className="text-sm text-gray-500">Rank: {player.Rank || 'N/A'}</div>
          </div>
        ))}
      </div>
      {field.length > 30 && (
        <button
          onClick={() => setShowAllPlayers(!showAllPlayers)}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          {showAllPlayers ? 'Show Less' : 'View More'}
        </button>
      )}
    </div>
  );
};

export default TournamentsPage; 