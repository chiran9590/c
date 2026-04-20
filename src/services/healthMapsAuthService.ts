import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'client';
  created_at: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'admin' | 'client';
}

export interface LoginData {
  email: string;
  password: string;
}

export class HealthMapsAuthService {
  // Register new user
  async register(data: RegisterData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            role: data.role || 'client'
          }
        }
      });

      if (authError) {
        return { error: authError.message, data: null };
      }

      return { data: authData, error: null };
    } catch (error) {
      return { error: 'Registration failed', data: null };
    }
  }

  // Login user
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
    } catch (error) {
      return { error: 'Login failed', data: null };
    }
  }

  // Get user profile
  async getProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: data as Profile, error: null };
    } catch (error) {
      return { profile: null, error: 'Failed to fetch profile' };
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { error: error.message, data: null };
      }

      return { data, error: null };
    } catch (error) {
      return { error: 'Failed to update profile', data: null };
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<{ users: Profile[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { users: null, error: error.message };
      }

      return { users: data as Profile[], error: null };
    } catch (error) {
      return { users: null, error: 'Failed to fetch users' };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Sign out failed' };
    }
  }

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error: error?.message || null };
    } catch (error) {
      return { session: null, error: 'Failed to get session' };
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Password reset failed' };
    }
  }
}

export const healthMapsAuthService = new HealthMapsAuthService();
