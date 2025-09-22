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
      // First, get all active courses (total available)
      const { data: allCourses, error: coursesError } = await supabase
        .from('clp_courses')
        .select('id, title, is_active')
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      const totalCourses = allCourses?.length || 0;

      if (totalCourses === 0) {
        setStatistics({ total: 0, inProgress: 0, completed: 0, pending: 0 });
        setLoading(false);
        return;
      }

      // Get user's attempts on assignments for these courses
      const { data: attemptData, error: attemptError } = await supabase
        .from('clp_attempts')
        .select(`
          assignment_id,
          status,
          review_status,
          assignment:clp_assignments!inner(
            section_id,
            section:course_sections!inner(
              course_id,
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

      // Create a map to track course progress
      const courseProgress = new Map<string, {
        courseId: string,
        hasAttempts: boolean,
        hasStarted: boolean,
        hasCompleted: boolean
      }>();

      // Initialize all courses as available but not started
      allCourses.forEach(course => {
        courseProgress.set(course.id, {
          courseId: course.id,
          hasAttempts: false,
          hasStarted: false,
          hasCompleted: false
        });
      });

      // Update progress based on attempts
      (attemptData || []).forEach((attempt: any) => {
        const course = attempt.assignment?.section?.course;
        if (!course || !course.is_active) return;

        const courseId = course.id;
        const progress = courseProgress.get(courseId);
        if (!progress) return;

        progress.hasAttempts = true;

        // Check if user has started working (any attempt status other than just created)
        if (attempt.status === 'started' || attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
          progress.hasStarted = true;
        }

        // Check if user has completed the course (published review indicates completion)
        if (attempt.review_status === 'published') {
          progress.hasCompleted = true;
        }
      });

      // Calculate statistics
      const courses = Array.from(courseProgress.values());
      const total = courses.length;
      const inProgress = courses.filter(c => c.hasStarted && !c.hasCompleted).length;
      const completed = courses.filter(c => c.hasCompleted).length;
      const pending = courses.filter(c => !c.hasStarted).length;

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