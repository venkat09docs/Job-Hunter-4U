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

      // Use secure database functions that bypass RLS restrictions
      const [profileBuildData, jobApplyData, linkedinGrowthData, githubRepoData] = await Promise.all([
        supabase.rpc('get_badge_leaders_profile_build'),
        supabase.rpc('get_badge_leaders_job_apply'), 
        supabase.rpc('get_badge_leaders_linkedin_growth'),
        supabase.rpc('get_badge_leaders_github_repository')
      ]);

      // Process the results from secure functions
      const profileBuildLeaders: BadgeLeader[] = (profileBuildData.data || []).slice(0, 3).map(item => ({
        user_id: item.user_id,
        username: item.username || '',
        full_name: item.full_name || '',
        profile_image_url: item.profile_image_url || '',
        total_points: item.total_points || 0,
        badge_type: item.badge_type as 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
      }));

      const jobApplicationLeaders: BadgeLeader[] = (jobApplyData.data || []).slice(0, 3).map(item => ({
        user_id: item.user_id,
        username: item.username || '',
        full_name: item.full_name || '',
        profile_image_url: item.profile_image_url || '',
        total_points: item.total_points || 0,
        badge_type: item.badge_type as 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
      }));

      const linkedinLeaders: BadgeLeader[] = (linkedinGrowthData.data || []).slice(0, 3).map(item => ({
        user_id: item.user_id,
        username: item.username || '',
        full_name: item.full_name || '',
        profile_image_url: item.profile_image_url || '',
        total_points: item.total_points || 0,
        badge_type: item.badge_type as 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
      }));

      const githubLeaders: BadgeLeader[] = (githubRepoData.data || []).slice(0, 3).map(item => ({
        user_id: item.user_id,
        username: item.username || '',
        full_name: item.full_name || '',
        profile_image_url: item.profile_image_url || '',
        total_points: item.total_points || 0,
        badge_type: item.badge_type as 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
      }));

      console.log('🏆 Final badge leaders processed:', {
        profileBuild: profileBuildLeaders.length,
        jobsApply: jobApplicationLeaders.length,
        linkedinGrowth: linkedinLeaders.length,
        githubRepository: githubLeaders.length
      });

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