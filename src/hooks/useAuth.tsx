import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { CrossDomainStorage } from '@/utils/domainRedirect';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSigningOut: boolean;
  hasLoggedOut: boolean;
  isEmailVerified: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isSigningOut: false,
  hasLoggedOut: false,
  isEmailVerified: false,
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
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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
            setIsEmailVerified(false);
            setIsSigningOut(false);
            setHasLoggedOut(true);
          } else if (event === 'SIGNED_IN') {
            setHasLoggedOut(false);
            setSession(session);
            setUser(session?.user ?? null);
            // Check email verification status
            const isVerified = session?.user?.email_confirmed_at !== null && session?.user?.email_confirmed_at !== undefined;
            console.log('🔍 Auth: Email verification check', {
              email_confirmed_at: session?.user?.email_confirmed_at,
              isVerified,
              user_email: session?.user?.email
            });
            setIsEmailVerified(isVerified);
          } else {
            // Only update session if we're not in the process of signing out and haven't just logged out
            if (!isSigningOut && !hasLoggedOut) {
              setSession(session);
              setUser(session?.user ?? null);
              // Check email verification status
              const isVerified = session?.user?.email_confirmed_at !== null && session?.user?.email_confirmed_at !== undefined;
              console.log('🔍 Auth: Email verification check (other events)', {
                email_confirmed_at: session?.user?.email_confirmed_at,
                isVerified,
                event,
                user_email: session?.user?.email
              });
              setIsEmailVerified(isVerified);
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
              // Check email verification status
              const isVerified = session?.user?.email_confirmed_at !== null && session?.user?.email_confirmed_at !== undefined;
              console.log('🔍 Auth: Email verification check (initialization)', {
                email_confirmed_at: session?.user?.email_confirmed_at,
                isVerified,
                user_email: session?.user?.email
              });
              setIsEmailVerified(isVerified);
            } else if (hasLoggedOut) {
              // If user has logged out, ensure session is null
              setSession(null);
              setUser(null);
              setIsEmailVerified(false);
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
      setIsEmailVerified(false);
      
      // Clear all possible storage locations using our cross-domain storage
      CrossDomainStorage.clear();
      
      // Also clear standard storage as fallback
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
        CrossDomainStorage.removeItem(key);
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
    <AuthContext.Provider value={{ user, session, loading, isSigningOut, hasLoggedOut, isEmailVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};