import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Course } from '@/types/clp';

export const useRecentEnrolledCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentEnrolledCourses = useCallback(async () => {
    if (!user) {
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get recent courses where user has attempts (indicating enrollment)
      const { data, error } = await supabase
        .from('clp_attempts')
        .select(`
          created_at,
          assignment:clp_assignments!inner(
            section:course_sections!inner(
              course:clp_courses!inner(
                id,
                title,
                description,
                image,
                category,
                is_free,
                subscription_plan_id,
                created_at,
                updated_at,
                is_active,
                code,
                created_by,
                order_index,
                industry_type
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique courses and get the latest 3
      const uniqueCourses = new Map<string, Course>();
      data?.forEach((attempt: any) => {
        const course = attempt.assignment.section.course;
        if (course && course.is_active && !uniqueCourses.has(course.id)) {
          uniqueCourses.set(course.id, course);
        }
      });

      const recentCourses = Array.from(uniqueCourses.values()).slice(0, 3);
      setCourses(recentCourses);
    } catch (error) {
      console.error('Error fetching recent enrolled courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentEnrolledCourses();
  }, [fetchRecentEnrolledCourses]);

  return {
    courses,
    loading,
    refetch: fetchRecentEnrolledCourses
  };
};