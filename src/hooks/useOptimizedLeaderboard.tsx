import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserInstitute } from './useUserInstitute';
import { supabase } from '@/integrations/supabase/client';
import { requestCache } from '@/utils/simpleRequestCache';
import { toast } from 'sonner';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  username: string;
  profile_image_url?: string;
  total_points: number;
  rank_position: number;
}

export interface LeaderboardData {
  top_performer: LeaderboardEntry[];
  current_week: LeaderboardEntry[];
  last_30_days: LeaderboardEntry[];
  current_user_points: {
    current_week: number;
    last_30_days: number;
    all_time: number;
  };
}

export const useOptimizedLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    top_performer: [],
    current_week: [],
    last_30_days: [],
    current_user_points: {
      current_week: 0,
      last_30_days: 0,
      all_time: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isInstituteUser, instituteId } = useUserInstitute();

  useEffect(() => {
    fetchLeaderboard();
  }, [isInstituteUser, instituteId]);

  // Single real-time subscription for leaderboard updates
  useEffect(() => {
    const channel = supabase
      .channel('optimized-leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_points'
        },
        () => {
          // Clear cache and refetch with debouncing
          requestCache.clearCache('get_leaderboard_optimized');
          requestCache.clearCache('get_user_points_consolidated');
          setTimeout(fetchLeaderboard, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get current user points and all leaderboard periods in parallel with caching
      const [userPointsResult, topPerformerResult, currentWeekResult, last30DaysResult] = await Promise.all([
        user ? requestCache.interceptRequest(
          async () => {
            const { data, error } = await supabase.rpc('get_user_points_consolidated', { target_user_id: user.id });
            return { data, error };
          },
          `/rpc/get_user_points_consolidated?user=${user.id}`,
          'POST'
        ) : Promise.resolve({ data: [{ total_points: 0, current_week_points: 0, current_month_points: 0 }], error: null }),
        
        requestCache.interceptRequest(
          async () => {
            const { data, error } = await supabase.rpc('get_leaderboard_optimized', { period_type: 'top_performer', limit_count: 5 });
            return { data, error };
          },
          '/rpc/get_leaderboard_optimized?period=top_performer&limit=5',
          'POST'
        ),
        
        requestCache.interceptRequest(
          async () => {
            const { data, error } = await supabase.rpc('get_leaderboard_optimized', { period_type: 'current_week', limit_count: 5 });
            return { data, error };
          },
          '/rpc/get_leaderboard_optimized?period=current_week&limit=5',
          'POST'
        ),
        
        requestCache.interceptRequest(
          async () => {
            const { data, error } = await supabase.rpc('get_leaderboard_optimized', { period_type: 'last_30_days', limit_count: 5 });
            return { data, error };
          },
          '/rpc/get_leaderboard_optimized?period=last_30_days&limit=5',
          'POST'
        )
      ]) as [
        { data: any[], error: any },
        { data: any[], error: any },
        { data: any[], error: any },
        { data: any[], error: any }
      ];

      // Process user points
      const userPointsData = userPointsResult.data?.[0];
      const currentUserPoints = {
        current_week: Number(userPointsData?.current_week_points) || 0,
        last_30_days: Number(userPointsData?.current_month_points) || 0, // Using month as proxy for 30 days
        all_time: Number(userPointsData?.total_points) || 0
      };

      // Process leaderboard data
      const mapLeaderboardData = (data: any[]): LeaderboardEntry[] => {
        return (data || []).map(entry => ({
          user_id: entry.user_id,
          full_name: entry.full_name || 'Unknown User',
          username: entry.username || 'unknown',
          profile_image_url: entry.profile_image_url,
          total_points: Number(entry.total_points) || 0,
          rank_position: Number(entry.rank_position) || 0
        }));
      };

      setLeaderboard({
        top_performer: mapLeaderboardData(topPerformerResult.data),
        current_week: mapLeaderboardData(currentWeekResult.data),
        last_30_days: mapLeaderboardData(last30DaysResult.data),
        current_user_points: currentUserPoints
      });

    } catch (error) {
      console.error('Error fetching optimized leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return {
    leaderboard,
    loading,
    refreshLeaderboard: fetchLeaderboard
  };
};