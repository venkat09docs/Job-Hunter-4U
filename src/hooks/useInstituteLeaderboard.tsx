import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
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
  top_performers: LeaderboardEntry[];
  last_30_days: LeaderboardEntry[];
}

export const useInstituteLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    current_week: [],
    top_performers: [],
    last_30_days: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isInstituteAdmin } = useRole();

  useEffect(() => {
    if (isInstituteAdmin && user) {
      fetchLeaderboard();
    }
  }, [isInstituteAdmin, user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // First get the institute admin's assigned institute
      const { data: adminAssignment, error: adminError } = await supabase
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (adminError) throw adminError;

      if (!adminAssignment?.institute_id) {
        toast.error('No institute assignment found');
        return;
      }

      console.log('Institute admin assignment found:', adminAssignment.institute_id);

      // Fetch leaderboards for different periods
      const currentWeekData = await getLeaderboardForPeriod('current_week', adminAssignment.institute_id);
      const topPerformersData = await getLeaderboardForPeriod('top_performers', adminAssignment.institute_id);
      const last30DaysData = await getLeaderboardForPeriod('last_30_days', adminAssignment.institute_id);

      console.log('Leaderboard data fetched:', {
        current_week: currentWeekData.length,
        top_performers: topPerformersData.length,
        last_30_days: last30DaysData.length
      });

      setLeaderboard({
        current_week: currentWeekData,
        top_performers: topPerformersData,
        last_30_days: last30DaysData
      });
    } catch (error) {
      console.error('Error fetching institute leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboardForPeriod = async (periodType: string, instituteId: string): Promise<LeaderboardEntry[]> => {
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
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(); // Current date/time
      } else if (periodType === 'top_performers') {
        // For top performers, we want all-time data (no date filter)
        startDate = new Date('2020-01-01'); // Start from a very early date
        endDate = new Date();
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
      }

      console.log(`Fetching ${periodType} data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

      // Get users assigned to this institute (all students)
      const { data: instituteUsers, error: usersError } = await supabase
        .from('user_assignments')
        .select('user_id')
        .eq('institute_id', instituteId)
        .eq('assignment_type', 'batch')
        .eq('is_active', true);

      if (usersError) throw usersError;

      console.log('Institute users found:', instituteUsers?.length || 0);

      if (!instituteUsers || instituteUsers.length === 0) {
        return [];
      }

      const userIds = instituteUsers.map(u => u.user_id);

      // Query user activity points for the period for institute users only
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_points')
        .select(`
          user_id,
          points_earned,
          activity_date
        `)
        .in('user_id', userIds)
        .gte('activity_date', startDate.toISOString().split('T')[0])
        .lte('activity_date', endDate.toISOString().split('T')[0]);

      if (activityError) throw activityError;

      console.log('Activity data found for period', periodType, ':', activityData?.length || 0);

      // Group by user and sum points
      const userPoints = new Map<string, number>();
      activityData?.forEach(record => {
        const current = userPoints.get(record.user_id) || 0;
        userPoints.set(record.user_id, current + record.points_earned);
      });

      console.log('User points calculated:', userPoints.size, 'users with points');

      // Get top users (only those with points)
      const topUserIds = Array.from(userPoints.entries())
        .filter(([userId, points]) => points > 0) // Only users with points
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Get top 10
        .map(([userId]) => userId);

      if (topUserIds.length === 0) {
        console.log('No users with points found for period:', periodType);
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

      console.log('Leaderboard entries for', periodType, ':', leaderboardEntries.length);
      return leaderboardEntries;
    } catch (error) {
      console.error(`Error fetching institute leaderboard for period ${periodType}:`, error);
      return [];
    }
  };

  return {
    leaderboard,
    loading,
    refreshLeaderboard: fetchLeaderboard
  };
};