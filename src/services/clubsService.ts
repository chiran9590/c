import { supabase } from '../lib/supabase';

export interface Club {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface ClubMember {
  id: string;
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateClubData {
  name: string;
  description?: string;
}

export interface AssignUserToClubData {
  user_id: string;
  club_id: string;
  role?: string;
}

export class ClubsService {
  // Create new club
  async createClub(clubData: CreateClubData): Promise<{ club: Club | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { club: null, error: 'User not authenticated' };
      }

      const { data: clubResult, error } = await supabase
        .from('clubs')
        .insert([{
          name: clubData.name,
          description: clubData.description,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        return { club: null, error: error.message };
      }

      return { club: clubResult as Club, error: null };
    } catch (error) {
      return { club: null, error: 'Failed to create club' };
    }
  }

  // Get all clubs
  async getAllClubs(): Promise<{ clubs: Club[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { clubs: null, error: error.message };
      }

      return { clubs: data as Club[], error: null };
    } catch (error) {
      return { clubs: null, error: 'Failed to fetch clubs' };
    }
  }

  // Get clubs for current user
  async getUserClubs(): Promise<{ clubs: Club[] | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { clubs: null, error: 'User not authenticated' };
      }

      const { data: membershipData, error } = await supabase
        .from('club_members')
        .select(`
          clubs (
            id,
            name,
            description,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        return { clubs: null, error: error.message };
      }

      const clubs = membershipData?.map((item: any) => item.clubs).filter(Boolean) || [];
      return { clubs: clubs as Club[], error: null };
    } catch (error) {
      return { clubs: null, error: 'Failed to fetch user clubs' };
    }
  }

  // Assign user to club
  async assignUserToClub(data: AssignUserToClubData): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('club_members')
        .insert([{
          user_id: data.user_id,
          club_id: data.club_id,
          role: data.role || 'member'
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to assign user to club' };
    }
  }

  // Remove user from club
  async removeUserFromClub(userId: string, clubId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('user_id', userId)
        .eq('club_id', clubId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to remove user from club' };
    }
  }

  // Get club members
  async getClubMembers(clubId: string): Promise<{ members: ClubMember[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          *,
          profiles (
            name,
            email,
            role
          )
        `)
        .eq('club_id', clubId)
        .order('joined_at', { ascending: false });

      if (error) {
        return { members: null, error: error.message };
      }

      return { members: data as ClubMember[], error: null };
    } catch (error) {
      return { members: null, error: 'Failed to fetch club members' };
    }
  }

  // Update club
  async updateClub(clubId: string, updates: Partial<Club>): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', clubId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to update club' };
    }
  }

  // Delete club
  async deleteClub(clubId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to delete club' };
    }
  }
}

export const clubsService = new ClubsService();
