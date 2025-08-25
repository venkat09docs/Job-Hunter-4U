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

      // Use RPC function for safer profile data access
      const { data: rpcProfileData, error: rpcError } = await supabase
        .rpc('get_safe_leaderboard_profiles');

      if (rpcError) {
        console.error('❌ Error fetching profiles:', rpcError);
      }

      // Get users who have earned profile badges
      const { data: profileBadgeData, error: profileBadgeError } = await supabase
        .from('profile_user_badges')
        .select(`
          user_id,
          awarded_at,
          progress_data,
          profile_badges (
            code,
            title,
            tier,
            points_required
          )
        `)
        .order('awarded_at', { ascending: false });

      if (profileBadgeError) {
        console.error('❌ Error fetching profile badges:', profileBadgeError);
      }

      // Get actual user activity points for badge holders
      const badgeUserIds = profileBadgeData?.map(badge => badge.user_id) || [];
      const { data: userPointsData, error: pointsError } = await supabase
        .from('user_activity_points')
        .select('user_id, points_earned')
        .in('user_id', badgeUserIds);

      if (pointsError) {
        console.error('❌ Error fetching user points:', pointsError);
      }

      // Calculate total points per user from activity points
      const userPointsMap = new Map<string, number>();
      userPointsData?.forEach(point => {
        const current = userPointsMap.get(point.user_id) || 0;
        userPointsMap.set(point.user_id, current + point.points_earned);
      });

      // Combine badge data with profile data and real activity points
      let processedProfileBadgeData = [];
      if (profileBadgeData && profileBadgeData.length > 0 && rpcProfileData && rpcProfileData.length > 0) {
        processedProfileBadgeData = profileBadgeData.map(badge => {
          const profile = rpcProfileData.find(p => p.user_id === badge.user_id);
          return {
            ...badge,
            profiles: profile,
            actual_points: userPointsMap.get(badge.user_id) || 0 // Use real activity points
          };
        }).filter(badge => badge.profiles); // Only include badges with valid profiles
      }

      // Get users with job application activity
      const { data: jobActivityData, error: jobError } = await supabase
        .from('job_tracker')
        .select(`
          user_id,
          created_at,
          profiles!inner(username, full_name, profile_image_url, industry)
        `)
        .not('status', 'eq', 'wishlist')
        .order('created_at', { ascending: false });

      if (jobError) console.error('❌ Error fetching job data:', jobError);

      // Get users with LinkedIn network activity  
      const { data: linkedinActivityData, error: linkedinError } = await supabase
        .from('linkedin_network_metrics')
        .select(`
          user_id,
          value,
          activity_id,
          profiles!inner(username, full_name, profile_image_url, industry)
        `)
        .order('created_at', { ascending: false });

      if (linkedinError) console.error('❌ Error fetching LinkedIn data:', linkedinError);

      // Get users with GitHub activity
      const { data: githubActivityData, error: githubError } = await supabase
        .from('github_progress')
        .select(`
          user_id,
          completed,
          profiles!inner(username, full_name, profile_image_url, industry)
        `)
        .eq('completed', true)
        .order('updated_at', { ascending: false });

      if (githubError) console.error('❌ Error fetching GitHub data:', githubError);

      // Process Profile Build Champions (users with profile badges)
      const profileBuildLeaders = processProfileBadgeLeaders(processedProfileBadgeData || []);
      
      // Process Job Application Masters
      const jobApplicationLeaders = processJobLeaders(jobActivityData || []);
      
      // Process LinkedIn Network Stars
      const linkedinLeaders = processLinkedInLeaders(linkedinActivityData || []);
      
      // Process GitHub Repository Experts (IT users only)
      const githubLeaders = processGitHubLeaders(githubActivityData || []);

      console.log('🏆 Final badge leaders processed:', {
        profileBuild: profileBuildLeaders.length,
        jobsApply: jobApplicationLeaders.length,
        linkedinGrowth: linkedinLeaders.length,
        githubRepository: githubLeaders.length
      });

      console.log('🏆 Final profile build leaders to display:', profileBuildLeaders);

      setBadgeLeaders({
        profileBuild: profileBuildLeaders,
        jobsApply: jobApplicationLeaders,
        linkedinGrowth: linkedinLeaders,
        githubRepository: githubLeaders
      });

    } catch (error) {
      console.error('❌ Error fetching badge leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process users who have earned profile badges
  const processProfileBadgeLeaders = (badgeData: any[]): BadgeLeader[] => {
    if (badgeData.length === 0) {
      return [];
    }

    const userBadgesMap = new Map<string, { user_id: string; profile: any; badges: any[]; maxTier: string; totalPoints: number }>();
    
    badgeData.forEach((item: any) => {
      const key = item.user_id;
      if (!userBadgesMap.has(key)) {
        userBadgesMap.set(key, {
          user_id: item.user_id,
          profile: item.profiles,
          badges: [],
          maxTier: 'bronze',
          totalPoints: item.actual_points || 0 // Use real activity points, not badge requirements
        });
      }
      
      const current = userBadgesMap.get(key)!;
      current.badges.push(item.profile_badges);
      // Don't add badge requirements to points - use actual activity points only
      
      // Determine highest tier
      const tier = item.profile_badges.tier;
      if (tier === 'gold') current.maxTier = 'gold';
      else if (tier === 'silver' && current.maxTier !== 'gold') current.maxTier = 'silver';
    });

    const result = Array.from(userBadgesMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.totalPoints, // Now shows real activity points
        badge_type: getBadgeTypeFromTier(item.maxTier) as 'Silver' | 'Gold' | 'Diamond'
      }));

    return result;
  };

  // Process users with job applications
  const processJobLeaders = (jobData: any[]): BadgeLeader[] => {
    const userJobsMap = new Map<string, { user_id: string; profile: any; count: number }>();
    
    jobData.forEach((item: any) => {
      const key = item.user_id;
      if (!userJobsMap.has(key)) {
        userJobsMap.set(key, {
          user_id: item.user_id,
          profile: item.profiles,
          count: 0
        });
      }
      userJobsMap.get(key)!.count++;
    });

    return Array.from(userJobsMap.values())
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.count * 10, // 10 points per job application
        badge_type: getBadgeType(item.count * 10)
      }));
  };

  // Process users with LinkedIn network activity
  const processLinkedInLeaders = (linkedinData: any[]): BadgeLeader[] => {
    const userNetworkMap = new Map<string, { user_id: string; profile: any; totalValue: number }>();
    
    linkedinData.forEach((item: any) => {
      const key = item.user_id;
      if (!userNetworkMap.has(key)) {
        userNetworkMap.set(key, {
          user_id: item.user_id,
          profile: item.profiles,
          totalValue: 0
        });
      }
      userNetworkMap.get(key)!.totalValue += item.value || 0;
    });

    return Array.from(userNetworkMap.values())
      .filter(item => item.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.totalValue * 5, // 5 points per network activity
        badge_type: getBadgeType(item.totalValue * 5)
      }));
  };

  // Process users with GitHub activity (IT users only)
  const processGitHubLeaders = (githubData: any[]): BadgeLeader[] => {
    const userGithubMap = new Map<string, { user_id: string; profile: any; completedTasks: number }>();
    
    githubData.forEach((item: any) => {
      // Only include IT users
      if (item.profiles?.industry !== 'IT') return;
      
      const key = item.user_id;
      if (!userGithubMap.has(key)) {
        userGithubMap.set(key, {
          user_id: item.user_id,
          profile: item.profiles,
          completedTasks: 0
        });
      }
      userGithubMap.get(key)!.completedTasks++;
    });

    return Array.from(userGithubMap.values())
      .filter(item => item.completedTasks > 0)
      .sort((a, b) => b.completedTasks - a.completedTasks)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.completedTasks * 20, // 20 points per completed GitHub task
        badge_type: getBadgeType(item.completedTasks * 20)
      }));
  };

  const getBadgeTypeFromTier = (tier: string): string => {
    switch (tier) {
      case 'gold': return 'Gold';
      case 'silver': return 'Silver';
      case 'bronze': return 'Silver'; // Show bronze as Silver for display
      default: return 'Silver';
    }
  };

  const getBadgeType = (points: number): 'Silver' | 'Gold' | 'Diamond' => {
    if (points >= 500) return 'Diamond';
    if (points >= 200) return 'Gold';
    return 'Silver';
  };

  useEffect(() => {
    fetchBadgeLeaders().catch(error => {
      console.error('🏆 useBadgeLeaders: Error in useEffect:', error);
    });
  }, []);

  return {
    badgeLeaders,
    loading,
    refreshBadgeLeaders: fetchBadgeLeaders
  };
};