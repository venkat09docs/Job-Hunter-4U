import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BadgeLeader {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url: string;
  total_points: number;
  badge_type: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
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

      // Get all profiles directly since recruiters should see all user details
      const { data: allProfilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, profile_image_url, industry');

      if (profilesError) {
        console.error('❌ Error fetching all profiles:', profilesError);
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

      // Get total current points for badge holders (including negative adjustments)
      const badgeUserIds = profileBadgeData?.map(badge => badge.user_id) || [];
      const { data: userPointsData, error: pointsError } = await supabase
        .from('user_activity_points')
        .select('user_id, points_earned')
        .in('user_id', badgeUserIds);

      if (pointsError) {
        console.error('❌ Error fetching user points:', pointsError);
      }

      // Calculate total current points per user (including negative adjustments)
      const userPointsMap = new Map<string, number>();
      userPointsData?.forEach(point => {
        const current = userPointsMap.get(point.user_id) || 0;
        userPointsMap.set(point.user_id, current + point.points_earned);
      });

      // Combine badge data with profile data and current total points
      let processedProfileBadgeData = [];
      if (profileBadgeData && profileBadgeData.length > 0 && allProfilesData && allProfilesData.length > 0) {
        processedProfileBadgeData = profileBadgeData.map(badge => {
          const profile = allProfilesData.find(p => p.user_id === badge.user_id);
          return {
            ...badge,
            profiles: profile,
            current_points: userPointsMap.get(badge.user_id) || 0 // Use current total points (matches dashboard)
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
          completed
        `)
        .eq('completed', true)
        .order('updated_at', { ascending: false });

      if (githubError) console.error('❌ Error fetching GitHub data:', githubError);

      // Get profile data for GitHub users separately
      const githubUserIds = githubActivityData?.map(item => item.user_id) || [];
      let githubProfileData = [];
      if (githubUserIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, profile_image_url, industry')
          .in('user_id', githubUserIds);
        
        if (profileError) {
          console.error('❌ Error fetching GitHub profiles:', profileError);
        } else {
          githubProfileData = profileData || [];
        }
      }

      // Combine GitHub progress with profile data
      const githubActivityWithProfiles = githubActivityData?.map(item => ({
        ...item,
        profiles: githubProfileData.find(profile => profile.user_id === item.user_id)
      })).filter(item => item.profiles) || [];

      // Process Profile Build Champions (users with profile badges)
      const profileBuildLeaders = processProfileBadgeLeaders(processedProfileBadgeData || []);
      
      // Process Job Application Masters
      const jobApplicationLeaders = processJobLeaders(jobActivityData || []);
      
      // Process LinkedIn Network Stars
      const linkedinLeaders = processLinkedInLeaders(linkedinActivityData || []);
      
      // Process GitHub Repository Experts (IT users only) - async
      const githubLeaders = await processGitHubLeaders(githubActivityWithProfiles || []);

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

    // Group badges by user and find their highest tier badge
    const userBadgesMap = new Map<string, { 
      user_id: string; 
      profile: any; 
      badges: any[]; 
      highestBadge: any;
      currentPoints: number;
    }>();
    
    badgeData.forEach((item: any) => {
      const key = item.user_id;
      if (!userBadgesMap.has(key)) {
        userBadgesMap.set(key, {
          user_id: item.user_id,
          profile: item.profiles,
          badges: [],
          highestBadge: item.profile_badges,
          currentPoints: item.current_points || 0
        });
      }
      
      const current = userBadgesMap.get(key)!;
      current.badges.push(item.profile_badges);
      
      // Update to highest tier badge
      const currentTier = item.profile_badges.tier;
      const existingTier = current.highestBadge.tier;
      
      // Gold > Silver > Bronze priority
      if (currentTier === 'gold' || 
          (currentTier === 'silver' && existingTier === 'bronze')) {
        current.highestBadge = item.profile_badges;
      }
    });

    // Sort by total points and return top users
    const result = Array.from(userBadgesMap.values())
      .sort((a, b) => b.currentPoints - a.currentPoints)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.currentPoints,
        badge_type: getBadgeTypeFromTier(item.highestBadge.tier) as 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
      }));

    return result;
  };

  // Process users with job applications - Level Up integration
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
      .filter(item => item.count > 0) // Only show users who have applied to at least 1 job (Silver badge)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.count * 10, // 10 points per job application
        badge_type: getJobApplicationBadgeType(item.count) // Use Level Up job badge logic
      }));
  };

  // Process LinkedIn network growth leaders - Level Up integration
  const processLinkedInLeaders = (linkedinData: any[]): BadgeLeader[] => {
    const userNetworkMap = new Map<string, { user_id: string; profile: any; totalConnections: number }>();
    
    linkedinData.forEach((item: any) => {
      const key = item.user_id;
      if (!userNetworkMap.has(key)) {
        userNetworkMap.set(key, {
          user_id: item.user_id,
          profile: item.profiles,
          totalConnections: 0
        });
      }
      // Sum all network activities as connections (connections, likes, comments, shares, posts)
      userNetworkMap.get(key)!.totalConnections += item.value || 0;
    });

    return Array.from(userNetworkMap.values())
      .filter(item => item.totalConnections >= 10) // Only show users who have at least 10 connections (Silver badge)
      .sort((a, b) => b.totalConnections - a.totalConnections)
      .slice(0, 3)
      .map(item => ({
        user_id: item.user_id,
        username: item.profile?.username || '',
        full_name: item.profile?.full_name || '',
        profile_image_url: item.profile?.profile_image_url || '',
        total_points: item.totalConnections * 5, // 5 points per network activity
        badge_type: getLinkedInBadgeType(item.totalConnections) // Use Level Up LinkedIn badge logic
      }));
  };

  // Process GitHub repository leaders - Level Up integration  
  const processGitHubLeaders = async (githubData: any[]): Promise<BadgeLeader[]> => {
    try {
      // Get all IT user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          full_name,
          profile_image_url,
          industry
        `)
        .eq('industry', 'IT'); // Only IT users for GitHub badges

      if (!profiles) return [];

      const userGitHubMap = new Map<string, { 
        user_id: string; 
        profile: any; 
        repoCount: number; 
        commitCount: number; 
      }>();

      // Get repository counts for each user
      const { data: repoData } = await supabase
        .from('github_repos')
        .select('user_id')
        .eq('is_active', true);

      // Get commit counts for each user from github_signals (use POST_PUBLISHED as closest match)
      const { data: commitData } = await supabase
        .from('github_signals')
        .select('user_id')
        .eq('kind', 'POST_PUBLISHED'); // Using available enum value

      // Count repos per user
      repoData?.forEach(repo => {
        const userId = repo.user_id;
        if (!userGitHubMap.has(userId)) {
          const profile = profiles.find(p => p.user_id === userId);
          if (profile) {
            userGitHubMap.set(userId, {
              user_id: userId,
              profile,
              repoCount: 0,
              commitCount: 0
            });
          }
        }
        if (userGitHubMap.has(userId)) {
          userGitHubMap.get(userId)!.repoCount++;
        }
      });

      // Count commits per user (using signals as proxy for commits)
      commitData?.forEach(commit => {
        const userId = commit.user_id;
        if (userGitHubMap.has(userId)) {
          userGitHubMap.get(userId)!.commitCount++;
        }
      });

      return Array.from(userGitHubMap.values())
        .filter(item => {
          // Only show users who have achieved at least Silver badge (1 repo + 5 commits)
          return item.repoCount >= 1 && item.commitCount >= 5;
        })
        .sort((a, b) => {
          // Sort by badge tier first, then by total activity
          const aBadge = getGitHubBadgeType(a.repoCount, a.commitCount);
          const bBadge = getGitHubBadgeType(b.repoCount, b.commitCount);
          const badgeOrder = { 'Diamond': 4, 'Gold': 3, 'Silver': 2, 'Bronze': 1 };
          
          if (badgeOrder[aBadge] !== badgeOrder[bBadge]) {
            return badgeOrder[bBadge] - badgeOrder[aBadge];
          }
          
          // If same badge tier, sort by total activity (repos * 20 + commits)
          const aActivity = a.repoCount * 20 + a.commitCount;
          const bActivity = b.repoCount * 20 + b.commitCount;
          return bActivity - aActivity;
        })
        .slice(0, 3)
        .map(item => ({
          user_id: item.user_id,
          username: item.profile?.username || '',
          full_name: item.profile?.full_name || '',
          profile_image_url: item.profile?.profile_image_url || '',
          total_points: item.repoCount * 20 + item.commitCount, // 20 points per repo + 1 point per commit
          badge_type: getGitHubBadgeType(item.repoCount, item.commitCount)
        }));
    } catch (error) {
      console.error('❌ Error fetching GitHub leaders:', error);
      return [];
    }
  };

  const getBadgeTypeFromTier = (tier: string): string => {
    switch (tier) {
      case 'gold': return 'Gold';
      case 'silver': return 'Silver';
      case 'bronze': return 'Bronze'; // Show bronze as Bronze
      default: return 'Bronze';
    }
  };

  const getBadgeType = (points: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' => {
    if (points >= 500) return 'Diamond';
    if (points >= 200) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  };

  // Level Up job application badge logic - matches BadgeProgressionMap
  const getJobApplicationBadgeType = (jobCount: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' => {
    if (jobCount >= 30) return 'Diamond'; // Interview Magnet - 30+ jobs
    if (jobCount >= 14) return 'Gold';    // Consistency Champ - 14 jobs
    if (jobCount >= 1) return 'Silver';   // First Step - 1 job
    return 'Bronze'; // Should not reach here as we filter for count > 0
  };

  // Level Up LinkedIn network growth badge logic - matches BadgeProgressionMap
  const getLinkedInBadgeType = (connectionCount: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' => {
    if (connectionCount >= 50) return 'Diamond'; // Network Master - 50+ connections
    if (connectionCount >= 25) return 'Gold';    // Growth Champion - 25+ connections
    if (connectionCount >= 10) return 'Silver';  // First Connections - 10+ connections
    return 'Bronze'; // Should not reach here as we filter for connectionCount >= 10
  };

  // Level Up GitHub repository badge logic - matches BadgeProgressionMap
  const getGitHubBadgeType = (repoCount: number, commitCount: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' => {
    if (repoCount >= 5 && commitCount >= 100) return 'Diamond'; // Code Master - 5 repos + 100 commits
    if (repoCount >= 3 && commitCount >= 30) return 'Gold';     // Repository Expert - 3 repos + 30 commits
    if (repoCount >= 1 && commitCount >= 5) return 'Silver';   // First Repository - 1 repo + 5 commits
    return 'Bronze'; // Should not reach here as we filter for repoCount >= 1 && commitCount >= 5
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