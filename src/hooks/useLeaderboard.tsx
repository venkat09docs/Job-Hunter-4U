import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  current_week: LeaderboardEntry[];
  last_week: LeaderboardEntry[];
  last_30_days: LeaderboardEntry[];
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    current_week: [],
    last_week: [],
    last_30_days: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Refresh leaderboard when user_activity_points table changes
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_points'
        },
        () => {
          console.log('User activity points updated, refreshing leaderboard...');
          fetchLeaderboard();
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
      
      // Get current week leaderboard
      const currentWeekData = await getLeaderboardForPeriod('current_week');
      const lastWeekData = await getLeaderboardForPeriod('last_week');
      const last30DaysData = await getLeaderboardForPeriod('last_30_days');

      setLeaderboard({
        current_week: currentWeekData,
        last_week: lastWeekData,
        last_30_days: last30DaysData
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboardForPeriod = async (periodType: string): Promise<LeaderboardEntry[]> => {
    try {
      // Calculate date ranges
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (periodType === 'current_week') {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(today);
        startDate.setDate(today.getDate() + mondayOffset);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else if (periodType === 'last_week') {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const lastMondayOffset = dayOfWeek === 0 ? -13 : -6 - dayOfWeek;
        startDate = new Date(today);
        startDate.setDate(today.getDate() + lastMondayOffset);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
      }

      // Query user activity points for the period
      console.log(`Querying leaderboard for ${periodType} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_points')
        .select(`
          user_id,
          points_earned,
          activity_date
        `)
        .gte('activity_date', startDate.toISOString().split('T')[0])
        .lte('activity_date', endDate.toISOString().split('T')[0]);

      console.log(`Found ${activityData?.length || 0} activity records for ${periodType}`);

      if (activityError) throw activityError;

      // Group by user and sum points
      const userPoints = new Map<string, number>();
      activityData?.forEach(record => {
        const current = userPoints.get(record.user_id) || 0;
        userPoints.set(record.user_id, current + record.points_earned);
      });

      // Get user details for top 10 users
      const topUserIds = Array.from(userPoints.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      if (topUserIds.length === 0) {
        return [];
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url')
        .in('user_id', topUserIds);

      if (profileError) throw profileError;

      // Combine user data with points and rankings
      const leaderboardEntries: LeaderboardEntry[] = topUserIds.map((userId, index) => {
        const profile = profileData?.find(p => p.user_id === userId);
        return {
          user_id: userId,
          full_name: profile?.full_name || 'Unknown User',
          username: profile?.username || 'unknown',
          profile_image_url: profile?.profile_image_url,
          total_points: userPoints.get(userId) || 0,
          rank_position: index + 1
        };
      });

      return leaderboardEntries;
    } catch (error) {
      console.error(`Error fetching ${periodType} leaderboard:`, error);
      return [];
    }
  };

  return {
    leaderboard,
    loading,
    refreshLeaderboard: fetchLeaderboard
  };
};