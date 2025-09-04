import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { socialProofHelpers } from '@/utils/socialProofTracking';

/**
 * Hook to easily track social proof events with user context
 */
export const useTrackSocialProof = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  const getUserFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    if (profile?.username) {
      return profile.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return undefined;
  };

  return {
    trackPremiumUpgrade: (planName?: string) => {
      if (!user?.id) return Promise.resolve({ success: false, error: 'No user' });
      return socialProofHelpers.trackPremiumUpgrade(
        user.id,
        getUserFirstName(),
        planName
      );
    },

    trackJobApplication: (jobTitle?: string, company?: string) => {
      if (!user?.id) return Promise.resolve({ success: false, error: 'No user' });
      return socialProofHelpers.trackJobApplication(
        user.id,
        getUserFirstName(),
        jobTitle,
        company
      );
    },

    trackResumeCompletion: (completionPercentage?: number) => {
      if (!user?.id) return Promise.resolve({ success: false, error: 'No user' });
      return socialProofHelpers.trackResumeCompletion(
        user.id,
        getUserFirstName(),
        completionPercentage
      );
    },

    trackLinkedInOptimization: (tasksCompleted?: number) => {
      if (!user?.id) return Promise.resolve({ success: false, error: 'No user' });
      return socialProofHelpers.trackLinkedInOptimization(
        user.id,
        getUserFirstName(),
        tasksCompleted
      );
    },

    trackGitHubSetup: (reposCreated?: number) => {
      if (!user?.id) return Promise.resolve({ success: false, error: 'No user' });
      return socialProofHelpers.trackGitHubSetup(
        user.id,
        getUserFirstName(),
        reposCreated
      );
    }
  };
};