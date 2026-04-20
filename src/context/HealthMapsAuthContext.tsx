import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Profile, healthMapsAuthService } from '../services/healthMapsAuthService';

interface AuthContextType {
  user: User | null;
  session: any | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  register: (data: { name: string; email: string; phone?: string; password: string; role?: 'admin' | 'client' }) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const HealthMapsAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      const { profile: userProfile, error } = await healthMapsAuthService.getProfile(userId);
      
      if (error) {
        console.error('❌ Profile fetch error:', error);
        setProfile(null);
        setRole(null);
      } else if (userProfile) {
        console.log('✅ Profile fetched successfully:', userProfile);
        setProfile(userProfile);
        setRole(userProfile.role);
        
        // Validate role is either 'client' or 'admin'
        if (!['client', 'admin'].includes(userProfile.role)) {
          console.warn('⚠️ Invalid role detected, defaulting to client');
          setRole('client');
        }
      } else {
        console.warn('⚠️ Profile is null');
        setProfile(null);
        setRole(null);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setProfile(null);
      setRole(null);
    }
  };

  useEffect(() => {
    if (initialized) return;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        
        // Get initial session
        const { session } = await healthMapsAuthService.getCurrentSession();
        console.log('📱 Initial session:', session ? 'Found' : 'Not found');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching profile...');
          await fetchProfile(session.user.id);
        } else {
          console.log('👤 No user in session');
          setProfile(null);
          setRole(null);
        }
        
        setInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated, fetching profile...');
          await fetchProfile(session.user.id);
        } else {
          console.log('👤 User signed out');
          setProfile(null);
          setRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      await healthMapsAuthService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile...');
      await fetchProfile(user.id);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await healthMapsAuthService.login({ email, password });
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string; role?: 'admin' | 'client' }) => {
    try {
      const { data: authData, error } = await healthMapsAuthService.register(data);
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  };

  const value = {
    user,
    session,
    profile,
    role,
    loading,
    signOut,
    refreshProfile,
    login,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useHealthMapsAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useHealthMapsAuth must be used within a HealthMapsAuthProvider');
  }
  return context;
};
