import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user && isUser !== null) {
      fetchUserInstitute();
    } else {
      setLoading(false);
    }
  }, [user, isUser]);

  const fetchUserInstitute = async () => {
    try {
      setLoading(true);
      
      // Only check for institute assignment if user has 'user' role (not admin/recruiter/institute_admin)
      if (!isUser) {
        setInstituteData({
          instituteId: null,
          instituteName: null,
          isInstituteUser: false
        });
        return;
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
  };

  return {
    ...instituteData,
    loading,
    refreshUserInstitute: fetchUserInstitute
  };
};