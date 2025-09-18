import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ChapterCompletion {
  id: string;
  user_id: string;
  chapter_id: string;
  completed_at: string;
}

export interface CourseProgress {
  total_chapters: number;
  completed_chapters: number;
  progress_percentage: number;
}

export const useChapterCompletion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const markChapterComplete = async (chapterId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Authentication required');
      return false;
    }

    console.log('🔄 Starting chapter completion process for chapter:', chapterId, 'user:', user.id);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_chapter_completions')
        .upsert(
          { 
            user_id: user.id, 
            chapter_id: chapterId 
          },
          { 
            onConflict: 'user_id,chapter_id',
            ignoreDuplicates: true 
          }
        );

      if (error) throw error;
      console.log('✅ Chapter completion recorded successfully');

      // Trigger automatic assignment check for section completion (optional)
      console.log('🚀 Triggering auto-assign-section-assignments function...');
      try {
        const { data, error: assignmentError } = await supabase.functions.invoke(
          'auto-assign-section-assignments',
          {
            body: {
              user_id: user.id,
              chapter_id: chapterId
            }
          }
        );

        console.log('📦 Edge function response:', { data, error: assignmentError });

        if (assignmentError) {
          console.warn('⚠️ Assignment check failed (this is normal if no assignments are configured):', assignmentError);
          // Don't show error to user - just complete the chapter successfully
          toast.success('Chapter marked as complete!');
        } else if (data?.assignments_assigned > 0) {
          console.log('🎯 Assignments assigned:', data.assignments_assigned);
          toast.success(`Chapter completed! ${data.assignments_assigned} new assignment(s) have been assigned to you.`);
        } else {
          console.log('ℹ️ No new assignments to assign');
          toast.success('Chapter marked as complete!');
        }
      } catch (assignmentError) {
        console.warn('💡 Assignment function unavailable (this is normal if no assignment logic is configured):', assignmentError);
        // Handle gracefully - chapter completion is still successful
        toast.success('Chapter marked as complete!');
      }

      return true;
    } catch (error) {
      console.error('❌ Error marking chapter complete:', error);
      toast.error('Failed to mark chapter as complete');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isChapterComplete = async (chapterId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_chapter_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking chapter completion:', error);
      return false;
    }
  };

  const getCourseProgress = async (courseId: string): Promise<CourseProgress | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_course_progress', {
          p_user_id: user.id,
          p_course_id: courseId
        });

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          total_chapters: data[0].total_chapters || 0,
          completed_chapters: data[0].completed_chapters || 0,
          progress_percentage: Number(data[0].progress_percentage) || 0
        };
      }

      return {
        total_chapters: 0,
        completed_chapters: 0,
        progress_percentage: 0
      };
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return null;
    }
  };

  const awardLearningGoalPoints = async (learningGoalId: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .rpc('award_learning_goal_completion_points', {
          p_learning_goal_id: learningGoalId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error awarding learning goal points:', error);
      throw error;
    }
  };

  return {
    loading,
    markChapterComplete,
    isChapterComplete,
    getCourseProgress,
    awardLearningGoalPoints
  };
};