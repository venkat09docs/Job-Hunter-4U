import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

type UserRole = 'admin' | 'user' | 'institute_admin' | null;

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

      if (error) throw error;
      setRole(data?.role || 'user');
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      setRole('user'); // Default to user role
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isInstituteAdmin = role === 'institute_admin';

  return {
    role,
    isAdmin,
    isUser,
    isInstituteAdmin,
    loading,
    refreshRole: fetchUserRole
  };
};