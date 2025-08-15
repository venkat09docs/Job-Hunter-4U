import { useEffect } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface GitHubProfileData {
  github_url?: string;
  full_name?: string;
  bio?: string;
  profile_image_url?: string;
  // Additional GitHub-specific fields that could indicate profile completion
  hasRepositories?: boolean;
  hasReadme?: boolean;
}

export const useGitHubProgressPoints = (profileData: GitHubProfileData | null) => {
  const { awardGitHubProfileCompletion80Points } = useProfileBuildingPoints();

  // Calculate GitHub profile completion percentage
  const calculateGitHubProgress = (data: GitHubProfileData | null): number => {
    if (!data) return 0;

    let completedFields = 0;
    const totalFields = 5;

    // Check GitHub URL
    if (data.github_url && data.github_url.trim().length > 0) {
      completedFields++;
    }

    // Check full name
    if (data.full_name && data.full_name.trim().length > 0) {
      completedFields++;
    }

    // Check bio
    if (data.bio && data.bio.trim().length > 0) {
      completedFields++;
    }

    // Check profile image
    if (data.profile_image_url && data.profile_image_url.trim().length > 0) {
      completedFields++;
    }

    // Check if has repositories (this could be determined by checking GitHub API or user input)
    if (data.hasRepositories) {
      completedFields++;
    }

    return Math.round((completedFields / totalFields) * 100);
  };

  useEffect(() => {
    const progress = calculateGitHubProgress(profileData);
    
    // Award points if GitHub profile reaches 80% completion
    if (progress >= 80) {
      awardGitHubProfileCompletion80Points();
    }
  }, [profileData, awardGitHubProfileCompletion80Points]);

  return {
    gitHubProgress: calculateGitHubProgress(profileData),
    calculateGitHubProgress
  };
};