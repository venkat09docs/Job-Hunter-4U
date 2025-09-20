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
      console.log('🔍 useRole: Fetching roles for user:', user?.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      console.log('🔍 useRole: Found roles:', data);

      if (!data || data.length === 0) {
        console.log('🔍 useRole: No roles found, defaulting to user');
        setRole('user');
        return;
      }

      // Get all roles for the user
      const userRoles = data.map(r => r.role);
      console.log('🔍 useRole: User roles array:', userRoles);

      // Determine the highest priority role
      let detectedRole: UserRole = 'user';
      
      if (userRoles.includes('admin')) {
        detectedRole = 'admin';
      } else if (userRoles.includes('institute_admin')) {
        detectedRole = 'institute_admin';
      } else if (userRoles.includes('recruiter')) {
        detectedRole = 'recruiter';
      } else if (userRoles.includes('user')) {
        detectedRole = 'user';
      }

      console.log('🔍 useRole: Detected role (highest priority):', detectedRole);
      setRole(detectedRole);
    } catch (error: any) {
      console.error('🔍 useRole: Error fetching role:', error);
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