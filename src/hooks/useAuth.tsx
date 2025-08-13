import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isSigningOut: false,
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
          } else {
            // Only update session if we're not in the process of signing out
            if (!isSigningOut) {
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
            // Only set session if we're not signing out
            if (!isSigningOut) {
              setSession(session);
              setUser(session?.user ?? null);
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
  }, [isSigningOut]);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setLoading(true);
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
      // Clear localStorage to prevent session restoration
      localStorage.removeItem('sb-moirryvajzyriagqihbe-auth-token');
      localStorage.removeItem('supabase.auth.token');
      
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
    <AuthContext.Provider value={{ user, session, loading, isSigningOut, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};