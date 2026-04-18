import { supabase } from '../lib/supabase';

// User Management Services
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: 'client' | 'admin';
  created_at: string;
}

export interface NewUserData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role?: 'client' | 'admin';
}

// Get all users with their profiles
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    // First fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    console.log('Profiles found:', profiles);

    // Then fetch all users from auth
    const { data: users } = await supabase.auth.admin.listUsers();
    
    console.log('Auth users found:', users?.users);

    // Combine the data
    const combinedData = profiles.map((profile: any) => {
      const user = users?.users?.find((u: any) => u.id === profile.id);
      console.log('Matching profile:', profile.id, 'with user:', user?.email);
      return {
        id: profile.id,
        full_name: profile.full_name,
        email: user?.email || profile.email || 'no-email@example.com',
        phone_number: profile.phone_number,
        role: profile.role,
        created_at: profile.created_at
      };
    });

    console.log('Final combined data:', combinedData);
    return combinedData;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create new user (admin only)
export const createNewUser = async (userData: NewUserData): Promise<void> => {
  try {
    // First create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        phone_number: userData.phone_number || ''
      }
    });

    if (authError) throw authError;

    // Then create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        phone_number: userData.phone_number || null,
        role: userData.role || 'client'
      });

    if (profileError) throw profileError;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Delete the user from auth (this will cascade to delete the profile)
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

// Club Management Services
export interface GolfClub {
  id: string;
  name: string;
  description: string;
  location: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'manager' | 'owner';
  joined_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export interface NewClubData {
  name: string;
  description: string;
  location: string;
}

// Get all clubs
export const getAllClubs = async (): Promise<GolfClub[]> => {
  try {
    const { data, error } = await supabase
      .from('golf_clubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }
};

// Create new club
export const createClub = async (clubData: NewClubData, createdBy: string): Promise<GolfClub> => {
  try {
    console.log('Creating club with data:', { clubData, createdBy });
    console.log('Current auth user:', createdBy);
    
    // Check if created_by is valid
    if (!createdBy) {
      console.error('created_by is null or undefined');
      throw new Error('User ID is required for club creation');
    }
    
    const insertData = {
      name: clubData.name,
      description: clubData.description,
      location: clubData.location,
      created_by: createdBy
    };
    
    console.log('Insert data prepared:', insertData);
    
    const { data, error } = await supabase
      .from('golf_clubs')
      .insert(insertData)
      .select()
      .single();

    console.log('Club creation response:', { data, error });
    
    if (error) {
      console.error('Supabase error creating club:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('Club created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating club:', error);
    throw error;
  }
};

// Update club
export const updateClub = async (clubId: string, clubData: Partial<NewClubData>): Promise<GolfClub> => {
  try {
    const { data, error } = await supabase
      .from('golf_clubs')
      .update({
        name: clubData.name,
        description: clubData.description,
        location: clubData.location
      })
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating club:', error);
    throw error;
  }
};

// Delete club
export const deleteClub = async (clubId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('golf_clubs')
      .delete()
      .eq('id', clubId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting club:', error);
    throw error;
  }
};

// Get club members
export const getClubMembers = async (clubId: string): Promise<ClubMember[]> => {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        id,
        club_id,
        user_id,
        role,
        joined_at,
        profiles!inner (
          full_name,
          auth.users(email)
        )
      `)
      .eq('club_id', clubId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    return data.map((member: any) => ({
      id: member.id,
      club_id: member.club_id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      user_profile: {
        full_name: member.profiles.full_name,
        email: member.profiles.auth.users.email
      }
    }));
  } catch (error) {
    console.error('Error fetching club members:', error);
    throw error;
  }
};

// Add user to club
export const addUserToClub = async (clubId: string, userId: string, role: 'member' | 'manager' | 'owner' = 'member', addedBy: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        role: role,
        created_by: addedBy
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding user to club:', error);
    throw error;
  }
};

// Remove user from club
export const removeUserFromClub = async (clubId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing user from club:', error);
    throw error;
  }
};

// Update club member role
export const updateClubMemberRole = async (clubId: string, userId: string, role: 'member' | 'manager' | 'owner'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('club_members')
      .update({ role })
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating club member role:', error);
    throw error;
  }
};

// Get users not in a specific club
export const getAvailableUsersForClub = async (clubId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone_number,
        role,
        created_at,
        auth.users(email)
      `)
      .not('id', 'in', 
        `(SELECT user_id FROM club_members WHERE club_id = '${clubId}')`
      )
      .order('full_name', { ascending: true });

    if (error) throw error;

    return data.map((profile: any) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.auth.users.email,
      phone_number: profile.phone_number,
      role: profile.role,
      created_at: profile.created_at
    }));
  } catch (error) {
    console.error('Error fetching available users:', error);
    throw error;
  }
};
