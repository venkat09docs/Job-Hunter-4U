import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ProfileBadge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  category: string;
  criteria: any;
  points_required: number;
}

interface ProfileUserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  progress_data: any;
  profile_badges: ProfileBadge;
}

export const useProfileBadges = () => {
  const [profileBadges, setProfileBadges] = useState<ProfileBadge[]>([]);
  const [userBadges, setUserBadges] = useState<ProfileUserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfileBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_badges')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      setProfileBadges((data || []).map(badge => ({
        ...badge,
        tier: badge.tier as 'bronze' | 'silver' | 'gold'
      })));
    } catch (error) {
      console.error('Error fetching profile badges:', error);
    }
  };

  const fetchUserBadges = async () => {
    if (!user || loading) return;

    try {
      const { data, error } = await supabase
        .from('profile_user_badges')
        .select(`
          *,
          profile_badges (*)
        `)
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      setUserBadges((data || []).map(userBadge => ({
        ...userBadge,
        profile_badges: {
          ...userBadge.profile_badges,
          tier: userBadge.profile_badges.tier as 'bronze' | 'silver' | 'gold'
        }
      })));
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
  };

  const checkAndAwardBadges = async () => {
    if (!user) return;

    try {
      // Call the database function to check and award badges
      const { error } = await supabase.rpc('award_profile_badges_for_user', {
        user_uuid: user.id
      });

      if (error) throw error;
      
      // Refresh user badges after potential awards
      await fetchUserBadges();
    } catch (error) {
      console.error('Error checking badge awards:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfileBadges(),
        fetchUserBadges()
      ]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Set up real-time subscription for badge awards with debouncing
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const channel = supabase
      .channel('profile-badge-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Debounce badge fetching to prevent race conditions
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchUserBadges();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    profileBadges,
    userBadges,
    loading,
    checkAndAwardBadges,
    refreshBadges: () => Promise.all([fetchProfileBadges(), fetchUserBadges()])
  };
};