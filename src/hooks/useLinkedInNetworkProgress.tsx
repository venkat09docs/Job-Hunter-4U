import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActivityMetrics {
  [key: string]: number;
}

export const useLinkedInNetworkProgress = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

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
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday

      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);

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

  const getLastWeekMetrics = async (): Promise<ActivityMetrics> => {
    if (!user) return {};

    try {
      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay() + 1); // This Monday
      
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7); // Last Monday
      
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Last Sunday

      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id)
        .gte('date', lastWeekStart.toISOString().split('T')[0])
        .lte('date', lastWeekEnd.toISOString().split('T')[0]);

      if (error) throw error;

      const lastWeekMetrics: ActivityMetrics = {};
      data?.forEach(metric => {
        lastWeekMetrics[metric.activity_id] = (lastWeekMetrics[metric.activity_id] || 0) + metric.value;
      });

      return lastWeekMetrics;
    } catch (error) {
      console.error('Error fetching last week metrics:', error);
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
    loading,
    updateTaskCompletion,
    updateMetrics,
    getTodayMetrics,
    getWeeklyMetrics,
    getLastWeekMetrics,
    getCompletedTasks
  };
};