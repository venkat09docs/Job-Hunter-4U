import { useEffect } from 'react';
import { useTrackSocialProof } from '@/hooks/useTrackSocialProof';

/**
 * Hook to automatically track social proof events from job tracker activities
 * This integrates with existing job tracking functionality
 */
export const useJobTrackerSocialProof = () => {
  const { trackJobApplication } = useTrackSocialProof();

  // Function to track job application when user adds a new job to tracker
  const trackJobApplicationFromTracker = async (jobData: {
    company?: string;
    role?: string;
    status?: string;
  }) => {
    // Only track when user actually applies (not just adds to wishlist)
    if (jobData.status === 'applied') {
      await trackJobApplication(jobData.role, jobData.company);
    }
  };

  return {
    trackJobApplicationFromTracker
  };
};