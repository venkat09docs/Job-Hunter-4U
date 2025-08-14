import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { supabase } from '@/integrations/supabase/client';

export const useInstituteName = () => {
  const { user } = useAuth();
  const { isInstituteAdmin } = useRole();
  const [instituteName, setInstituteName] = useState<string>('');
  const [instituteSubscription, setInstituteSubscription] = useState<{
    plan: string | null;
    active: boolean;
    endDate: string | null;
    maxStudents: number | null;
    currentStudentCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInstituteAdmin && user) {
      fetchInstituteData();
    } else {
      setLoading(false);
    }
  }, [isInstituteAdmin, user]);

  const fetchInstituteData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('institute_admin_assignments')
        .select(`
          institutes (
            name,
            subscription_plan,
            subscription_active,
            subscription_end_date,
            max_students,
            current_student_count
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (data?.institutes) {
        setInstituteName(data.institutes.name);
        setInstituteSubscription({
          plan: data.institutes.subscription_plan,
          active: data.institutes.subscription_active || false,
          endDate: data.institutes.subscription_end_date,
          maxStudents: data.institutes.max_students,
          currentStudentCount: data.institutes.current_student_count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching institute data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    instituteName,
    instituteSubscription,
    loading,
    refetch: fetchInstituteData
  };
};