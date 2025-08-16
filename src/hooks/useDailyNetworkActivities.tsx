import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay, startOfWeek, endOfWeek, addDays } from 'date-fns';

interface DailyNetworkActivity {
  date: string;
  post_likes: number;
  comments: number;
  shares: number;
  connection_requests: number;
  create_post: number;
  profile_optimization: number;
  content: number;
  research: number;
  follow_up_messages: number;
  engage_in_groups: number;
  work_on_article: number;
  total_activities: number;
}

export const useDailyNetworkActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DailyNetworkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyActivities = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get current week's date range (Monday to Sunday)
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
      
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');
      
      // Generate all dates in current week
      const currentWeekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        currentWeekDates.push(format(date, 'yyyy-MM-dd'));
      }
      
      setTotalCount(currentWeekDates.length);

      // Fetch all metrics for the current week
      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('date, activity_id, value')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group by date and aggregate activities
      const groupedByDate: { [key: string]: Partial<DailyNetworkActivity> } = {};

      // Initialize all current week dates with zero values
      currentWeekDates.forEach(date => {
        groupedByDate[date] = {
          date: format(parseISO(date), 'MMM dd, yyyy'),
          post_likes: 0,
          comments: 0,
          shares: 0,
          connection_requests: 0,
          create_post: 0,
          profile_optimization: 0,
          content: 0,
          research: 0,
          follow_up_messages: 0,
          engage_in_groups: 0,
          work_on_article: 0,
          total_activities: 0,
        };
      });

      // Aggregate the actual metric values
      data?.forEach(metric => {
        const date = metric.date;
        if (groupedByDate[date]) {
          switch (metric.activity_id) {
            case 'post_likes':
              groupedByDate[date].post_likes! += metric.value;
              break;
            case 'comments':
              groupedByDate[date].comments! += metric.value;
              break;
            case 'shares':
              groupedByDate[date].shares! += metric.value;
              break;
            case 'connection_requests':
              groupedByDate[date].connection_requests! += metric.value;
              break;
            case 'create_post':
              groupedByDate[date].create_post! += metric.value;
              break;
            case 'profile_optimization':
              groupedByDate[date].profile_optimization! += metric.value;
              break;
            case 'content':
              groupedByDate[date].content! += metric.value;
              break;
            case 'industry_research':
              groupedByDate[date].research! += metric.value;
              break;
            case 'follow_up':
              groupedByDate[date].follow_up_messages! += metric.value;
              break;
            case 'industry_groups':
              groupedByDate[date].engage_in_groups! += metric.value;
              break;
            case 'article_draft':
              groupedByDate[date].work_on_article! += metric.value;
              break;
          }
        }
      });

      // Calculate total activities for each date
      Object.keys(groupedByDate).forEach(date => {
        const activity = groupedByDate[date];
        activity.total_activities = 
          (activity.post_likes || 0) +
          (activity.comments || 0) +
          (activity.shares || 0) +
          (activity.connection_requests || 0) +
          (activity.create_post || 0) +
          (activity.profile_optimization || 0) +
          (activity.content || 0) +
          (activity.research || 0) +
          (activity.follow_up_messages || 0) +
          (activity.engage_in_groups || 0) +
          (activity.work_on_article || 0);
      });

      // Convert to array and maintain date order (most recent first)
      const activitiesArray = currentWeekDates
        .reverse() // Show most recent date first
        .map(date => groupedByDate[date] as DailyNetworkActivity);

      setActivities(activitiesArray);
    } catch (error) {
      console.error('Error fetching daily network activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDailyActivities();
    }
  }, [user, fetchDailyActivities]);

  return {
    activities,
    loading,
    totalCount,
    fetchDailyActivities,
    refreshActivities: () => fetchDailyActivities(),
  };
};