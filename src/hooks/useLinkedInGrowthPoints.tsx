import { useEffect, useCallback, useRef, useState } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface ActivityMetrics {
  [key: string]: number;
}

interface ActivityStatus {
  [key: string]: 'success' | 'warning' | 'danger' | 'neutral';
}

export const useLinkedInGrowthPoints = (
  currentWeeklyMetrics: ActivityMetrics, 
  previousWeeklyMetrics: ActivityMetrics = {}
) => {
  const { awardPoints } = useProfileBuildingPoints();
  const processingRef = useRef(false);
  const [previousWeeklyValues, setPreviousWeeklyValues] = useState<ActivityMetrics>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Define activities and their points (from Leader Board Points Management -> LinkedIn Growth)
  const LINKEDIN_ACTIVITIES = {
    'comments': { points: 10 },
    'post_likes': { points: 10 },
    'content': { points: 15 },
    'connection_requests': { points: 15 },
    'follow_up': { points: 20 },
    'industry_research': { points: 15 },
    'create_post': { points: 25 },
    'profile_optimization': { points: 30 },
    'profile_views': { points: 10 },
    'connections_accepted': { points: 10 },
  };

  // Award or deduct points based on weekly progress changes
  const checkAndAwardPoints = useCallback(async () => {
    // Prevent concurrent execution
    if (processingRef.current) {
      console.log('Points check already in progress, skipping...');
      return;
    }
    
    // Don't process points on initial load - only after we have established a baseline
    if (!isInitialized) {
      console.log('Initializing baseline weekly values, not processing points');
      setPreviousWeeklyValues(currentWeeklyMetrics);
      setIsInitialized(true);
      return;
    }
    
    processingRef.current = true;

    try {
      // Check each activity for weekly progress changes
      for (const [activityId, currentWeeklyValue] of Object.entries(currentWeeklyMetrics)) {
        if (!LINKEDIN_ACTIVITIES[activityId]) continue;

        const previousWeeklyValue = previousWeeklyValues[activityId] || 0;
        const progressDifference = currentWeeklyValue - previousWeeklyValue;
        
        // Only process if there's a meaningful change
        if (progressDifference !== 0) {
          console.log(`Weekly progress changed for ${activityId}: ${previousWeeklyValue} -> ${currentWeeklyValue} (difference: ${progressDifference})`);
          
          try {
            const activity = LINKEDIN_ACTIVITIES[activityId];
            const pointsToAward = Math.abs(progressDifference) * activity.points;
            
            if (progressDifference > 0) {
              // Award points when weekly progress increases
              const success = await awardPoints(activityId, 'linkedin_growth', false, pointsToAward);
              if (success) {
                console.log(`Successfully awarded ${pointsToAward} points for ${activityId} (increase by ${progressDifference})`);
              }
            } else if (progressDifference < 0) {
              // Deduct points when weekly progress decreases
              const success = await awardPoints(activityId, 'linkedin_growth', true, pointsToAward);
              if (success) {
                console.log(`Successfully deducted ${pointsToAward} points for ${activityId} (decrease by ${Math.abs(progressDifference)})`);
              }
            }
          } catch (error) {
            console.error(`Failed to process points for ${activityId}:`, error);
          }
        }
      }
      
      // Update previous weekly values for next check
      setPreviousWeeklyValues(currentWeeklyMetrics);
    } finally {
      processingRef.current = false;
    }
  }, [currentWeeklyMetrics, previousWeeklyValues, awardPoints, isInitialized]);

  // Run point check whenever weekly metrics change, but with debouncing
  useEffect(() => {
    if (Object.keys(currentWeeklyMetrics).length > 0) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        checkAndAwardPoints();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [checkAndAwardPoints]);

  return {
    checkAndAwardPoints
  };
};