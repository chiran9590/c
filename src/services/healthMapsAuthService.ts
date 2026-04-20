import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: 'admin' | 'client';
  created_at: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone_number?: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class HealthMapsAuthService {
  async register(data: RegisterData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone_number: data.phone_number
          }
        }
      });

      if (authError) {
        return { error: authError.message, data: null };
      }

      if (authData.user) {
        const { error: userError } = await supabase
          .from('users')
          .upsert(
            {
              id: authData.user.id,
              name: data.name,
              email: data.email,
              phone_number: data.phone_number ?? null,
              role: 'client'
            },
            { onConflict: 'id' }
          );

        if (userError) {
          return { error: userError.message, data: null };
        }
      }

      return { data: authData, error: null };
    } catch {
      return { error: 'Registration failed', data: null };
    }
  }

  async login(data: LoginData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        return { error: authError.message, data: null };
      }

      return { data: authData, error: null };
    } catch {
      return { error: 'Login failed', data: null };
    }
  }

  async getProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: data as Profile, error: null };
    } catch {
      return { profile: null, error: 'Failed to fetch profile' };
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch {
      return { error: 'Failed to update profile', data: null };
    }
  }

  async getAllUsers(): Promise<{ users: Profile[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { users: null, error: error.message };
      }

      return { users: data as Profile[], error: null };
    } catch {
      return { users: null, error: 'Failed to fetch users' };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch {
      return { error: 'Sign out failed' };
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error: error?.message || null };
    } catch {
      return { session: null, error: 'Failed to get session' };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error?.message || null };
    } catch {
      return { error: 'Password reset failed' };
    }
  }
}

export const healthMapsAuthService = new HealthMapsAuthService();
