import React, { useState } from 'react';
import { testAdminPermissions } from '../utils/adminPermissionTest';

const AdminPermissionTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await testAdminPermissions();
      setTestResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Permission Tests</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Running Tests...' : 'Run Permission Tests'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {testResults && (
        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-xl font-semibold mb-4">Test Results</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-40">Read UserScores:</span>
              <span className={testResults.readUserScores ? 'text-green-600' : 'text-red-600'}>
                {testResults.readUserScores ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="w-40">Write UserScores:</span>
              <span className={testResults.writeUserScores ? 'text-green-600' : 'text-red-600'}>
                {testResults.writeUserScores ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="w-40">Read Admin Data:</span>
              <span className={testResults.readAdminData ? 'text-green-600' : 'text-red-600'}>
                {testResults.readAdminData ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="w-40">Write Admin Data:</span>
              <span className={testResults.writeAdminData ? 'text-green-600' : 'text-red-600'}>
                {testResults.writeAdminData ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {testResults.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Errors:</h4>
              <ul className="list-disc list-inside text-red-600">
                {testResults.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPermissionTest; 