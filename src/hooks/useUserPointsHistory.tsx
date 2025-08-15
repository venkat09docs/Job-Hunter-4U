import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserActivityPoint {
  id: string;
  user_id: string;
  activity_id: string;
  activity_type: string;
  points_earned: number;
  activity_date: string;
  created_at: string;
  activity_settings?: {
    activity_name: string;
    description: string;
    category: string;
  };
}

export const useUserPointsHistory = () => {
  const [pointsHistory, setPointsHistory] = useState<UserActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserPointsHistory();
    }
  }, [user]);

  const fetchUserPointsHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch user's activity points with related activity settings
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_points')
        .select(`
          *,
          activity_settings:activity_point_settings(
            activity_name,
            description,
            category
          )
        `)
        .eq('user_id', user?.id)
        .order('activity_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (activityError) {
        console.error('Error fetching user activity points:', activityError);
        throw activityError;
      }

      console.log('User activity points fetched:', activityData);

      // Transform the data and calculate total points
      const transformedData: UserActivityPoint[] = activityData?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        activity_id: item.activity_id,
        activity_type: item.activity_type,
        points_earned: item.points_earned,
        activity_date: item.activity_date,
        created_at: item.created_at,
        activity_settings: item.activity_settings ? {
          activity_name: item.activity_settings.activity_name,
          description: item.activity_settings.description,
          category: item.activity_settings.category
        } : undefined
      })) || [];

      setPointsHistory(transformedData);

      // Calculate total points
      const total = transformedData.reduce((sum, entry) => sum + entry.points_earned, 0);
      setTotalPoints(total);

    } catch (error) {
      console.error('Error fetching user points history:', error);
      toast.error('Failed to load points history');
    } finally {
      setLoading(false);
    }
  };

  return {
    pointsHistory,
    loading,
    totalPoints,
    refreshPointsHistory: fetchUserPointsHistory
  };
};