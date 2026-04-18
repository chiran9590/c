import React, { useState, useEffect } from 'react';
import { Users, Building, Plus, Trash2, UserPlus, UserMinus, Edit } from 'lucide-react';
import { 
  getAllUsers, 
  createNewUser, 
  deleteUser, 
  updateUserRole,
  getAllClubs,
  createClub,
  deleteClub,
  getAllAssignments,
  assignUserToClub,
  removeUserFromClub,
  updateUserClubAssignment,
  getUnassignedUsers,
  UserProfile,
  Club,
  NewUserData,
  NewClubData,
  UserClubAssignment
} from '../services/completeAdminService';
import { useAuth } from '../context/EnhancedAuthContext';
import { useToast } from '../context/ToastContext';

const CompleteAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUserData>({
    email: '',
    password: '',
    full_name: '',
    phone_number: ''
  });
  
  // Club Management State
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [showClubModal, setShowClubModal] = useState(false);
  const [newClub, setNewClub] = useState<NewClubData>({
    club_name: ''
  });
  
  // Assignment Management State
  const [assignments, setAssignments] = useState<UserClubAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading admin dashboard data...');
      setLoadingUsers(true);
      setLoadingClubs(true);
      setLoadingAssignments(true);
      
      const [usersData, clubsData, assignmentsData] = await Promise.all([
        getAllUsers(),
        getAllClubs(),
        getAllAssignments()
      ]);
      
      console.log('Data loaded:', { usersData, clubsData, assignmentsData });
      
      setUsers(usersData);
      setClubs(clubsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error', 'Failed to load admin data');
    } finally {
      setLoadingUsers(false);
      setLoadingClubs(false);
      setLoadingAssignments(false);
    }
  };

  // User Management Functions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNewUser(newUser);
      showSuccess('Success', `User ${newUser.full_name} created successfully`);
      setNewUser({ email: '', password: '', full_name: '', phone_number: '' });
      setShowUserModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Error', 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    
    try {
      await deleteUser(userId);
      showSuccess('Success', `${userName} deleted successfully`);
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Error', 'Failed to delete user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'client' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      showSuccess('Success', 'User role updated successfully');
      loadData();
    } catch (error) {
      console.error('Error updating user role:', error);
      showError('Error', 'Failed to update user role');
    }
  };

  // Club Management Functions
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating club:', newClub);
      const createdClub = await createClub(newClub);
      console.log('Club created successfully:', createdClub);
      
      showSuccess('Success', `Club ${newClub.club_name} created successfully`);
      setNewClub({ club_name: '' });
      setShowClubModal(false);
      
      // Refresh clubs list for real-time update
      const updatedClubs = await getAllClubs();
      setClubs(updatedClubs);
      console.log('Clubs refreshed:', updatedClubs);
    } catch (error) {
      console.error('Error creating club:', error);
      showError('Error', 'Failed to create club');
    }
  };

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${clubName}?`)) return;
    
    try {
      console.log('Deleting club:', clubId, clubName);
      await deleteClub(clubId);
      console.log('Club deleted successfully');
      
      showSuccess('Success', `${clubName} deleted successfully`);
      
      // Refresh clubs list for real-time update
      const updatedClubs = await getAllClubs();
      setClubs(updatedClubs);
      console.log('Clubs refreshed after deletion:', updatedClubs);
    } catch (error) {
      console.error('Error deleting club:', error);
      showError('Error', 'Failed to delete club');
    }
  };

  // Assignment Management Functions
  const handleAssignUserToClub = async () => {
    if (!selectedUser || !selectedClub) return;
    
    try {
      await assignUserToClub(selectedUser, selectedClub, user?.id || '');
      showSuccess('Success', 'User assigned to club successfully');
      setSelectedUser('');
      setSelectedClub('');
      setShowAssignmentModal(false);
      loadData();
    } catch (error) {
      console.error('Error assigning user to club:', error);
      showError('Error', 'Failed to assign user to club');
    }
  };

  const handleRemoveUserFromClub = async (assignmentId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from club?`)) return;
    
    try {
      await removeUserFromClub(
        assignments.find(a => a.id === assignmentId)?.user_id || '',
        assignments.find(a => a.id === assignmentId)?.club_id || ''
      );
      showSuccess('Success', 'User removed from club successfully');
      loadData();
    } catch (error) {
      console.error('Error removing user from club:', error);
      showError('Error', 'Failed to remove user from club');
    }
  };

  const getUnassignedUsersForClub = (clubId: string) => {
    const assignedUserIds = assignments
      .filter(a => a.club_id === clubId)
      .map(a => a.user_id);
    
    return users.filter(u => !assignedUserIds.includes(u.id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Management Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
            
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'client' | 'admin')}
                              className="text-sm border-gray-300 rounded focus:ring-blue-500"
                            >
                              <option value="client">Client</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Club Management Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Club Management</h2>
              <button
                onClick={() => setShowClubModal(true)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Club
              </button>
            </div>
            
            {loadingClubs ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : clubs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Building className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500">No clubs available</p>
                <p className="text-sm text-gray-400 mt-1">Create your first club to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-2">
                  Showing {clubs.length} club{clubs.length !== 1 ? 's' : ''}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clubs.map((club) => (
                        <tr key={club.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <Building className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {club.club_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {club.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {new Date(club.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(club.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteClub(club.id, club.club_name)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Delete club"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* User-Club Assignment Section */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Assign Users to Clubs</h2>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Assignment
              </button>
            </div>
            
            {loadingAssignments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {assignment.user_profile?.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.user_profile?.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.user_profile?.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">
                        → {assignment.club?.club_name}
                      </span>
                      <button
                        onClick={() => handleRemoveUserFromClub(assignment.id, assignment.user_profile?.full_name || '')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New User</h3>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={newUser.phone_number}
                      onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Club Modal */}
        {showClubModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Club</h3>
              <form onSubmit={handleCreateClub}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Club Name</label>
                    <input
                      type="text"
                      required
                      value={newClub.club_name}
                      onChange={(e) => setNewClub({...newClub, club_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowClubModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Club
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Assign User to Club</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Club</label>
                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500"
                  >
                    <option value="">Choose a club...</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.club_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                  onClick={handleAssignUserToClub}
                  disabled={!selectedUser || !selectedClub}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Assign User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteAdminDashboard;
