import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useLinkedInProgress = () => {
  const { user } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const TOTAL_TASKS = 16; // Total number of LinkedIn optimization tasks

  useEffect(() => {
    if (user) {
      fetchLinkedInProgress();
    }
  }, [user]);

  const fetchLinkedInProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('linkedin_progress')
        .select('task_id')
        .eq('user_id', user?.id)
        .eq('completed', true);

      if (error && error.code !== 'PGRST116') { // Ignore "table doesn't exist" error
        throw error;
      }

      const completedTasks = data?.length || 0;
      const percentage = Math.round((completedTasks / TOTAL_TASKS) * 100);
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