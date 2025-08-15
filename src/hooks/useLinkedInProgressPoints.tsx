import { useEffect } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface ProfileData {
  full_name?: string;
  linkedin_url?: string;
  bio?: string;
  profile_image_url?: string;
  email?: string;
}

export const useLinkedInProgressPoints = (profileData: ProfileData | null) => {
  const { awardLinkedInProfileCompletion80Points } = useProfileBuildingPoints();

  // Calculate LinkedIn profile completion percentage
  const calculateLinkedInProgress = (data: ProfileData | null): number => {
    if (!data) return 0;

    let completedFields = 0;
    const totalFields = 5;

    // Check full name
    if (data.full_name && data.full_name.trim().length > 0) {
      completedFields++;
    }

    // Check LinkedIn URL
    if (data.linkedin_url && data.linkedin_url.trim().length > 0) {
      completedFields++;
    }

    // Check bio/summary
    if (data.bio && data.bio.trim().length > 0) {
      completedFields++;
    }

    // Check profile image
    if (data.profile_image_url && data.profile_image_url.trim().length > 0) {
      completedFields++;
    }

    // Check email
    if (data.email && data.email.trim().length > 0) {
      completedFields++;
    }

    return Math.round((completedFields / totalFields) * 100);
  };

  useEffect(() => {
    const progress = calculateLinkedInProgress(profileData);
    
    // Award points if LinkedIn profile reaches 80% completion
    if (progress >= 80) {
      awardLinkedInProfileCompletion80Points();
    }
  }, [profileData, awardLinkedInProfileCompletion80Points]);

  return {
    linkedInProgress: calculateLinkedInProgress(profileData),
    calculateLinkedInProgress
  };
};