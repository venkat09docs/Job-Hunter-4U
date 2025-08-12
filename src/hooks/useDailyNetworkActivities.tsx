import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface DailyNetworkActivity {
  date: string;
  post_likes: number;
  comments: number;
  shares: number;
  connection_requests: number;
  create_post: number;
  profile_optimization: number;
  research: number;
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
      const offset = (page - 1) * pageSize;

      // Get total count first
      const { count } = await supabase
        .from('linkedin_network_metrics')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalCount(count || 0);

      // Fetch the metrics with pagination
      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('date, activity_id, value')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      // Group by date and aggregate activities
      const groupedByDate: { [key: string]: Partial<DailyNetworkActivity> } = {};

      data?.forEach(metric => {
        const date = metric.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date: format(parseISO(date), 'MMM dd, yyyy'),
            post_likes: 0,
            comments: 0,
            shares: 0,
            connection_requests: 0,
            create_post: 0,
            profile_optimization: 0,
            research: 0,
          };
        }

        switch (metric.activity_id) {
          case 'post_likes':
            groupedByDate[date].post_likes = metric.value;
            break;
          case 'comments':
            groupedByDate[date].comments = metric.value;
            break;
          case 'shares':
            groupedByDate[date].shares = metric.value;
            break;
          case 'connection_requests':
            groupedByDate[date].connection_requests = metric.value;
            break;
          case 'create_post':
            groupedByDate[date].create_post = metric.value;
            break;
          case 'profile_optimization':
            groupedByDate[date].profile_optimization = metric.value;
            break;
          case 'research':
            groupedByDate[date].research = metric.value;
            break;
        }
      });

      // Convert to array and sort by date (newest first)
      const activitiesArray = Object.keys(groupedByDate)
        .map(date => groupedByDate[date] as DailyNetworkActivity)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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