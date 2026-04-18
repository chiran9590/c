import React, { useState, useEffect } from 'react';
import { Building, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/EnhancedAuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';


interface Club {
  id: string;
  club_name: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  club_id: string | null;
}

interface ClubWithUserCount extends Club {
  user_count: number;
}

const AdminManageClubs: React.FC = () => {
  const [clubs, setClubs] = useState<ClubWithUserCount[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const { } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch clubs with user counts
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select(`
          id,
          club_name,
          created_at
        `);
      
      if (clubsError) throw clubsError;
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, club_id');
      
      if (usersError) throw usersError;
      
      // Calculate user counts manually
      const clubsWithCounts: ClubWithUserCount[] = clubsData.map((club: any) => ({
        id: club.id,
        club_name: club.club_name,
        created_at: club.created_at,
        user_count: usersData.filter((user: Profile) => user.club_id === club.id).length
      }));
      
      setClubs(clubsWithCounts);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const createNewClub = async () => {
    if (!newClubName.trim()) {
      showError('Error', 'Please enter a club name');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Check for duplicate club name
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', newClubName.trim())
        .single();
      
      if (existingClub) {
        showError('Error', 'A club with this name already exists');
        return;
      }
      
      // Create new club
      const { error } = await supabase
        .from('clubs')
        .insert({ name: newClubName.trim() });
      
      if (error) throw error;
      
      showSuccess('Success', 'Club created successfully');
      setNewClubName('');
      fetchData();
    } catch (error) {
      console.error('Error creating club:', error);
      showError('Error', 'Failed to create club');
    } finally {
      setSubmitting(false);
    }
  };
  
  const assignUserToClub = async (userId: string, clubId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ club_id: clubId || null })
        .eq('id', userId);
      
      if (error) throw error;
      
      showSuccess('Success', 'User assigned to club successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning user to club:', error);
      showError('Error', 'Failed to assign user to club');
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Clubs</h1>
        <p className="text-gray-600 mt-2">Create clubs and assign users to them</p>
      </div>

      {/* 1. CLUB MANAGEMENT TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Club Management</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Club Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number of Users
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <Building className="w-5 h-5 text-indigo-600 mr-3" />
                      {club.club_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      {club.user_count}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {clubs.length === 0 && (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No clubs found</p>
          </div>
        )}
      </div>

      {/* 2. CREATE NEW CLUB */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Club</h2>
        
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter club name"
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => e.key === 'Enter' && createNewClub()}
          />
          <button
            onClick={createNewClub}
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create New Club'}
          </button>
        </div>
      </div>

      {/* 3. ASSIGN USERS TO CLUB */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Users to Club</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Club
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assign to Club
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {clubs.find(c => c.id === user.club_id)?.club_name || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <select
                        value={user.club_id || ''}
                        onChange={(e) => assignUserToClub(user.id, e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="">Select a club...</option>
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.club_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-1 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      </div>
  );
};

export default AdminManageClubs;
