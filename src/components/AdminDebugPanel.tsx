import React, { useState } from 'react';
import { useAuth } from '../context/EnhancedAuthContext';

const AdminDebugPanel: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const getAuthStatus = () => {
    if (loading) return 'Loading...';
    if (!user) return 'Not Authenticated';
    if (!profile) return 'No Profile';
    if (profile.role === 'admin') return 'Admin User';
    return 'Client User';
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-yellow-800">Admin Debug Panel</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-yellow-600 hover:text-yellow-800"
        >
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {expanded && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="font-medium">Auth Status:</span>
            <span className="text-yellow-700">{getAuthStatus()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">User ID:</span>
            <span className="text-yellow-700">{user?.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">User Email:</span>
            <span className="text-yellow-700">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Profile Role:</span>
            <span className="text-yellow-700">{profile?.role || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Profile Name:</span>
            <span className="text-yellow-700">{profile?.full_name || 'N/A'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDebugPanel;
