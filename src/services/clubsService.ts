import { supabase } from '../lib/supabase';

export interface Club {
  id: string;
  club_name: string;
  slug: string;
  created_at: string;
}

export interface ClubAssignment {
  id: string;
  user_id: string;
  club_id: string;
  assigned_at: string;
  users?: {
    name: string;
    email: string;
    role: string;
  };
  clubs?: {
    club_name: string;
    slug: string;
  };
}

export interface CreateClubData {
  club_name: string;
  slug: string;
}

export interface AssignUserToClubData {
  user_id: string;
  club_id: string;
}

export class ClubsService {
  async createClub(clubData: CreateClubData): Promise<{ club: Club | null; error: string | null }> {
    try {
      const { data: clubResult, error } = await supabase
        .from('clubs')
        .insert([{
          club_name: clubData.club_name,
          slug: clubData.slug
        }])
        .select()
        .single();

      if (error) {
        return { club: null, error: error.message };
      }

      return { club: clubResult as Club, error: null };
    } catch {
      return { club: null, error: 'Failed to create club' };
    }
  }

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
    } catch {
      return { clubs: null, error: 'Failed to fetch clubs' };
    }
  }

  async getUserAssignedClub(userId: string): Promise<{ club: Club | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_club_mapping')
        .select(`
          club_id,
          clubs (
            id,
            club_name,
            slug,
            created_at
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { club: null, error: error.message };
      }

      const clubData = Array.isArray(data?.clubs) ? data?.clubs[0] : data?.clubs;
      return { club: (clubData as Club) ?? null, error: null };
    } catch {
      return { club: null, error: 'Failed to fetch assigned club' };
    }
  }

  async assignUserToClub(data: AssignUserToClubData): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_club_mapping')
        .upsert([{
          user_id: data.user_id,
          club_id: data.club_id
        }], { onConflict: 'user_id' });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch {
      return { success: false, error: 'Failed to assign user to club' };
    }
  }

  async getAssignments(): Promise<{ assignments: ClubAssignment[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_club_mapping')
        .select(`
          *,
          users (
            name,
            email,
            role
          ),
          clubs (
            club_name,
            slug
          )
        `)
        .order('assigned_at', { ascending: false });

      if (error) {
        return { assignments: null, error: error.message };
      }

      return { assignments: data as ClubAssignment[], error: null };
    } catch {
      return { assignments: null, error: 'Failed to fetch assignments' };
    }
  }

  async getClientUsers(): Promise<{ users: { id: string; name: string; email: string }[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id,name,email')
        .eq('role', 'client')
        .order('name', { ascending: true });

      if (error) {
        return { users: null, error: error.message };
      }

      return { users: data, error: null };
    } catch {
      return { users: null, error: 'Failed to fetch clients' };
    }
  }
}

export const clubsService = new ClubsService();
