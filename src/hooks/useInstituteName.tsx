import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { supabase } from '@/integrations/supabase/client';

export const useInstituteName = () => {
  const { user } = useAuth();
  const { isInstituteAdmin } = useRole();
  const [instituteName, setInstituteName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInstituteAdmin && user) {
      fetchInstituteName();
    } else {
      setLoading(false);
    }
  }, [isInstituteAdmin, user]);

  const fetchInstituteName = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('institute_admin_assignments')
        .select(`
          institutes (
            name
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (data?.institutes) {
        setInstituteName(data.institutes.name);
      }
    } catch (error) {
      console.error('Error fetching institute name:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    instituteName,
    loading,
    refetch: fetchInstituteName
  };
};