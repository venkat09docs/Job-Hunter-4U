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
  const createCourse = useCallback(async (data: CreateCourseData) => {
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

  const getCourses = useCallback(async () => {
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
        .insert(data as any)
        .select('*')
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });

      return assignment as any;

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });
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

  const getAssignmentsBySection = useCallback(async (sectionId: string) => {
    setLoading(true);
    try {
      // Bypass type inference by using any
      const client: any = supabase;
      const result = await client
        .from('clp_assignments')
        .select('*')
        .eq('section_id', sectionId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      return result.data || [];
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

  const getAssignments = useCallback(async (): Promise<Assignment[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_assignments')
        .select(`
          *,
          section:course_sections(
            *,
            course:clp_courses(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Assignment[]) || [];
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
          section:course_sections(
            *,
            course:clp_courses(*)
          )
        `)
        .eq('is_published', true) as any;

      if (assignmentsError) throw assignmentsError;

      // Then get user attempts for these assignments
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: attempts, error: attemptsError } = await supabase
        .from('clp_attempts')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('user_id', user.id);

      if (attemptsError) throw attemptsError;

      // Combine data - use aggressive type assertions to bypass type mismatches
      const assignmentsWithProgress: AssignmentWithProgress[] = (assignments as any)?.map((assignment: any) => {
        const userAttempts = attempts?.filter(a => a.assignment_id === assignment.id) || [];
        const canAttempt = userAttempts?.length < assignment.max_attempts;
        const attemptsRemaining = Math.max(0, assignment.max_attempts - userAttempts.length);

        // Determine status
        const now = new Date();
        let status: any = 'draft';
        
        if (assignment.is_published) {
          const visible_from = assignment.visible_from ? new Date(assignment.visible_from) : null;
          const start_at = assignment.start_at ? new Date(assignment.start_at) : null;
          const end_at = assignment.end_at ? new Date(assignment.end_at) : null;

          if (end_at && now > end_at) {
            status = 'closed';
          } else if (start_at && now < start_at) {
            status = 'scheduled';
          } else if (visible_from && now < visible_from) {
            status = 'scheduled';
          } else {
            status = 'open';
          }
        }

        return {
          ...assignment,
          userAttempts,
          canAttempt,
          attemptsRemaining,
          status
        } as AssignmentWithProgress;
      }) || [];

      return assignmentsWithProgress;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch assignments with progress',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Get user's assigned assignments organized by category -> course -> section
  const getUserAssignmentsOrganized = useCallback(async () => {
    if (!user) return {};
    
    setLoading(true);
    try {
      console.log('🔍 Fetching user assigned assignments organized by category -> course -> section');

      // Get user's assigned assignments with full hierarchy
      const { data: userAttempts, error: attemptsError } = await supabase
        .from('clp_attempts')
        .select(`
          *,
          assignment:clp_assignments!inner(
            *,
            section:course_sections!inner(
              *,
              course:clp_courses!inner(*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      console.log('📦 Raw user attempts data:', userAttempts);

      // Organize by category -> course -> section
      const organized: any = {};

      userAttempts?.forEach((attempt: any) => {
        const assignment = attempt.assignment;
        const section = assignment.section;
        const course = section.course;
        const category = course.category || 'General';

        // Initialize structure if not exists
        if (!organized[category]) {
          organized[category] = {};
        }
        if (!organized[category][course.id]) {
          organized[category][course.id] = {
            courseInfo: course,
            sections: {}
          };
        }
        if (!organized[category][course.id].sections[section.id]) {
          organized[category][course.id].sections[section.id] = {
            sectionInfo: section,
            assignments: []
          };
        }

        // Determine assignment status
        const now = new Date();
        let status = 'draft';
        
        if (assignment.is_published) {
          const visible_from = assignment.visible_from ? new Date(assignment.visible_from) : null;
          const start_at = assignment.start_at ? new Date(assignment.start_at) : null;
          const end_at = assignment.end_at ? new Date(assignment.end_at) : null;

          if (end_at && now > end_at) {
            status = 'closed';
          } else if (start_at && now < start_at) {
            status = 'scheduled';
          } else if (visible_from && now < visible_from) {
            status = 'scheduled';
          } else {
            status = 'open';
          }
        }

        // Add assignment with attempt info
        organized[category][course.id].sections[section.id].assignments.push({
          ...assignment,
          userAttempt: attempt,
          status,
          canAttempt: assignment.max_attempts > 1 || attempt.status === 'available'
        });
      });

      console.log('🗂️ Organized assignments:', organized);
      return organized;
    } catch (error: any) {
      console.error('❌ Error fetching organized assignments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch assigned assignments',
        variant: 'destructive'
      });
      return {};
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const deleteAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment deleted successfully'
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete assignment',
        variant: 'destructive'
      });
      return false;
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
          started_at: new Date().toISOString(),
          status: 'started'
        })
        .select(`
          *,
          assignment:clp_assignments(
            *,
            section:course_sections(
              *,
              course:clp_courses(*)
            )
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment attempt started'
      });

      return attempt as unknown as Attempt;
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
        title: 'Success',
        description: 'Assignment submitted successfully'
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
            section:course_sections(
              *,
              course:clp_courses(*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Attempt[]) || [];
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
  const submitAnswer = useCallback(async (data: SubmitAnswerData): Promise<Answer | null> => {
    setLoading(true);
    try {
      const { data: answer, error } = await supabase
        .from('clp_answers')
        .upsert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return answer;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit answer',
        variant: 'destructive'
      });
      return null;
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
        title: 'Success',
        description: 'Review published successfully'
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
        .select('*');

      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query
        .order('points_total', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch user profiles separately to avoid relation issues
      const userIds = data?.map(entry => entry.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_image_url')
        .in('id', userIds);

      // Combine the data
      const leaderboardWithUsers = data?.map(entry => ({
        ...entry,
        user: profiles?.find(profile => profile.id === entry.user_id) || {
          id: entry.user_id,
          full_name: null,
          username: null,
          profile_image_url: null
        }
      })) || [];

      return leaderboardWithUsers;
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

  const updateAssignment = useCallback(async (assignmentId: string, data: Partial<CreateAssignmentData>): Promise<Assignment | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const { data: assignment, error } = await supabase
        .from('clp_assignments')
        .update(data)
        .eq('id', assignmentId)
        .select(`
          *,
          section:course_sections(
            *,
            course:clp_courses(*)
          )
        `)
        .single();

      if (error) throw error;

      return assignment as unknown as Assignment;
    } catch (error: any) {
      console.error('Update assignment error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const publishAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_assignments')
        .update({ is_published: true })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment published successfully'
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish assignment',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateQuestion = useCallback(async (questionId: string, data: Partial<CreateQuestionData>): Promise<Question | null> => {
    setLoading(true);
    try {
      const { data: question, error } = await supabase
        .from('clp_questions')
        .update(data)
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;
      return question;
    } catch (error: any) {
      console.error('Update question error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteQuestion = useCallback(async (questionId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Delete question error:', error);
      throw error;
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
    updateAssignment,
    publishAssignment,
    getAssignmentsBySection,
    getAssignments,
    getAssignmentsWithProgress,
    getUserAssignmentsOrganized,
    deleteAssignment,
    // Question methods
    createQuestion,
    updateQuestion,
    deleteQuestion,
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