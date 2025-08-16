import { useEffect, useCallback, useRef, useState } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface ActivityMetrics {
  [key: string]: number;
}

interface ActivityStatus {
  [key: string]: 'success' | 'warning' | 'danger' | 'neutral';
}

export const useLinkedInGrowthPoints = (
  todayMetrics: ActivityMetrics, 
  previousMetrics: ActivityMetrics = {}
) => {
  const { awardPoints } = useProfileBuildingPoints();
  const processingRef = useRef(false);
  const [previousStatus, setPreviousStatus] = useState<ActivityStatus>({});

  // Define daily activities and their targets
  const DAILY_ACTIVITIES = {
    'comments': { dailyTarget: 2, points: 10 },
    'post_likes': { dailyTarget: 3, points: 10 },
    'content': { dailyTarget: 2, points: 15 },
    'connection_requests': { dailyTarget: 2, points: 15 },
    'follow_up': { dailyTarget: 1, points: 20 },
    'industry_research': { dailyTarget: 1, points: 15 },
    'create_post': { dailyTarget: 1, points: 25 },
    'profile_optimization': { dailyTarget: 1, points: 30 },
    'profile_views': { dailyTarget: 5, points: 10 },
    'connections_accepted': { dailyTarget: 1, points: 10 },
  };

  // Calculate activity status based on daily count vs target
  const getActivityStatus = (activityId: string, dailyCount: number) => {
    const activity = DAILY_ACTIVITIES[activityId];
    if (!activity) return 'neutral';
    
    if (dailyCount >= activity.dailyTarget) return 'success';
    if (dailyCount >= activity.dailyTarget * 0.7) return 'warning';
    return 'danger';
  };

  // Award or deduct points when status changes
  const checkAndAwardPoints = useCallback(async () => {
    // Prevent concurrent execution
    if (processingRef.current) {
      console.log('Points check already in progress, skipping...');
      return;
    }
    
    processingRef.current = true;

    try {
      // Check each activity for status changes
      for (const [activityId, currentValue] of Object.entries(todayMetrics)) {
        if (!DAILY_ACTIVITIES[activityId]) continue;

        const currentStatus = getActivityStatus(activityId, currentValue);
        const lastStatus = previousStatus[activityId] || 'neutral';
        
        // Only process if status actually changed
        if (currentStatus !== lastStatus) {
          console.log(`Status changed for ${activityId}: ${lastStatus} -> ${currentStatus}`);
          
          try {
            if (currentStatus === 'success' && lastStatus !== 'success') {
              // Award points when moving to "On Track"
              const success = await awardPoints(activityId, 'linkedin_growth');
              if (success) {
                console.log(`Successfully awarded points for ${activityId} (${lastStatus} -> ${currentStatus})`);
              }
            } else if (lastStatus === 'success' && currentStatus !== 'success') {
              // Deduct points when moving away from "On Track"
              // Note: We'll use negative points to deduct
              const success = await awardPoints(`${activityId}_deduct`, 'linkedin_growth');
              if (success) {
                console.log(`Successfully deducted points for ${activityId} (${lastStatus} -> ${currentStatus})`);
              }
            }
          } catch (error) {
            console.error(`Failed to process points for ${activityId}:`, error);
          }
        }
      }
      
      // Update previous status for next check
      const newStatus: ActivityStatus = {};
      for (const [activityId, value] of Object.entries(todayMetrics)) {
        if (DAILY_ACTIVITIES[activityId]) {
          newStatus[activityId] = getActivityStatus(activityId, value);
        }
      }
      setPreviousStatus(newStatus);
    } finally {
      processingRef.current = false;
    }
  }, [todayMetrics, previousStatus, awardPoints]);

  // Run point check whenever metrics change, but with debouncing
  useEffect(() => {
    if (Object.keys(todayMetrics).length > 0) {
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