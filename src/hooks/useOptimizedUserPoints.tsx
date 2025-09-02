import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { requestCache } from '@/utils/simpleRequestCache';

interface UserPoints {
  totalPoints: number;
  currentWeekPoints: number;
  currentMonthPoints: number;
  loading: boolean;
}

export const useOptimizedUserPoints = (): UserPoints => {
  const { user } = useAuth();
  const [points, setPoints] = useState({
    totalPoints: 0,
    currentWeekPoints: 0,
    currentMonthPoints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserPoints = async () => {
      try {
        setLoading(true);

        // Use cached request with consolidated RPC function
        const result = await requestCache.interceptRequest(
          async () => {
            const { data, error } = await supabase.rpc('get_user_points_consolidated', { target_user_id: user.id });
            return { data, error };
          },
          `/rpc/get_user_points_consolidated?user=${user.id}`,
          'POST'
        ) as { data: any[], error: any };

        if (result.error) {
          console.error('Error fetching user points:', result.error);
          return;
        }

        const data = result.data?.[0];
        if (data) {
          setPoints({
            totalPoints: Number(data.total_points) || 0,
            currentWeekPoints: Number(data.current_week_points) || 0,
            currentMonthPoints: Number(data.current_month_points) || 0,
          });
        }
      } catch (error) {
        console.error('Error in fetchUserPoints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPoints();

    // Set up single real-time subscription for points updates
    const channel = supabase
      .channel('optimized-user-points')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_points',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Clear cache and refetch
          requestCache.clearCache('get_user_points_consolidated');
          setTimeout(fetchUserPoints, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    ...points,
    loading,
  };
};