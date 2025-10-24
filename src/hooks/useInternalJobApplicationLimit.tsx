import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useInternalJobApplicationLimit = () => {
  const { user } = useAuth();
  const [applicationCount, setApplicationCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchApplicationCount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count, error } = await supabase
        .from('job_applications_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      setApplicationCount(count || 0);
    } catch (error) {
      console.error('Error fetching application count:', error);
      setApplicationCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationCount();
  }, [user]);

  const canApply = (hasActiveSubscription: boolean): boolean => {
    if (hasActiveSubscription) return true;
    return applicationCount < 5;
  };

  const getRemainingApplications = (hasActiveSubscription: boolean): number => {
    if (hasActiveSubscription) return Infinity;
    return Math.max(0, 5 - applicationCount);
  };

  return {
    applicationCount,
    loading,
    canApply,
    getRemainingApplications,
    refetch: fetchApplicationCount,
  };
};
