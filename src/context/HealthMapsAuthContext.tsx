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
  register: (data: { name: string; email: string; phone_number?: string; password: string }) => Promise<{ success: boolean; error: string | null }>;
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
      const { profile: userProfile, error } = await healthMapsAuthService.getProfile(userId);
      
      if (error) {
        setProfile(null);
        setRole(null);
      } else if (userProfile) {
        setProfile(userProfile);
        setRole(userProfile.role);
        
        if (!['client', 'admin'].includes(userProfile.role)) {
          setRole('client');
        }
      } else {
        setProfile(null);
        setRole(null);
      }
    } catch {
      setProfile(null);
      setRole(null);
    }
  };

  useEffect(() => {
    if (initialized) return;
    
    const initializeAuth = async () => {
      try {
        const { session } = await healthMapsAuthService.getCurrentSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        
        setInitialized(true);
        setLoading(false);
      } catch {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
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
      await healthMapsAuthService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    } catch {
      // no-op
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await healthMapsAuthService.login({ email, password });
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (data: { name: string; email: string; phone_number?: string; password: string }) => {
    try {
      const { error } = await healthMapsAuthService.register(data);
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch {
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
