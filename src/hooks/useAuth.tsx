import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSigningOut: boolean;
  hasLoggedOut: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isSigningOut: false,
  hasLoggedOut: false,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        
        if (mounted) {
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setIsSigningOut(false);
            setHasLoggedOut(true);
          } else if (event === 'SIGNED_IN') {
            setHasLoggedOut(false);
            setSession(session);
            setUser(session?.user ?? null);
          } else {
            // Only update session if we're not in the process of signing out and haven't just logged out
            if (!isSigningOut && !hasLoggedOut) {
              setSession(session);
              setUser(session?.user ?? null);
            }
          }
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
            setSession(null);
            setUser(null);
          } else {
            // Only set session if we're not signing out and haven't just logged out
            if (!isSigningOut && !hasLoggedOut) {
              setSession(session);
              setUser(session?.user ?? null);
            } else if (hasLoggedOut) {
              // If user has logged out, ensure session is null
              setSession(null);
              setUser(null);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSigningOut, hasLoggedOut]);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setLoading(true);
      setHasLoggedOut(true);
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
      // Clear all possible storage locations
      localStorage.clear();
      sessionStorage.clear();
      
      // Try to clear specific Supabase storage keys
      const storageKeys = [
        'sb-moirryvajzyriagqihbe-auth-token',
        'supabase.auth.token',
        'supabase.auth.session',
        'sb-auth-token',
        'sb-auth-session'
      ];
      
      storageKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Signout error:', error);
        // Even if signout fails, keep local state cleared
      }
    } catch (error) {
      console.error('Error during signout:', error);
    } finally {
      setLoading(false);
      setIsSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSigningOut, hasLoggedOut, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};