import { useEffect, useCallback, useRef, useState } from 'react';
import { useProfileBuildingPoints } from './useProfileBuildingPoints';

interface ActivityMetrics {
  [key: string]: number;
}

export const useLinkedInGrowthPoints = (
  todayMetrics: ActivityMetrics, 
  previousMetrics: ActivityMetrics = {}
) => {
  const { awardPoints } = useProfileBuildingPoints();
  const processingRef = useRef(false);
  const lastProcessedRef = useRef<string>('');
  const [processedActivities, setProcessedActivities] = useState<Set<string>>(new Set());

  // Award points when activities are completed or targets are met
  const checkAndAwardPoints = useCallback(async () => {
    // Prevent concurrent execution
    if (processingRef.current) {
      console.log('Points check already in progress, skipping...');
      return;
    }
    
    processingRef.current = true;
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

    try {
      // Create a unique key for this metrics state to avoid duplicate processing
      const metricsKey = JSON.stringify(todayMetrics);
      if (lastProcessedRef.current === metricsKey) {
        console.log('Same metrics already processed, skipping...');
        return;
      }

      // Check each activity for point eligibility
      for (const [activityId, currentValue] of Object.entries(todayMetrics)) {
        const threshold = POINT_THRESHOLDS[activityId];
        const previousValue = previousMetrics[activityId] || 0;
        
        // Create a unique key for today's activity to prevent duplicate processing
        const today = new Date().toISOString().split('T')[0];
        const activityKey = `${activityId}-${today}`;
        
        if (threshold && 
            currentValue >= threshold && 
            previousValue < threshold &&
            !processedActivities.has(activityKey)) {
          
          console.log(`Attempting to award points for ${activityId}: ${currentValue} >= ${threshold}`);
          
          try {
            const success = await awardPoints(activityId, 'linkedin_growth');
            if (success) {
              // Mark this activity as processed for today
              setProcessedActivities(prev => new Set([...prev, activityKey]));
              console.log(`Successfully awarded points for ${activityId}`);
            }
          } catch (error) {
            console.error(`Failed to award points for ${activityId}:`, error);
          }
        }
      }
      
      // Update the last processed key
      lastProcessedRef.current = metricsKey;
    } finally {
      processingRef.current = false;
    }
  }, [todayMetrics, previousMetrics, awardPoints, processedActivities]);

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