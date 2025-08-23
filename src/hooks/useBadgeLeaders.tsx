import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BadgeLeader {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url: string;
  total_points: number;
  badge_type: 'Silver' | 'Gold' | 'Diamond';
}

interface BadgeLeadersData {
  profileBuild: BadgeLeader[];
  jobsApply: BadgeLeader[];
  linkedinGrowth: BadgeLeader[];
  githubRepository: BadgeLeader[];
}

export const useBadgeLeaders = () => {
  const [badgeLeaders, setBadgeLeaders] = useState<BadgeLeadersData>({
    profileBuild: [],
    jobsApply: [],
    linkedinGrowth: [],
    githubRepository: []
  });
  const [loading, setLoading] = useState(true);

  const fetchBadgeLeaders = async () => {
    try {
      setLoading(true);

      // Get users who have earned points in various activities
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_activity_points')
        .select(`
          user_id,
          points_earned,
          activity_id,
          profiles!inner(username, full_name, profile_image_url, industry)
        `);

      if (pointsError) throw pointsError;

      // Get users who have earned profile badges
      const { data: profileBadgeData, error: badgeError } = await supabase
        .from('profile_user_badges')
        .select(`
          user_id,
          awarded_at,
          profile_badges!inner (
            points_required,
            tier,
            title
          ),
          profiles!inner(username, full_name, profile_image_url, industry)
        `);

      if (badgeError) throw badgeError;

      // Process data to categorize leaders by activity type
      const processLeaders = (activityCategories: string[], includeITOnly = false, includeProfileBadges = false) => {
        const userPointsMap = new Map<string, { user_id: string; total_points: number; profile: any }>();
        
        pointsData?.forEach((item: any) => {
          // Check if this activity matches our category filters
          const matchesCategory = activityCategories.some(category => 
            item.activity_id?.toLowerCase().includes(category.toLowerCase()) ||
            category === 'profile' && (
              item.activity_id?.includes('completion') || 
              item.activity_id?.includes('resume') || 
              item.activity_id?.includes('linkedin_profile')
            ) ||
            category === 'jobs' && (
              item.activity_id?.includes('job') || 
              item.activity_id?.includes('application')
            ) ||
            category === 'linkedin' && (
              item.activity_id?.includes('linkedin') || 
              item.activity_id?.includes('network')
            ) ||
            category === 'github' && (
              item.activity_id?.includes('github') || 
              item.activity_id?.includes('repo') ||
              item.activity_id?.includes('readme')
            )
          );

          if (!matchesCategory) return;
          
          // If IT only, filter out non-IT users
          if (includeITOnly && item.profiles?.industry !== 'IT') return;
          
          const key = item.user_id;
          if (!userPointsMap.has(key)) {
            userPointsMap.set(key, {
              user_id: item.user_id,
              total_points: 0,
              profile: item.profiles
            });
          }
          
          const current = userPointsMap.get(key)!;
          current.total_points += item.points_earned || 0;
        });

        // Include profile badge holders for profile categories
        if (includeProfileBadges && profileBadgeData) {
          profileBadgeData.forEach((badgeItem: any) => {
            const key = badgeItem.user_id;
            if (!userPointsMap.has(key)) {
              userPointsMap.set(key, {
                user_id: badgeItem.user_id,
                total_points: 0,
                profile: badgeItem.profiles
              });
            }
            
            const current = userPointsMap.get(key)!;
            // Add points based on badge tier
            const badgePoints = badgeItem.profile_badges?.points_required || 0;
            current.total_points += badgePoints;
          });
        }

        // Convert to array and sort by points
        const leaders = Array.from(userPointsMap.values())
          .filter(item => item.total_points > 0)
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 3)
          .map(item => ({
            user_id: item.user_id,
            username: item.profile?.username || '',
            full_name: item.profile?.full_name || '',
            profile_image_url: item.profile?.profile_image_url || '',
            total_points: item.total_points,
            badge_type: getBadgeType(item.total_points)
          }));

        return leaders;
      };

      setBadgeLeaders({
        profileBuild: processLeaders(['profile', 'completion', 'resume'], false, true), // Include profile badges
        jobsApply: processLeaders(['jobs', 'application', 'job_tracker']),
        linkedinGrowth: processLeaders(['linkedin', 'network']),
        githubRepository: processLeaders(['github', 'repo'], true) // IT only
      });

    } catch (error) {
      console.error('Error fetching badge leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeType = (points: number): 'Silver' | 'Gold' | 'Diamond' => {
    if (points >= 500) return 'Diamond';
    if (points >= 200) return 'Gold';
    return 'Silver';
  };

  useEffect(() => {
    fetchBadgeLeaders();
  }, []);

  return {
    badgeLeaders,
    loading,
    refreshBadgeLeaders: fetchBadgeLeaders
  };
};