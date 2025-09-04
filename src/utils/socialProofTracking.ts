import { supabase } from '@/integrations/supabase/client';

interface TrackEventOptions {
  eventType: string;
  userId?: string;
  eventData?: any;
  userFirstName?: string;
  location?: string;
}

/**
 * Track a social proof event by calling the edge function
 * This ensures proper permissions and data validation
 */
export const trackSocialProofEvent = async (options: TrackEventOptions) => {
  try {
    const { data, error } = await supabase.functions.invoke('track-social-proof-event', {
      body: {
        event_type: options.eventType,
        user_id: options.userId,
        event_data: options.eventData || {},
        user_first_name: options.userFirstName,
        location: options.location
      }
    });

    if (error) {
      console.error('Error tracking social proof event:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to track social proof event:', error);
    return { success: false, error };
  }
};

/**
 * Helper functions for common social proof events
 */
export const socialProofHelpers = {
  /**
   * Track when a user completes payment (premium upgrade)
   */
  trackPremiumUpgrade: async (userId: string, userFirstName?: string, planName?: string) => {
    return trackSocialProofEvent({
      eventType: 'premium_upgrade',
      userId,
      userFirstName,
      eventData: { plan_name: planName }
    });
  },

  /**
   * Track when a user applies to a job
   */
  trackJobApplication: async (userId: string, userFirstName?: string, jobTitle?: string, company?: string) => {
    return trackSocialProofEvent({
      eventType: 'job_application',
      userId,
      userFirstName,
      eventData: { job_title: jobTitle, company }
    });
  },

  /**
   * Track when a user completes their resume
   */
  trackResumeCompletion: async (userId: string, userFirstName?: string, completionPercentage?: number) => {
    return trackSocialProofEvent({
      eventType: 'resume_completion',
      userId,
      userFirstName,
      eventData: { completion_percentage: completionPercentage }
    });
  },

  /**
   * Track when a user optimizes their LinkedIn profile
   */
  trackLinkedInOptimization: async (userId: string, userFirstName?: string, tasksCompleted?: number) => {
    return trackSocialProofEvent({
      eventType: 'linkedin_optimization',
      userId,
      userFirstName,
      eventData: { tasks_completed: tasksCompleted }
    });
  },

  /**
   * Track when a user sets up their GitHub profile
   */
  trackGitHubSetup: async (userId: string, userFirstName?: string, reposCreated?: number) => {
    return trackSocialProofEvent({
      eventType: 'github_setup',
      userId,
      userFirstName,
      eventData: { repos_created: reposCreated }
    });
  }
};