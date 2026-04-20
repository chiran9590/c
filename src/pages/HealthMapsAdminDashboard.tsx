import React, { useState, useEffect } from 'react';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';
import { healthMapsAuthService, Profile } from '../services/healthMapsAuthService';
import { clubsService, Club } from '../services/clubsService';
import { uploadService } from '../services/uploadService';
import toast from 'react-hot-toast';

const HealthMapsAdminDashboard: React.FC = () => {
  const { profile, signOut } = useHealthMapsAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'clubs' | 'uploads'>('users');
  
  // Users state
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Clubs state
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [selectedClubForUser, setSelectedClubForUser] = useState<string>('');
  const [selectedUserForClub, setSelectedUserForClub] = useState<string>('');
  
  // Uploads state
  const [uploads, setUploads] = useState<any[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [selectedClubForUpload, setSelectedClubForUpload] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'clubs') fetchClubs();
    if (activeTab === 'uploads') fetchUploads();
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { users: allUsers, error } = await healthMapsAuthService.getAllUsers();
      if (error) {
        toast.error(error);
      } else {
        setUsers(allUsers || []);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchClubs = async () => {
    setClubsLoading(true);
    try {
      const { clubs: allClubs, error } = await clubsService.getAllClubs();
      if (error) {
        toast.error(error);
      } else {
        setClubs(allClubs || []);
      }
    } catch (error) {
      toast.error('Failed to fetch clubs');
    } finally {
      setClubsLoading(false);
    }
  };

  const fetchUploads = async () => {
    setUploadsLoading(true);
    try {
      const { uploads: allUploads, error } = await uploadService.getAllUploads();
      if (error) {
        toast.error(error);
      } else {
        setUploads(allUploads || []);
      }
    } catch (error) {
      toast.error('Failed to fetch uploads');
    } finally {
      setUploadsLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClub.name.trim()) {
      toast.error('Club name is required');
      return;
    }

    try {
      const { club, error } = await clubsService.createClub(newClub);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Club created successfully');
        setNewClub({ name: '', description: '' });
        setShowCreateClub(false);
        fetchClubs();
      }
    } catch (error) {
      toast.error('Failed to create club');
    }
  };

  const handleAssignUserToClub = async () => {
    if (!selectedUserForClub || !selectedClubForUser) {
      toast.error('Please select both user and club');
      return;
    }

    try {
      const { success, error } = await clubsService.assignUserToClub({
        user_id: selectedUserForClub,
        club_id: selectedClubForUser
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('User assigned to club successfully');
        setSelectedUserForClub('');
        setSelectedClubForUser('');
      }
    } catch (error) {
      toast.error('Failed to assign user to club');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedClubForUpload) {
      toast.error('Please select a file and club');
      return;
    }

    try {
      const { success, error } = await uploadService.uploadFile(selectedClubForUpload, uploadFile);
      if (error) {
        toast.error(error);
      } else {
        toast.success('File uploaded successfully');
        setUploadFile(null);
        setSelectedClubForUpload('');
        fetchUploads();
      }
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      const { success, error } = await uploadService.deleteUpload(uploadId);
      if (error) {
        toast.error(error);
      } else {
        toast.success('File deleted successfully');
        fetchUploads();
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Maps Admin</h1>
              <p className="text-gray-600">Welcome, {profile?.name}!</p>
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['users', 'clubs', 'uploads'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  User Management
                </h3>
                
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.phone || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clubs Tab */}
          {activeTab === 'clubs' && (
            <div className="space-y-6">
              {/* Create Club Form */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Club Management
                    </h3>
                    <button
                      onClick={() => setShowCreateClub(!showCreateClub)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create New Club
                    </button>
                  </div>

                  {showCreateClub && (
                    <form onSubmit={handleCreateClub} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Club Name</label>
                        <input
                          type="text"
                          value={newClub.name}
                          onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          placeholder="Enter club name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={newClub.description}
                          onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          rows={3}
                          placeholder="Enter club description"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Create Club
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateClub(false)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Assign User to Club */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Assign User to Club
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Select User</label>
                      <select
                        value={selectedUserForClub}
                        onChange={(e) => setSelectedUserForClub(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      >
                        <option value="">Choose a user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Select Club</label>
                      <select
                        value={selectedClubForUser}
                        onChange={(e) => setSelectedClubForUser(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      >
                        <option value="">Choose a club...</option>
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAssignUserToClub}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Assign User
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clubs List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    All Clubs
                  </h3>
                  
                  {clubsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading clubs...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clubs.map((club) => (
                        <div key={club.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{club.name}</h4>
                          {club.description && (
                            <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {new Date(club.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <div className="space-y-6">
              {/* Upload Form */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Upload Files
                  </h3>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Select Club</label>
                      <select
                        value={selectedClubForUpload}
                        onChange={(e) => setSelectedClubForUpload(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                        required
                      >
                        <option value="">Choose a club...</option>
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Select File</label>
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        accept="image/*"
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Upload File
                    </button>
                  </form>
                </div>
              </div>

              {/* Uploads List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    All Uploads
                  </h3>
                  
                  {uploadsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading uploads...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              File Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Club
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Uploaded By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {uploads.map((upload) => (
                            <tr key={upload.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {upload.file_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {upload.clubs?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {upload.profiles?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(upload.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a
                                  href={uploadService.getFileUrl(upload.file_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  View
                                </a>
                                <button
                                  onClick={() => handleDeleteUpload(upload.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HealthMapsAdminDashboard;
