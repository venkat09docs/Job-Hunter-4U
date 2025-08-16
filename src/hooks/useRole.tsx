import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

type UserRole = 'admin' | 'user' | 'institute_admin' | 'recruiter' | null;

export const useRole = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    console.log('📡 Fetching user role for user ID:', user?.id);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      console.log('🔍 Role query result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // No role found - default to user role
          console.log('❌ No role found for user, defaulting to user role');
          setRole('user');
          return;
        }
        throw error;
      }
      const detectedRole = data?.role || 'user';
      console.log('✅ Role detected:', detectedRole);
      setRole(detectedRole);
    } catch (error: any) {
      console.error('❌ Error fetching user role:', error);
      // Only show toast for unexpected errors, not for missing roles
      if (error.code !== 'PGRST116') {
        toast({
          title: 'Error', 
          description: 'Failed to load user role',
          variant: 'destructive'
        });
      }
      console.log('⚠️ Defaulting to user role due to error');
      setRole('user'); // Default to user role
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isInstituteAdmin = role === 'institute_admin';
  const isRecruiter = role === 'recruiter';

  // Debug logging for role state
  console.log('🎭 Role Hook State:', { role, isAdmin, isUser, isInstituteAdmin, isRecruiter, loading });

  return {
    role,
    isAdmin,
    isUser,
    isInstituteAdmin,
    isRecruiter,
    loading,
    refreshRole: fetchUserRole
  };
};