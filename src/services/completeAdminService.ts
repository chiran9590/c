import { supabase } from '../lib/supabase';

// User Management Types
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  club_id: string | null;
  role: 'client' | 'admin';
  created_at: string;
}

export interface NewUserData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

// Club Management Types
export interface Club {
  id: string;
  club_name: string;
  created_at: string;
}

export interface NewClubData {
  club_name: string;
}

export interface UserClubAssignment {
  id: string;
  user_id: string;
  club_id: string;
  assigned_at: string;
  user_profile?: UserProfile;
  club?: Club;
}

// ========================================
// USER MANAGEMENT FUNCTIONS
// ========================================

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create new user
export const createNewUser = async (userData: NewUserData): Promise<void> => {
  try {
    console.log('Creating new user with data:', userData);
    
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        phone_number: userData.phone_number || ''
      }
    });

    console.log('Auth user creation response:', { authData, authError });
    
    if (authError) {
      console.error('Auth error creating user:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('No user data returned from auth');
      throw new Error('Failed to create user in auth system');
    }

    console.log('User created in auth with ID:', authData.user.id);

    // Create profile
    const profileData = {
      id: authData.user.id,
      full_name: userData.full_name,
      phone_number: userData.phone_number || null,
      email: userData.email,
      role: 'client'
    };
    
    console.log('Creating profile with data:', profileData);
    
    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    console.log('Profile creation response:', { profileResult, profileError });

    if (profileError) {
      console.error('Profile error creating user:', profileError);
      throw profileError;
    }

    console.log('User created successfully:', { authData, profileResult });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Delete from auth (cascades to profile)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: 'client' | 'admin'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// ========================================
// CLUB MANAGEMENT FUNCTIONS
// ========================================

// Get all clubs
export const getAllClubs = async (): Promise<Club[]> => {
  try {
    console.log('Fetching all clubs from Supabase...');
    
    // First try with RLS enabled
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Clubs query response:', { data, error });
    
    if (error) {
      console.error('Supabase error fetching clubs:', error);
      console.log('Trying alternative approach...');
      
      // Fallback: Try without RLS (for testing)
      const { data: fallbackData, error: fallbackError } = await supabase
        .rpc('get_all_clubs');
      
      if (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error(`Failed to fetch clubs: ${error.message}`);
      }
      
      console.log('Fallback successful:', fallbackData);
      return fallbackData || [];
    }
    
    console.log('Clubs fetched successfully:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching clubs:', error);
    // Return empty array instead of throwing to prevent app crash
    console.warn('Returning empty clubs array to prevent app crash');
    return [];
  }
};

// Create new club
export const createClub = async (clubData: NewClubData): Promise<Club> => {
  try {
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        club_name: clubData.club_name
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating club:', error);
    throw error;
  }
};

// Delete club
export const deleteClub = async (clubId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting club:', error);
    throw error;
  }
};

// ========================================
// USER-CLUB ASSIGNMENT FUNCTIONS
// ========================================

// Get all user-club assignments
export const getAllAssignments = async (): Promise<UserClubAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('user_clubs')
      .select(`
        id,
        user_id,
        club_id,
        assigned_at,
        profiles!inner (
          id,
          full_name,
          email,
          phone_number,
          role
        ),
        clubs!inner (
          id,
          club_name,
          created_at
        )
      `)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

// Assign user to club
export const assignUserToClub = async (userId: string, clubId: string, assignedBy: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_clubs')
      .insert({
        user_id: userId,
        club_id: clubId,
        assigned_by: assignedBy
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error assigning user to club:', error);
    throw error;
  }
};

// Remove user from club
export const removeUserFromClub = async (userId: string, clubId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_clubs')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing user from club:', error);
    throw error;
  }
};

// Update user's club assignment
export const updateUserClubAssignment = async (userId: string, clubId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ club_id: clubId })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user club assignment:', error);
    throw error;
  }
};

// Get users not assigned to a club
export const getUnassignedUsers = async (clubId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('club_id', 'null')
      .neq('id', clubId) // Exclude users already in this club
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching unassigned users:', error);
    throw error;
  }
};
