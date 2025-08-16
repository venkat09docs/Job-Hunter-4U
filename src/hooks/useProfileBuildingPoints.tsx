import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useProfileBuildingPoints = () => {
  const { user } = useAuth();
  const [isAwarding, setIsAwarding] = useState(false);

  const awardPoints = async (activityId: string, activityType: string = 'completion_milestone') => {
    if (!user) return false;
    
    // Prevent concurrent calls for the same activity
    if (isAwarding) {
      console.log('Points awarding already in progress, skipping...');
      return false;
    }

    setIsAwarding(true);
    try {
      // Check if activity exists and is active
      const { data: activitySetting, error: activityError } = await supabase
        .from('activity_point_settings')
        .select('*')
        .eq('activity_id', activityId)
        .eq('is_active', true)
        .single();

      if (activityError || !activitySetting) {
        console.error('Activity not found or inactive:', activityId);
        return false;
      }

      // Check if user already received points for this activity today (only for profile building activities)
      if (activityType !== 'linkedin_growth') {
        const today = new Date().toISOString().split('T')[0];
        const { data: existingPoints, error: checkError } = await supabase
          .from('user_activity_points')
          .select('*')
          .eq('user_id', user.id)
          .eq('activity_id', activityId)
          .eq('activity_date', today)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing points:', checkError);
          return false;
        }

        if (existingPoints) {
          console.log(`Points already awarded for ${activityId} today (${today})`);
          return false;
        }
      }

      // Award points to user
      const today = new Date().toISOString().split('T')[0];
      const { error: insertError } = await supabase
        .from('user_activity_points')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          activity_id: activityId,
          points_earned: activitySetting.points,
          activity_date: today
        });

      if (insertError) {
        console.error('Error awarding points:', insertError);
        toast.error('Failed to award points');
        return false;
      }

      toast.success(`🎉 Earned ${activitySetting.points} points for ${activitySetting.activity_name}!`);
      return true;

    } catch (error) {
      console.error('Error in awardPoints:', error);
      toast.error('Failed to award points');
      return false;
    } finally {
      setIsAwarding(false);
    }
  };

  // Specific methods for each activity
  const awardResumeCompletion80Points = () => {
    return awardPoints('resume_completion_80', 'completion_milestone');
  };

  const awardLinkedInProfileCompletion80Points = () => {
    return awardPoints('linkedin_profile_completion_80', 'completion_milestone');
  };

  const awardGitHubProfileCompletion80Points = () => {
    return awardPoints('github_profile_completion_80', 'completion_milestone');
  };

  const awardCoverLetterSavedPoints = () => {
    return awardPoints('cover_letter_saved_resources', 'resource_save');
  };

  const awardResumeSavedPoints = () => {
    return awardPoints('resume_saved_resources', 'resource_save');
  };

  const awardReadmeSavedPoints = () => {
    return awardPoints('readme_saved_resources', 'resource_save');
  };

  return {
    isAwarding,
    awardResumeCompletion80Points,
    awardLinkedInProfileCompletion80Points,
    awardGitHubProfileCompletion80Points,
    awardCoverLetterSavedPoints,
    awardResumeSavedPoints,
    awardReadmeSavedPoints,
    awardPoints // Generic method for custom usage
  };
};