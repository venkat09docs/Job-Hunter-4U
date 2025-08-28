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
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No role found - default to user role
          setRole('user');
          return;
        }
        throw error;
      }
      const detectedRole = data?.role || 'user';
      setRole(detectedRole);
    } catch (error: any) {
      // Only show toast for unexpected errors, not for missing roles
      if (error.code !== 'PGRST116') {
        toast({
          title: 'Error', 
          description: 'Failed to load user role',
          variant: 'destructive'
        });
      }
      setRole('user'); // Default to user role
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isInstituteAdmin = role === 'institute_admin';
  const isRecruiter = role === 'recruiter';

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