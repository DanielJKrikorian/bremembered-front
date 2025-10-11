import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<string | null>(null);
  const initialSessionProcessed = useRef(false);

  useEffect(() => {
    // Debounce auth state changes
    let timeout: NodeJS.Timeout | null = null;

    const handleAuthStateChange = (event: string, session: Session | null) => {
      if (event === 'INITIAL_SESSION' && initialSessionProcessed.current) {
        console.log('Skipping duplicate INITIAL_SESSION:', new Date().toISOString());
        return;
      }
      if (event === 'INITIAL_SESSION') {
        initialSessionProcessed.current = true;
      }
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setAuthState(event);
        setLoading(false);
      }, 300); // Increased to 300ms
    };

    // Get initial session
    const getInitialSession = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping auth initialization');
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Auth session error (expected if not configured):', error.message);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        handleAuthStateChange('INITIAL_SESSION', session);
      } catch (error) {
        console.warn('Error getting session (expected if not configured):', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    if (supabase && isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

      return () => {
        subscription.unsubscribe();
        if (timeout) clearTimeout(timeout);
      };
    } else {
      console.warn('Supabase not configured, auth state changes will not be monitored');
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    if (!supabase || !isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: 'couple'
          }
        }
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear analytics session
      sessionStorage.removeItem('analytics_session_id');
      sessionStorage.removeItem('analytics_session_started');
      sessionStorage.removeItem('analytics_processed_events');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Memoize context value
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      isAuthenticated: !!user
    }),
    [user, session, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};