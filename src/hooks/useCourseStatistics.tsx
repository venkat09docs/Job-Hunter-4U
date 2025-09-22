import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useLearningGoals } from './useLearningGoals';

interface CourseStatistics {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

export const useCourseStatistics = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, subscriptionPlan } = useProfile();
  const { goals } = useLearningGoals();
  const [statistics, setStatistics] = useState<CourseStatistics>({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  // Stable subscription status values for dependencies
  const subscriptionActive = hasActiveSubscription();

  // Subscription plan hierarchy mapping (same as SkillDeveloperProgramsTab)
  const subscriptionHierarchy = {
    'free': 0,
    'one_month': 1,
    'three_months': 2, 
    'six_months': 3,
    'one_year': 4
  };

  // Get user's subscription tier level
  const getUserSubscriptionTier = useCallback(() => {
    if (!subscriptionActive) return 0; // No active subscription = free tier
    
    // Map subscription plan names to tiers
    const planNameMapping: Record<string, number> = {
      'One Week Plan': 1,
      'One Month Plan': 1,
      '1 Month Plan': 1,
      'Monthly Plan': 1,
      'Three Months Plan': 2,
      '3 Months Plan': 2,  
      'Six Months Plan': 3,
      '6 Months Plan': 3,
      'One Year Plan': 4,
      '1 Year Plan': 4,
      'Annual Plan': 4
    };
    
    return planNameMapping[subscriptionPlan || ''] || 1; // Default to one month if unknown
  }, [subscriptionActive, subscriptionPlan]);

  // Helper function to determine course subscription plan
  const getCourseSubscriptionPlan = (course: any) => {
    if (course.is_free) return 'free';
    
    // If no subscription_plan_id is set, assume it's a one-month plan
    if (!course.subscription_plan_id) return 'one_month';
    
    // Map actual subscription plan UUIDs from database to our filter values
    const planMapping: Record<string, string> = {
      // Exact UUID mappings from database
      '4f72fb43-6e55-407e-969e-c83acfa5b05f': 'one_month',    // One Month Plan (30 days)
      'f077e30e-bdb9-4b09-9fa2-9c33a355189d': 'three_months', // 3 Months Plan (90 days)
      '726be3fc-fdd5-4a59-883a-6b60cd2f68c5': 'six_months',   // 6 Months Plan (180 days)
      'c0aff632-80b0-4832-827a-ece42aa37ead': 'one_year',     // 1 Year Plan (365 days)
    };
    
    // Map the subscription_plan_id to filter value
    const mappedPlan = planMapping[course.subscription_plan_id];
    
    if (mappedPlan) {
      return mappedPlan;
    }
    
    // Default fallback to one_month for unmapped plans
    return 'one_month';
  };

  // Check if user can access a specific course
  const canAccessCourse = useCallback((course: any) => {
    // Free courses are always accessible
    if (course.is_free) return true;
    
    const userTier = getUserSubscriptionTier();
    const coursePlan = getCourseSubscriptionPlan(course);
    const courseTier = subscriptionHierarchy[coursePlan as keyof typeof subscriptionHierarchy] || 1;
    
    // User can access course if their tier is equal or higher than course requirement
    return userTier >= courseTier;
  }, [getUserSubscriptionTier]);

  // Check if user is enrolled in a course
  const isUserEnrolled = useCallback((courseId: string) => {
    return goals.some(goal => goal.course_id === courseId);
  }, [goals]);

  const fetchCourseStatistics = useCallback(async () => {
    if (!user) {
      setStatistics({ total: 0, inProgress: 0, completed: 0, pending: 0 });
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching course statistics...');
    setLoading(true);
    try {
      // Get all active courses with subscription plan info
      const { data: allCourses, error: coursesError } = await supabase
        .from('clp_courses')
        .select('id, title, is_active, is_free, subscription_plan_id')
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      // Filter courses that user can access based on subscription
      const accessibleCourses = (allCourses || []).filter(canAccessCourse);

      const totalCourses = accessibleCourses.length;

      if (totalCourses === 0) {
        setStatistics({ total: 0, inProgress: 0, completed: 0, pending: 0 });
        setLoading(false);
        return;
      }

      // Get learning goals that are linked to courses (from Completed Learning tab logic)
      const learningGoalsCourses = goals.filter(goal => goal.course_id);
      
      // Count learning goals by status
      const completedGoals = learningGoalsCourses.filter(goal => goal.status === 'completed').length;
      const inProgressGoals = learningGoalsCourses.filter(goal => goal.status === 'in_progress').length;
      
      // Pending = total accessible courses - (completed + in progress)
      const pending = totalCourses - (completedGoals + inProgressGoals);

      console.log('📊 Course statistics calculated:', {
        total: totalCourses,
        completed: completedGoals,
        inProgress: inProgressGoals,
        pending: Math.max(0, pending), // Ensure non-negative
        learningGoalsCount: learningGoalsCourses.length
      });

      setStatistics({
        total: totalCourses,
        inProgress: inProgressGoals,
        completed: completedGoals,
        pending: Math.max(0, pending)
      });
    } catch (error) {
      console.error('❌ Error fetching course statistics:', error);
      setStatistics({ total: 0, inProgress: 0, completed: 0, pending: 0 });
    } finally {
      console.log('✅ Course statistics fetch completed');
      setLoading(false);
    }
  }, [user, canAccessCourse, isUserEnrolled]);

  useEffect(() => {
    fetchCourseStatistics();
  }, [fetchCourseStatistics]);

  return {
    statistics,
    loading,
    refetch: fetchCourseStatistics
  };
};