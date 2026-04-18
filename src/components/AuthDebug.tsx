import React, { useState } from 'react';
import { useAuth } from '../context/EnhancedAuthContext';

const AuthDebug: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Auth Debug Info</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {expanded && (
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">User:</span> {user ? JSON.stringify(user, null, 2) : 'null'}
          </div>
          <div>
            <span className="font-medium">Profile:</span> {profile ? JSON.stringify(profile, null, 2) : 'null'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;
