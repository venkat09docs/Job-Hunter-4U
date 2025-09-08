import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type {
  Course,
  Module,
  Assignment,
  Question,
  Attempt,
  Answer,
  Review,
  LeaderboardEntry,
  CreateCourseData,
  CreateModuleData,
  CreateAssignmentData,
  CreateQuestionData,
  SubmitAnswerData,
  CreateReviewData,
  AssignmentWithProgress,
  QuestionWithAnswer
} from '@/types/clp';

export const useCareerLevelProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Course Management
  const createCourse = useCallback(async (data: CreateCourseData): Promise<Course | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data: course, error } = await supabase
        .from('clp_courses')
        .insert({
          ...data,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course created successfully'
      });

      return course;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getCourses = useCallback(async (): Promise<Course[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch courses',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Module Management
  const createModule = useCallback(async (data: CreateModuleData): Promise<Module | null> => {
    setLoading(true);
    try {
      const { data: module, error } = await supabase
        .from('clp_modules')
        .insert(data)
        .select(`
          *,
          course:clp_courses(*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Module created successfully'
      });

      return module;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create module',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getModulesByCourse = useCallback(async (courseId: string): Promise<Module[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_modules')
        .select(`
          *,
          course:clp_courses(*)
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch modules',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Assignment Management
  const createAssignment = useCallback(async (data: CreateAssignmentData): Promise<Assignment | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data: assignment, error } = await supabase
        .from('clp_assignments')
        .insert({
          ...data,
          created_by: user.id
        })
        .select(`
          *,
          module:clp_modules(
            *,
            course:clp_courses(*)
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });

      return assignment;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assignment',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getAssignmentsByModule = useCallback(async (moduleId: string): Promise<Assignment[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_assignments')
        .select(`
          *,
          module:clp_modules(
            *,
            course:clp_courses(*)
          )
        `)
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch assignments',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAssignmentsWithProgress = useCallback(async (): Promise<AssignmentWithProgress[]> => {
    if (!user) return [];
    
    setLoading(true);
    try {
      // First get assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('clp_assignments')
        .select(`
          *,
          module:clp_modules(
            *,
            course:clp_courses(*)
          )
        `)
        .eq('is_published', true);

      if (assignmentsError) throw assignmentsError;

      // Then get user attempts for these assignments
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: attempts, error: attemptsError } = await supabase
        .from('clp_attempts')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('user_id', user.id);

      if (attemptsError) throw attemptsError;

      // Combine data
      const assignmentsWithProgress: AssignmentWithProgress[] = assignments?.map(assignment => {
        const userAttempts = attempts?.filter(a => a.assignment_id === assignment.id) || [];
        const canAttempt = userAttempts?.length < assignment.max_attempts;
        const attemptsRemaining = Math.max(0, assignment.max_attempts - userAttempts?.length);
        
        // Determine status
        let status: 'draft' | 'scheduled' | 'open' | 'closed' | 'grading' | 'published' = 'draft';
        const now = new Date();
        const startAt = assignment.start_at ? new Date(assignment.start_at) : null;
        const endAt = assignment.end_at ? new Date(assignment.end_at) : null;
        
        if (!assignment.is_published) {
          status = 'draft';
        } else if (startAt && startAt > now) {
          status = 'scheduled';
        } else if (endAt && endAt < now) {
          status = 'closed';
        } else {
          status = 'open';
        }

        return {
          ...assignment,
          userAttempts,
          canAttempt,
          attemptsRemaining,
          status
        };
      }) || [];

      return assignmentsWithProgress;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch assignments',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Question Management
  const createQuestion = useCallback(async (data: CreateQuestionData): Promise<Question | null> => {
    setLoading(true);
    try {
      const { data: question, error } = await supabase
        .from('clp_questions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Question created successfully'
      });

      return question;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create question',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getQuestionsByAssignment = useCallback(async (assignmentId: string): Promise<Question[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_questions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch questions',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Attempt Management
  const startAttempt = useCallback(async (assignmentId: string): Promise<Attempt | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data: attempt, error } = await supabase
        .from('clp_attempts')
        .insert({
          assignment_id: assignmentId,
          user_id: user.id,
          status: 'started',
          ip_address: '0.0.0.0', // Could be enhanced with actual IP detection
          device_info: navigator.userAgent
        })
        .select(`
          *,
          assignment:clp_assignments(*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Assignment Started',
        description: 'Your attempt has begun. Good luck!'
      });

      return attempt;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start attempt',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const submitAttempt = useCallback(async (attemptId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', attemptId);

      if (error) throw error;

      toast({
        title: 'Assignment Submitted',
        description: 'Your answers have been submitted successfully!'
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit attempt',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAttemptsByUser = useCallback(async (): Promise<Attempt[]> => {
    if (!user) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_attempts')
        .select(`
          *,
          assignment:clp_assignments(
            *,
            module:clp_modules(
              *,
              course:clp_courses(*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch attempts',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Answer Management
  const submitAnswer = useCallback(async (data: SubmitAnswerData): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_answers')
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save answer',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAnswersByAttempt = useCallback(async (attemptId: string): Promise<Answer[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_answers')
        .select(`
          *,
          question:clp_questions(*)
        `)
        .eq('attempt_id', attemptId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch answers',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Review Management
  const createReview = useCallback(async (data: CreateReviewData): Promise<Review | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data: review, error } = await supabase
        .from('clp_reviews')
        .insert({
          ...data,
          reviewer_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Review created successfully'
      });

      return review;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create review',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const publishReview = useCallback(async (reviewId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_reviews')
        .update({
          published_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Review Published',
        description: 'The review has been published to the student'
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish review',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Leaderboard
  const getLeaderboard = useCallback(async (courseId?: string, moduleId?: string): Promise<LeaderboardEntry[]> => {
    setLoading(true);
    try {
      let query = supabase
        .from('clp_leaderboard')
        .select('*')
        .order('points_total', { ascending: false })
        .limit(50);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch leaderboard',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    // Course methods
    createCourse,
    getCourses,
    // Module methods
    createModule,
    getModulesByCourse,
    // Assignment methods
    createAssignment,
    getAssignmentsByModule,
    getAssignmentsWithProgress,
    // Question methods
    createQuestion,
    getQuestionsByAssignment,
    // Attempt methods
    startAttempt,
    submitAttempt,
    getAttemptsByUser,
    // Answer methods
    submitAnswer,
    getAnswersByAttempt,
    // Review methods
    createReview,
    publishReview,
    // Leaderboard
    getLeaderboard
  };
};

export default useCareerLevelProgram;