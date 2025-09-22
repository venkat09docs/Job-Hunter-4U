import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CourseStatistics {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

export const useCourseStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<CourseStatistics>({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchCourseStatistics = useCallback(async () => {
    if (!user) {
      setStatistics({ total: 0, inProgress: 0, completed: 0, pending: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get courses where user has attempts (indicating enrollment)
      const { data: attemptData, error: attemptError } = await supabase
        .from('clp_attempts')
        .select(`
          assignment_id,
          status,
          review_status,
          assignment:clp_assignments!inner(
            section:course_sections!inner(
              course:clp_courses!inner(
                id,
                title,
                is_active
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (attemptError) throw attemptError;

      // Extract unique courses and their progress
      const courseProgress = new Map<string, {
        courseId: string,
        hasInProgress: boolean,
        hasCompleted: boolean
      }>();

      (attemptData || []).forEach((attempt: any) => {
        const course = attempt.assignment?.section?.course;
        if (!course || !course.is_active) return;

        const courseId = course.id;
        if (!courseProgress.has(courseId)) {
          courseProgress.set(courseId, {
            courseId,
            hasInProgress: false,
            hasCompleted: false
          });
        }

        const progress = courseProgress.get(courseId)!;

        // Check if this attempt indicates in-progress work
        if (attempt.status === 'started') {
          progress.hasInProgress = true;
        }

        // Check if this attempt indicates completed work
        if (attempt.status === 'submitted' && attempt.review_status === 'published') {
          progress.hasCompleted = true;
        }
      });

      // Calculate statistics
      const courses = Array.from(courseProgress.values());
      const total = courses.length;
      const inProgress = courses.filter(c => c.hasInProgress && !c.hasCompleted).length;
      const completed = courses.filter(c => c.hasCompleted).length;
      const pending = courses.filter(c => !c.hasInProgress && !c.hasCompleted).length;

      setStatistics({
        total,
        inProgress,
        completed,
        pending
      });
    } catch (error) {
      console.error('Error fetching course statistics:', error);
      setStatistics({ total: 0, inProgress: 0, completed: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourseStatistics();
  }, [fetchCourseStatistics]);

  return {
    statistics,
    loading,
    refetch: fetchCourseStatistics
  };
};