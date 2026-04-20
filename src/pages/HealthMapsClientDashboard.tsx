import React, { useState, useEffect } from 'react';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';
import { clubsService, Club } from '../services/clubsService';
import { uploadService } from '../services/uploadService';
import toast from 'react-hot-toast';

const HealthMapsClientDashboard: React.FC = () => {
  const { user, profile, signOut } = useHealthMapsAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);

  useEffect(() => {
    fetchUserClubs();
  }, []);

  const fetchUserClubs = async () => {
    try {
      const { clubs: userClubs, error } = await clubsService.getUserClubs();
      
      if (error) {
        toast.error(error);
      } else {
        setClubs(userClubs || []);
        if (userClubs && userClubs.length > 0) {
          setSelectedClub(userClubs[0]);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClub) {
      fetchClubUploads(selectedClub.id);
    }
  }, [selectedClub]);

  const fetchClubUploads = async (clubId: string) => {
    setUploadsLoading(true);
    try {
      const { uploads: clubUploads, error } = await uploadService.getClubUploads(clubId);
      
      if (error) {
        toast.error(error);
      } else {
        setUploads(clubUploads || []);
      }
    } catch (error) {
      toast.error('Failed to fetch uploads');
    } finally {
      setUploadsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Maps</h1>
              <p className="text-gray-600">Welcome to your Golf Club Dashboard, {profile?.name}!</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clubs Section */}
            <div className="lg:col-span-1">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Your Golf Clubs
                  </h3>
                  
                  {clubs.length === 0 ? (
                    <p className="text-gray-500">You are not assigned to any golf clubs yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {clubs.map((club) => (
                        <div
                          key={club.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedClub?.id === club.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedClub(club)}
                        >
                          <h4 className="font-medium text-gray-900">{club.name}</h4>
                          {club.description && (
                            <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Uploads Section */}
            <div className="lg:col-span-2">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {selectedClub ? `${selectedClub.name} - Files` : 'Select a Golf Club'}
                  </h3>
                  
                  {!selectedClub ? (
                    <p className="text-gray-500">Please select a golf club to view files.</p>
                  ) : uploadsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading files...</p>
                    </div>
                  ) : uploads.length === 0 ? (
                    <p className="text-gray-500">No files uploaded for this club yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {uploads.map((upload) => (
                        <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {upload.file_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Uploaded by {upload.profiles?.name} • {new Date(upload.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a
                                href={uploadService.getFileUrl(upload.file_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-sm text-gray-900">{profile?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{profile?.role}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthMapsClientDashboard;
