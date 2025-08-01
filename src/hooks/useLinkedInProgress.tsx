import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useLinkedInProgress = () => {
  const { user } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const TOTAL_TASKS = 15; // Total number of LinkedIn optimization tasks

  useEffect(() => {
    if (user) {
      fetchLinkedInProgress();
    }
  }, [user]);

  const fetchLinkedInProgress = async () => {
    try {
      // Use localStorage for now
      const savedProgress = localStorage.getItem(`linkedin_progress_${user?.id}`);
      const completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
      const percentage = Math.round((completedTasks.length / TOTAL_TASKS) * 100);
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