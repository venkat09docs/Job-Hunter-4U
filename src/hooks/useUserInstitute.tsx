import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { supabase } from '@/integrations/supabase/client';

interface UserInstituteData {
  instituteId: string | null;
  instituteName: string | null;
  isInstituteUser: boolean;
}

export const useUserInstitute = () => {
  const [instituteData, setInstituteData] = useState<UserInstituteData>({
    instituteId: null,
    instituteName: null,
    isInstituteUser: false
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isUser } = useRole();

  const fetchUserInstitute = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check for institute assignment for regular users and institute admins
      // Only exclude global admins and recruiters
      if (!isUser) {
        // Check if this is an institute admin
        const { data: instituteAdminAssignment } = await supabase
          .from('institute_admin_assignments')
          .select(`
            institute_id,
            institutes:institute_id (
              name
            )
          `)
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .single();

        if (instituteAdminAssignment && instituteAdminAssignment.institute_id) {
          // Institute admin - show their institute's users
          setInstituteData({
            instituteId: instituteAdminAssignment.institute_id,
            instituteName: instituteAdminAssignment.institutes?.name || null,
            isInstituteUser: true
          });
          return;
        } else {
          // Global admin or recruiter - show all users
          setInstituteData({
            instituteId: null,
            instituteName: null,
            isInstituteUser: false
          });
          return;
        }
      }

      const { data: assignment, error } = await supabase
        .from('user_assignments')
        .select(`
          institute_id,
          institutes:institute_id (
            name
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (assignment && assignment.institute_id) {
        setInstituteData({
          instituteId: assignment.institute_id,
          instituteName: assignment.institutes?.name || null,
          isInstituteUser: true
        });
      } else {
        setInstituteData({
          instituteId: null,
          instituteName: null,
          isInstituteUser: false
        });
      }
    } catch (error) {
      console.error('Error fetching user institute:', error);
      setInstituteData({
        instituteId: null,
        instituteName: null,
        isInstituteUser: false
      });
    } finally {
      setLoading(false);
    }
  }, [user, isUser]);

  useEffect(() => {
    if (user && isUser !== null) {
      fetchUserInstitute();
    } else {
      setLoading(false);
    }
  }, [user, isUser, fetchUserInstitute]);

  // Refresh institute data when user assignments change
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('user-institute-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_assignments',
            filter: `user_id=eq.${user.id}`
          },
           () => {
             console.log('User assignment updated for current user, refreshing institute data...');
             fetchUserInstitute();
           }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'institute_admin_assignments',
            filter: `user_id=eq.${user.id}`
          },
           () => {
             console.log('Institute admin assignment updated for current user, refreshing institute data...');
             fetchUserInstitute();
           }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchUserInstitute]);

  return {
    ...instituteData,
    loading,
    refreshUserInstitute: fetchUserInstitute
  };
};