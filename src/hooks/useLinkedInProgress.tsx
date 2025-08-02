import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useLinkedInProgress = () => {
  const { user } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const TOTAL_TASKS = 9; // Total number of LinkedIn optimization tasks (must match LINKEDIN_TASKS array)

  useEffect(() => {
    if (user) {
      fetchLinkedInProgress();
      
      // Set up real-time subscription for LinkedIn progress updates
      const channel = supabase
        .channel('linkedin-progress-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'linkedin_progress',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh data when changes occur
            fetchLinkedInProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchLinkedInProgress = async () => {
    if (!user) return;
    
    try {
      // Fetch from database instead of localStorage
      const { count, error } = await supabase
        .from('linkedin_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;

      const percentage = Math.round((count || 0) * 100 / TOTAL_TASKS);
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error('Error fetching LinkedIn progress:', error);
      setCompletionPercentage(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    completionPercentage,
    loading,
    refreshProgress: fetchLinkedInProgress
  };
};