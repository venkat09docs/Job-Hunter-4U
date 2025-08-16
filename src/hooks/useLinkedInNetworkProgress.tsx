import { useState, useEffect, useCallback } from 'react';
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

  const updateMetrics = useCallback(async (activityId: string, value: number, date: string) => {
    if (!user) return;

    console.log('Updating metrics:', { activityId, value, date, userId: user.id });

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

      if (error) {
        console.error('Supabase error updating metrics:', error);
        throw error;
      }
      
      console.log('Successfully updated metrics for:', activityId);
    } catch (error) {
      console.error('Error updating metrics:', error);
      throw error; // Re-throw to handle in component
    }
  }, [user]);

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
      // Get current date in user's timezone
      const today = new Date();
      
      // Find Monday of current week (week starts on Monday)
      const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // If Sunday, go back 6 days to get Monday
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromMonday);
      
      // Sunday of current week (6 days after Monday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      console.log('Current week calculation:', {
        today: today.toISOString().split('T')[0],
        todayDayOfWeek: currentDayOfWeek,
        daysFromMonday,
        weekStartMonday: startDateStr,
        weekEndSunday: endDateStr
      });

      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value, date')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (error) throw error;

      console.log('Current week data (Monday to Sunday only):', data);

      // Define daily targets for each activity
      const DAILY_TARGETS: { [key: string]: number } = {
        'post_likes': 3,
        'comments': 2,
        'content': 2,
        'connection_requests': 2,
        'follow_up': 1,
        'industry_groups': 1,
        'create_post': 1,
        'article_draft': 1,
        'profile_optimization': 0,
        'industry_research': 1,
        'connections_accepted': 1, // Allow tracking of connections accepted
        'profile_views': 5 // Allow tracking of profile views
      };

      const weekMetrics: ActivityMetrics = {};
      data?.forEach(metric => {
        const dailyTarget = DAILY_TARGETS[metric.activity_id] || 0;
        // Cap daily contribution to the daily target
        const cappedValue = Math.min(metric.value, dailyTarget);
        weekMetrics[metric.activity_id] = (weekMetrics[metric.activity_id] || 0) + cappedValue;
      });

      console.log('Final weekly totals:', weekMetrics);

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