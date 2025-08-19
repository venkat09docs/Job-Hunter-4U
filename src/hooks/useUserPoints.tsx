import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserPoints {
  totalPoints: number;
  currentWeekPoints: number;
  currentMonthPoints: number;
  loading: boolean;
}

export const useUserPoints = (): UserPoints => {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentWeekPoints, setCurrentWeekPoints] = useState(0);
  const [currentMonthPoints, setCurrentMonthPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserPoints = async () => {
      try {
        setLoading(true);

        // Get total points for user
        const { data: totalData, error: totalError } = await supabase
          .from('user_activity_points')
          .select('points_earned')
          .eq('user_id', user.id);

        if (totalError) {
          console.error('Error fetching total points:', totalError);
          setTotalPoints(0);
        } else {
          const total = totalData?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
          setTotalPoints(total);
        }

        // Get current week points (Monday to Sunday)
        const startOfWeek = new Date();
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const { data: weekData, error: weekError } = await supabase
          .from('user_activity_points')
          .select('points_earned')
          .eq('user_id', user.id)
          .gte('activity_date', startOfWeek.toISOString().split('T')[0])
          .lte('activity_date', endOfWeek.toISOString().split('T')[0]);

        if (weekError) {
          console.error('Error fetching week points:', weekError);
          setCurrentWeekPoints(0);
        } else {
          const weekTotal = weekData?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
          setCurrentWeekPoints(weekTotal);
        }

        // Get current month points
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const { data: monthData, error: monthError } = await supabase
          .from('user_activity_points')
          .select('points_earned')
          .eq('user_id', user.id)
          .gte('activity_date', startOfMonth.toISOString().split('T')[0])
          .lte('activity_date', endOfMonth.toISOString().split('T')[0]);

        if (monthError) {
          console.error('Error fetching month points:', monthError);
          setCurrentMonthPoints(0);
        } else {
          const monthTotal = monthData?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
          setCurrentMonthPoints(monthTotal);
        }

      } catch (error) {
        console.error('Error in fetchUserPoints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPoints();

    // Set up real-time subscription for points updates
    const channel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_points',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch points when changes occur
          fetchUserPoints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    totalPoints,
    currentWeekPoints,
    currentMonthPoints,
    loading,
  };
};