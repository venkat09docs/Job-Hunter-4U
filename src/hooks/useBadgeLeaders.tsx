import { useState, useEffect } from 'react';
import { useUserInstitute } from './useUserInstitute';
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
  const { isInstituteUser, instituteId } = useUserInstitute();

  const fetchBadgeLeaders = async () => {
    try {
      setLoading(true);

      console.log('🏆 Badge Leaders - Institute Status:', { isInstituteUser, instituteId });

      let profileBuildData, jobApplyData, linkedinGrowthData, githubRepoData;

      // Use institute-specific functions if user is institute user
      if (isInstituteUser && instituteId) {
        console.log('🏆 Fetching institute-specific badge leaders for institute:', instituteId);
        [profileBuildData, jobApplyData, linkedinGrowthData, githubRepoData] = await Promise.all([
          supabase.rpc('get_institute_badge_leaders_profile_build', { institute_id_param: instituteId }),
          supabase.rpc('get_institute_badge_leaders_job_apply', { institute_id_param: instituteId }),
          supabase.rpc('get_institute_badge_leaders_linkedin_growth', { institute_id_param: instituteId }),
          supabase.rpc('get_institute_badge_leaders_github_repository', { institute_id_param: instituteId })
        ]);
      } else {
        console.log('🏆 Fetching global badge leaders (non-institute user)');
        // Use global functions for admins/recruiters/non-institute users
        [profileBuildData, jobApplyData, linkedinGrowthData, githubRepoData] = await Promise.all([
          supabase.rpc('get_badge_leaders_profile_build'),
          supabase.rpc('get_badge_leaders_job_apply'), 
          supabase.rpc('get_badge_leaders_linkedin_growth'),
          supabase.rpc('get_badge_leaders_github_repository')
        ]);

        // For non-institute users, filter out institute users
        if (!isInstituteUser) {
          const { data: instituteUsers } = await supabase
            .from('user_assignments')
            .select('user_id')
            .eq('is_active', true);
          
          const instituteUserIds = new Set(instituteUsers?.map(u => u.user_id) || []);
          
          // Filter out institute users from each dataset
          if (profileBuildData.data) {
            profileBuildData.data = profileBuildData.data.filter((leader: any) => 
              !instituteUserIds.has(leader.user_id)
            );
          }
          if (jobApplyData.data) {
            jobApplyData.data = jobApplyData.data.filter((leader: any) => 
              !instituteUserIds.has(leader.user_id)
            );
          }
          if (linkedinGrowthData.data) {
            linkedinGrowthData.data = linkedinGrowthData.data.filter((leader: any) => 
              !instituteUserIds.has(leader.user_id)
            );
          }
          if (githubRepoData.data) {
            githubRepoData.data = githubRepoData.data.filter((leader: any) => 
              !instituteUserIds.has(leader.user_id)
            );
          }
        }
      }

      if (profileBuildData.error) {
        console.error('❌ Error fetching profile build leaders:', profileBuildData.error);
      }
      if (jobApplyData.error) {
        console.error('❌ Error fetching job apply leaders:', jobApplyData.error);
      }
      if (linkedinGrowthData.error) {
        console.error('❌ Error fetching LinkedIn growth leaders:', linkedinGrowthData.error);
      }
      if (githubRepoData.error) {
        console.error('❌ Error fetching GitHub repo leaders:', githubRepoData.error);
      }

      // Transform the data to match the expected BadgeLeader interface
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

      console.log('🏆 Profile build leaders:', profileBuildLeaders);
      console.log('🏆 Job application leaders:', jobApplicationLeaders);
      console.log('🏆 LinkedIn growth leaders:', linkedinLeaders);
      console.log('🏆 GitHub repository leaders:', githubLeaders);

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
  }, [isInstituteUser, instituteId]);

  return {
    badgeLeaders,
    loading,
    refreshBadgeLeaders: fetchBadgeLeaders
  };
};