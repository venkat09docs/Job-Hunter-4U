import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface NetworkGrowthMetrics {
  totalConnections: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalPosts: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

export const useNetworkGrowthMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<NetworkGrowthMetrics>({
    totalConnections: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalPosts: 0,
    weeklyProgress: 0,
    monthlyProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNetworkGrowthMetrics();
    }
  }, [user]);

  const fetchNetworkGrowthMetrics = async () => {
    if (!user) return;

    try {
      const today = new Date();
      
      // Calculate current week (Monday to Sunday)
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1; // How many days back to Monday
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - mondayOffset);
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);
      
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Fetch all-time metrics
      const { data: allTimeMetrics, error: allTimeError } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id);

      if (allTimeError) throw allTimeError;

      // Fetch current week metrics (Monday to Sunday)
      const { data: weeklyMetrics, error: weeklyError } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id)
        .gte('date', currentWeekStart.toISOString().split('T')[0])
        .lte('date', currentWeekEnd.toISOString().split('T')[0]);

      if (weeklyError) throw weeklyError;

      // Fetch monthly metrics
      const { data: monthlyMetrics, error: monthlyError } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', user.id)
        .gte('date', monthAgo.toISOString().split('T')[0]);

      if (monthlyError) throw monthlyError;

      // Aggregate all-time metrics
      const totals = {
        totalConnections: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalPosts: 0,
      };

      allTimeMetrics?.forEach(metric => {
        switch (metric.activity_id) {
          case 'connection_requests':
            totals.totalConnections += metric.value;
            break;
          case 'post_likes':
            totals.totalLikes += metric.value;
            break;
          case 'comments':
            totals.totalComments += metric.value;
            break;
          case 'shares':
            totals.totalShares += metric.value;
            break;
          case 'create_post':
            totals.totalPosts += metric.value;
            break;
        }
      });

      // Calculate current week metrics by activity type
      const weeklyTotals = {
        totalConnections: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalPosts: 0,
      };

      weeklyMetrics?.forEach(metric => {
        switch (metric.activity_id) {
          case 'connection_requests':
            weeklyTotals.totalConnections += metric.value;
            break;
          case 'post_likes':
            weeklyTotals.totalLikes += metric.value;
            break;
          case 'comments':
            weeklyTotals.totalComments += metric.value;
            break;
          case 'shares':
            weeklyTotals.totalShares += metric.value;
            break;
          case 'create_post':
            weeklyTotals.totalPosts += metric.value;
            break;
        }
      });

      // Calculate weekly and monthly totals
      const weeklyTotal = weeklyMetrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;
      const monthlyTotal = monthlyMetrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;

      setMetrics({
        // Use current week totals instead of all-time for individual activities
        totalConnections: weeklyTotals.totalConnections,
        totalLikes: weeklyTotals.totalLikes,
        totalComments: weeklyTotals.totalComments,
        totalShares: weeklyTotals.totalShares,
        totalPosts: weeklyTotals.totalPosts,
        weeklyProgress: weeklyTotal,
        monthlyProgress: monthlyTotal,
      });
    } catch (error) {
      console.error('Error fetching network growth metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    refreshMetrics: fetchNetworkGrowthMetrics,
  };
};