import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GitHubNotificationData {
  weeklyCompletion: {
    tasksCompleted: number;
    totalTasks: number;
    pointsEarned: number;
  };
  streakDays: number;
  upcomingDeadlines: Array<{
    taskId: string;
    taskTitle: string;
    dueAt: string;
    hoursRemaining: number;
  }>;
}

export function useGitHubNotifications() {
  const { user } = useAuth();
  const [data, setData] = useState<GitHubNotificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGitHubNotificationData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get current week's GitHub tasks
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      
      const { data: weeklyTasks, error: weeklyError } = await supabase
        .from('github_user_tasks')
        .select(`
          *,
          github_tasks!inner(title, points_base)
        `)
        .eq('user_id', user.id)
        .gte('created_at', currentWeekStart.toISOString())
        .lte('created_at', currentWeekEnd.toISOString());

      if (weeklyError) throw weeklyError;

      // Calculate weekly completion
      const totalTasks = weeklyTasks?.length || 0;
      const completedTasks = weeklyTasks?.filter(task => task.status === 'VERIFIED').length || 0;
      const pointsEarned = weeklyTasks?.reduce((sum, task) => 
        task.status === 'VERIFIED' ? sum + (task.score_awarded || 0) : sum, 0
      ) || 0;

      // Get upcoming deadlines (next 48 hours)
      const { data: upcomingTasks, error: upcomingError } = await supabase
        .from('github_user_tasks')
        .select(`
          *,
          github_tasks!inner(title)
        `)
        .eq('user_id', user.id)
        .eq('status', 'NOT_STARTED')
        .gte('due_at', new Date().toISOString())
        .lte('due_at', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
        .order('due_at', { ascending: true });

      if (upcomingError) throw upcomingError;

      const upcomingDeadlines = upcomingTasks?.map(task => ({
        taskId: task.id,
        taskTitle: task.github_tasks.title,
        dueAt: task.due_at,
        hoursRemaining: Math.round((new Date(task.due_at).getTime() - Date.now()) / (1000 * 60 * 60))
      })) || [];

      // Calculate streak (simplified - would need more complex logic in real implementation)
      const streakDays = 0; // Placeholder

      setData({
        weeklyCompletion: {
          tasksCompleted: completedTasks,
          totalTasks,
          pointsEarned
        },
        streakDays,
        upcomingDeadlines
      });

    } catch (error) {
      console.error('Error fetching GitHub notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendWeeklyCompletionNotification = async () => {
    if (!user || !data) return;

    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'GitHub Weekly Complete! 🎉',
          message: `Amazing work! You completed all GitHub tasks this week and earned ${data.weeklyCompletion.pointsEarned} points. Keep building!`,
          type: 'github_weekly_completed',
          category: 'technical',
          priority: 'medium',
          action_url: '/dashboard/github-activity-tracker'
        });

      console.log('GitHub weekly completion notification sent');
    } catch (error) {
      console.error('Error sending GitHub weekly completion notification:', error);
    }
  };

  const sendStreakMilestoneNotification = async (streakDays: number) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'GitHub Streak Milestone! 🔥',
          message: `Incredible! You have maintained a ${streakDays}-day GitHub contribution streak. You are on fire!`,
          type: 'github_streak_milestone',
          category: 'technical',
          priority: 'high',
          action_url: '/dashboard/github-activity-tracker'
        });

      console.log('GitHub streak milestone notification sent');
    } catch (error) {
      console.error('Error sending GitHub streak milestone notification:', error);
    }
  };

  useEffect(() => {
    fetchGitHubNotificationData();
    
    // Set up real-time subscription for GitHub task updates
    const channel = supabase
      .channel('github-task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'github_user_tasks',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchGitHubNotificationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    data,
    loading,
    refetch: fetchGitHubNotificationData,
    sendWeeklyCompletionNotification,
    sendStreakMilestoneNotification
  };
}