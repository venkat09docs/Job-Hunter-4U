import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LinkedInNotificationData {
  weeklyCompletion: {
    tasksCompleted: number;
    totalTasks: number;
    pointsEarned: number;
  };
  connectionCount: number;
  recentEngagement: Array<{
    type: string;
    count: number;
    postTitle?: string;
  }>;
  upcomingDeadlines: Array<{
    taskId: string;
    taskTitle: string;
    dueAt: string;
    hoursRemaining: number;
  }>;
}

export function useLinkedInNotifications() {
  const { user } = useAuth();
  const [data, setData] = useState<LinkedInNotificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLinkedInNotificationData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get current week's LinkedIn tasks
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      
      const { data: weeklyTasks, error: weeklyError } = await supabase
        .from('linkedin_user_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', currentWeekStart.toISOString().split('T')[0]);

      if (weeklyError) {
        console.error('Error fetching LinkedIn tasks:', weeklyError);
      }

      // Calculate weekly completion (simplified since we don't have the exact schema)
      const totalTasks = weeklyTasks?.length || 0;
      const completedTasks = weeklyTasks?.filter(task => task.status === 'VERIFIED').length || 0;
      const pointsEarned = completedTasks * 10; // Assuming 10 points per task

      // Get current connection count
      const { data: networkMetrics, error: networkError } = await supabase
        .from('linkedin_network_metrics')
        .select('value')
        .eq('user_id', user.id)
        .eq('activity_id', 'connections')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const connectionCount = networkMetrics?.value || 0;

      // Get upcoming deadlines (next 48 hours) - simplified query
      const upcomingDeadlines: any[] = []; // Placeholder since we need to check actual schema

      // Get recent engagement data (simplified)
      const recentEngagement: any[] = []; // Placeholder

      setData({
        weeklyCompletion: {
          tasksCompleted: completedTasks,
          totalTasks,
          pointsEarned
        },
        connectionCount,
        recentEngagement,
        upcomingDeadlines
      });

    } catch (error) {
      console.error('Error fetching LinkedIn notification data:', error);
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
          title: 'LinkedIn Weekly Complete! 🎯',
          message: `Excellent networking! You completed all LinkedIn tasks this week and earned ${data.weeklyCompletion.pointsEarned} points.`,
          type: 'linkedin_weekly_completed',
          category: 'networking',
          priority: 'medium',
          action_url: '/dashboard/linkedin-optimization'
        });

      console.log('LinkedIn weekly completion notification sent');
    } catch (error) {
      console.error('Error sending LinkedIn weekly completion notification:', error);
    }
  };

  const sendConnectionMilestoneNotification = async (connectionCount: number) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'LinkedIn Connection Milestone! 🤝',
          message: `Fantastic networking! You have reached ${connectionCount} connections. Your network is growing strong!`,
          type: 'linkedin_connection_milestone',
          category: 'networking',
          priority: 'medium',
          action_url: '/dashboard/linkedin-optimization'
        });

      console.log('LinkedIn connection milestone notification sent');
    } catch (error) {
      console.error('Error sending LinkedIn connection milestone notification:', error);
    }
  };

  const sendEngagementNotification = async (engagementCount: number, engagementType: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Great LinkedIn Engagement! 👍',
          message: `Your recent LinkedIn post got ${engagementCount} ${engagementType}! Your content is resonating well.`,
          type: 'linkedin_post_engagement',
          category: 'networking',
          priority: 'low',
          action_url: '/dashboard/linkedin-optimization'
        });

      console.log('LinkedIn engagement notification sent');
    } catch (error) {
      console.error('Error sending LinkedIn engagement notification:', error);
    }
  };

  useEffect(() => {
    fetchLinkedInNotificationData();
    
    // Set up real-time subscription for LinkedIn task updates
    const channel = supabase
      .channel('linkedin-task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linkedin_user_tasks',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchLinkedInNotificationData();
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
    refetch: fetchLinkedInNotificationData,
    sendWeeklyCompletionNotification,
    sendConnectionMilestoneNotification,
    sendEngagementNotification
  };
}
