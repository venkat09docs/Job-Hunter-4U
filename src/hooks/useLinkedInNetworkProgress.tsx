import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActivityMetrics {
  [key: string]: number;
}

export const useLinkedInNetworkProgress = () => {
  const { user } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const TOTAL_TASKS = 10; // Total number of LinkedIn network activities

  useEffect(() => {
    if (user) {
      fetchNetworkProgress();
    }
  }, [user]);

  const fetchNetworkProgress = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('linkedin_network_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('completed', true);

      if (error) throw error;

      const completedCount = data?.length || 0;
      const percentage = Math.round((completedCount / TOTAL_TASKS) * 100);
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error('Error fetching LinkedIn network progress:', error);
      setCompletionPercentage(0);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskCompletion = async (taskId: string, completed: boolean, date: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('linkedin_network_completions')
        .upsert({
          user_id: user.id,
          date,
          task_id: taskId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,date,task_id'
        });

      if (error) throw error;

      // Update percentage for today's date
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        await fetchNetworkProgress();
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const updateMetrics = async (activityId: string, value: number, date: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('linkedin_network_metrics')
        .upsert({
          user_id: user.id,
          date,
          activity_id: activityId,
          value,
        }, {
          onConflict: 'user_id,date,activity_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  const getTodayMetrics = async (date: string): Promise<ActivityMetrics> => {
    if (!user) return {};

    try {
      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id)
        .eq('date', date);

      if (error) throw error;

      const metrics: ActivityMetrics = {};
      data?.forEach(metric => {
        metrics[metric.activity_id] = metric.value;
      });

      return metrics;
    } catch (error) {
      console.error('Error fetching today metrics:', error);
      return {};
    }
  };

  const getWeeklyMetrics = async (): Promise<ActivityMetrics> => {
    if (!user) return {};

    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);

      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      if (error) throw error;

      const weekMetrics: ActivityMetrics = {};
      data?.forEach(metric => {
        weekMetrics[metric.activity_id] = (weekMetrics[metric.activity_id] || 0) + metric.value;
      });

      return weekMetrics;
    } catch (error) {
      console.error('Error fetching weekly metrics:', error);
      return {};
    }
  };

  const getCompletedTasks = async (date: string): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('linkedin_network_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('completed', true);

      if (error) throw error;

      return data?.map(item => item.task_id) || [];
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      return [];
    }
  };

  return {
    completionPercentage,
    loading,
    updateTaskCompletion,
    updateMetrics,
    getTodayMetrics,
    getWeeklyMetrics,
    getCompletedTasks,
    refreshProgress: fetchNetworkProgress
  };
};