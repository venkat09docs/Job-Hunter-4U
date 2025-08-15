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

export interface BatchLeaderboard {
  batch_id: string;
  batch_name: string;
  batch_code: string;
  entries: LeaderboardEntry[];
}

export const useBatchLeaderboards = () => {
  const [batchLeaderboards, setBatchLeaderboards] = useState<BatchLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isInstituteAdmin } = useRole();

  useEffect(() => {
    if (isInstituteAdmin && user) {
      fetchBatchLeaderboards();
    }
  }, [isInstituteAdmin, user]);

  const fetchBatchLeaderboards = async () => {
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

      // Get all batches for this institute
      const { data: batches, error: batchError } = await supabase
        .from('batches')
        .select('id, name, code')
        .eq('institute_id', adminAssignment.institute_id)
        .eq('is_active', true);

      if (batchError) throw batchError;

      if (!batches || batches.length === 0) {
        setBatchLeaderboards([]);
        return;
      }

      // Get leaderboard for each batch (current week)
      const batchLeaderboardsData = await Promise.all(
        batches.map(async (batch) => {
          const entries = await getBatchLeaderboard(batch.id, adminAssignment.institute_id);
          return {
            batch_id: batch.id,
            batch_name: batch.name,
            batch_code: batch.code,
            entries: entries.slice(0, 5) // Top 5 performers per batch
          };
        })
      );

      setBatchLeaderboards(batchLeaderboardsData);
    } catch (error) {
      console.error('Error fetching batch leaderboards:', error);
      toast.error('Failed to load batch leaderboards');
    } finally {
      setLoading(false);
    }
  };

  const getBatchLeaderboard = async (batchId: string, instituteId: string): Promise<LeaderboardEntry[]> => {
    try {
      // Calculate current week date range (Monday to current date/time)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + mondayOffset);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(); // Current date/time

      // Get users assigned to this specific batch
      const { data: batchUsers, error: usersError } = await supabase
        .from('user_assignments')
        .select('user_id')
        .eq('institute_id', instituteId)
        .eq('batch_id', batchId)
        .eq('assignment_type', 'batch')
        .eq('is_active', true);

      if (usersError) throw usersError;

      console.log('Batch users found for batch', batchId, ':', batchUsers?.length || 0);

      if (!batchUsers || batchUsers.length === 0) {
        return [];
      }

      const userIds = batchUsers.map(u => u.user_id);

      // Query user activity points for the current week for batch users only
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

      console.log('Batch activity data found:', activityData?.length || 0);

      // Group by user and sum points
      const userPoints = new Map<string, number>();
      activityData?.forEach(record => {
        const current = userPoints.get(record.user_id) || 0;
        userPoints.set(record.user_id, current + record.points_earned);
      });

      // Get top users (only those with points)
      const topUserIds = Array.from(userPoints.entries())
        .filter(([userId, points]) => points > 0) // Only users with points
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);

      if (topUserIds.length === 0) {
        console.log('No users with points in batch:', batchId);
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

      console.log('Batch leaderboard entries:', leaderboardEntries.length);
      return leaderboardEntries;
    } catch (error) {
      console.error(`Error fetching batch leaderboard for batch ${batchId}:`, error);
      return [];
    }
  };

  return {
    batchLeaderboards,
    loading,
    refreshBatchLeaderboards: fetchBatchLeaderboards
  };
};