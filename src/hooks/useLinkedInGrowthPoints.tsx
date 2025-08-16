import { useEffect, useCallback } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface ActivityMetrics {
  [key: string]: number;
}

export const useLinkedInGrowthPoints = (
  todayMetrics: ActivityMetrics, 
  previousMetrics: ActivityMetrics = {}
) => {
  const { awardPoints } = useProfileBuildingPoints();

  // Award points when activities are completed or targets are met
  const checkAndAwardPoints = useCallback(async () => {
    // Define point-worthy thresholds for each activity
    const POINT_THRESHOLDS = {
      // Content creation activities - award once when created
      'create_post': 1, // Award when user creates 1+ posts
      'profile_optimization': 1, // Award when profile is optimized
      
      // Daily target-based activities - award when daily target is met
      'comments': 2, // Award when 2+ comments made (daily target)
      'post_likes': 3, // Award when 3+ likes given (daily target)
      'content': 2, // Award when 2+ content shared (daily target)
      'connection_requests': 2, // Award when 2+ connection requests sent
      'follow_up': 1, // Award when 1+ follow-up messages sent
      'industry_research': 1, // Award when 1+ industry research done
      
      // Growth metrics - award based on achievement
      'profile_views': 5, // Award when 5+ profile views received
      'connections_accepted': 1, // Award when 1+ connections accepted
    };

    // Check each activity for point eligibility
    for (const [activityId, currentValue] of Object.entries(todayMetrics)) {
      const threshold = POINT_THRESHOLDS[activityId];
      const previousValue = previousMetrics[activityId] || 0;
      
      if (threshold && currentValue >= threshold && previousValue < threshold) {
        // Award points for reaching the threshold for the first time today
        console.log(`Awarding points for ${activityId}: ${currentValue} >= ${threshold}`);
        
        try {
          await awardPoints(activityId, 'linkedin_growth');
        } catch (error) {
          console.error(`Failed to award points for ${activityId}:`, error);
        }
      }
    }
  }, [todayMetrics, previousMetrics, awardPoints]);

  // Run point check whenever metrics change
  useEffect(() => {
    if (Object.keys(todayMetrics).length > 0) {
      checkAndAwardPoints();
    }
  }, [checkAndAwardPoints]);

  return {
    checkAndAwardPoints
  };
};