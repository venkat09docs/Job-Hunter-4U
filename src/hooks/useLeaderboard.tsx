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
  top_performer: LeaderboardEntry[];
  current_week: LeaderboardEntry[];
  last_30_days: LeaderboardEntry[];
  current_user_points: {
    current_week: number;
    last_30_days: number;
    all_time: number;
  };
}

export const useLeaderboard = () => {
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
      
      // Calculate current user's points for all periods first
      const currentUserPoints = await getCurrentUserPoints();
      
      // Get leaderboards for different periods
      const topPerformerData = await getLeaderboardForPeriod('top_performer');
      const currentWeekData = await getLeaderboardForPeriod('current_week');
      const last30DaysData = await getLeaderboardForPeriod('last_30_days');

      setLeaderboard({
        top_performer: topPerformerData,
        current_week: currentWeekData,
        last_30_days: last30DaysData,
        current_user_points: currentUserPoints
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserPoints = async () => {
    if (!user) {
      return { current_week: 0, last_30_days: 0, all_time: 0 };
    }

    try {
      // Get current week points
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const daysBackToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      
      const weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() - daysBackToMonday);
      weekStartDate.setHours(0, 0, 0, 0);

      const { data: currentWeekData } = await supabase
        .from('user_activity_points')
        .select('points_earned')
        .eq('user_id', user.id)
        .gte('activity_date', weekStartDate.toISOString().split('T')[0])
        .lte('activity_date', new Date().toISOString().split('T')[0]);

      // Get last 30 days points
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: last30DaysData } = await supabase
        .from('user_activity_points')
        .select('points_earned')
        .eq('user_id', user.id)
        .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('activity_date', new Date().toISOString().split('T')[0]);

      // Get all time points
      const { data: allTimeData } = await supabase
        .from('user_activity_points')
        .select('points_earned')
        .eq('user_id', user.id);

      const currentWeekPoints = currentWeekData?.reduce((sum, record) => sum + record.points_earned, 0) || 0;
      const last30DaysPoints = last30DaysData?.reduce((sum, record) => sum + record.points_earned, 0) || 0;
      const allTimePoints = allTimeData?.reduce((sum, record) => sum + record.points_earned, 0) || 0;

      console.log('Current user points calculated:', { 
        current_week: currentWeekPoints, 
        last_30_days: last30DaysPoints, 
        all_time: allTimePoints 
      });

      return {
        current_week: currentWeekPoints,
        last_30_days: last30DaysPoints,
        all_time: allTimePoints
      };
    } catch (error) {
      console.error('Error calculating current user points:', error);
      return { current_week: 0, last_30_days: 0, all_time: 0 };
    }
  };

  const getLeaderboardForPeriod = async (periodType: string): Promise<LeaderboardEntry[]> => {
    try {
      // Calculate date ranges
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (periodType === 'top_performer') {
        // No date filter for top performer - get all time records
        startDate = new Date('2020-01-01'); // Far back date to include all records
        endDate = new Date();
      } else if (periodType === 'current_week') {
        // Get current week's Monday to current date/time
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Calculate days back to this Monday
        const daysBackToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // If Sunday, go back 6 days, otherwise current day - 1
        
        startDate = new Date(today);
        startDate.setDate(today.getDate() - daysBackToMonday);
        startDate.setHours(0, 0, 0, 0);
        
        // End date is current date/time
        endDate = new Date();
      } else {
        // Last 30 days
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
      }

      // Query user activity points for the period
      console.log(`Querying leaderboard for ${periodType} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      let query = supabase
        .from('user_activity_points')
        .select(`
          user_id,
          points_earned,
          activity_date
        `);
      
      // Apply date filters only if not top_performer
      if (periodType !== 'top_performer') {
        query = query
          .gte('activity_date', startDate.toISOString().split('T')[0])
          .lte('activity_date', endDate.toISOString().split('T')[0]);
      }
      
      const { data: activityData, error: activityError } = await query;

      console.log(`Found ${activityData?.length || 0} activity records for ${periodType}`);

      if (activityError) throw activityError;

      // Group by user and sum points
      const userPoints = new Map<string, number>();
      activityData?.forEach(record => {
        const current = userPoints.get(record.user_id) || 0;
        userPoints.set(record.user_id, current + record.points_earned);
      });

      // Get user details for top 5 users
      const topUserIds = Array.from(userPoints.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);

      // Always include current user if they have points but aren't in top 5
      if (user && userPoints.has(user.id) && !topUserIds.includes(user.id)) {
        topUserIds.push(user.id);
      }

      if (topUserIds.length === 0) {
        return [];
      }

      const { data: profileData, error: profileError } = await supabase
        .rpc('get_safe_leaderboard_profiles');

      if (profileError) throw profileError;

      // Filter profiles to only include users in our leaderboard
      const filteredProfiles = profileData?.filter(p => topUserIds.includes(p.user_id)) || [];

      // Combine user data with points and rankings for top 5
      const topFiveEntries: LeaderboardEntry[] = topUserIds.slice(0, 5).map((userId, index) => {
        const profile = filteredProfiles?.find(p => p.user_id === userId);
        return {
          user_id: userId,
          full_name: profile?.full_name || 'Unknown User',
          username: profile?.username || 'unknown',
          profile_image_url: profile?.profile_image_url,
          total_points: userPoints.get(userId) || 0,
          rank_position: index + 1
        };
      });

      // If current user is not in top 5, add them separately for points display
      let leaderboardEntries = topFiveEntries;
      if (user && userPoints.has(user.id) && !topFiveEntries.some(entry => entry.user_id === user.id)) {
        const profile = filteredProfiles?.find(p => p.user_id === user.id);
        const userEntry: LeaderboardEntry = {
          user_id: user.id,
          full_name: profile?.full_name || 'Unknown User',
          username: profile?.username || 'unknown',
          profile_image_url: profile?.profile_image_url,
          total_points: userPoints.get(user.id) || 0,
          rank_position: Array.from(userPoints.entries())
            .sort((a, b) => b[1] - a[1])
            .findIndex(([userId]) => userId === user.id) + 1
        };
        leaderboardEntries = [...topFiveEntries, userEntry];
      }

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