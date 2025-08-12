import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay } from 'date-fns';

interface DailyNetworkActivity {
  date: string;
  post_likes: number;
  comments: number;
  shares: number;
  connection_requests: number;
  create_post: number;
  profile_optimization: number;
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

  const fetchDailyActivities = useCallback(async (page: number = 1, pageSize: number = 10) => {
    if (!user) return;

    setLoading(true);
    try {
      const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
      
      // Get unique dates count up to today
      const { data: uniqueDateData } = await supabase
        .from('linkedin_network_metrics')
        .select('date')
        .eq('user_id', user.id)
        .lte('date', today);

      const uniqueDateCount = [...new Set(uniqueDateData?.map(d => d.date) || [])].length;
      setTotalCount(uniqueDateCount);

      // First, get distinct dates for pagination
      const { data: dateData, error: dateError } = await supabase
        .from('linkedin_network_metrics')
        .select('date')
        .eq('user_id', user.id)
        .lte('date', today)
        .order('date', { ascending: false });

      if (dateError) throw dateError;

      // Get unique dates and apply pagination
      const uniqueDates = [...new Set(dateData?.map(d => d.date) || [])];
      const offset = (page - 1) * pageSize;
      const paginatedDates = uniqueDates.slice(offset, offset + pageSize);

      if (paginatedDates.length === 0) {
        setActivities([]);
        return;
      }

      // Fetch all metrics for the paginated dates
      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('date, activity_id, value')
        .eq('user_id', user.id)
        .in('date', paginatedDates)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group by date and aggregate activities
      const groupedByDate: { [key: string]: Partial<DailyNetworkActivity> } = {};

      // Initialize all paginated dates with zero values
      paginatedDates.forEach(date => {
        groupedByDate[date] = {
          date: format(parseISO(date), 'MMM dd, yyyy'),
          post_likes: 0,
          comments: 0,
          shares: 0,
          connection_requests: 0,
          create_post: 0,
          profile_optimization: 0,
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
              groupedByDate[date].research! += metric.value;
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
          (activity.research || 0) +
          (activity.follow_up_messages || 0) +
          (activity.engage_in_groups || 0) +
          (activity.work_on_article || 0);
      });

      // Convert to array and maintain date order
      const activitiesArray = paginatedDates
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