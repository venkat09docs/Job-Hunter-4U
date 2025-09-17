import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { AssignmentWithProgress } from '@/types/clp';

export const useCareerLevelProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Course Management - Simple version
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

  // Assignment Management - Simple version
  const getAssignments = useCallback(async () => {
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

  // Attempt Management - Simple version
  const startAttempt = useCallback(async (assignmentId: string) => {
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
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment attempt started'
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

  const submitAssignment = useCallback(async (assignmentId: string) => {
    setLoading(true);
    console.log('🔄 Starting direct assignment submission for ID:', assignmentId);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Call the direct submission function
      const { data: result, error: submitError } = await supabase
        .rpc('submit_assignment_direct', {
          p_assignment_id: assignmentId,
          p_user_id: user.id
        });

      if (submitError) {
        console.error('❌ Error submitting assignment:', submitError);
        throw submitError;
      }

      if (!result) {
        throw new Error('Assignment submission failed');
      }

      console.log('✅ Assignment submitted successfully');

      toast({
        title: 'Success',
        description: 'Assignment submitted successfully to your institute admin'
      });

      // Refresh assignments data to update UI
      return { success: true, refreshNeeded: true };
    } catch (error: any) {
      console.error('❌ Submit assignment error:', error);
      toast({
        title: 'Error', 
        description: error.message || 'Failed to submit assignment',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getAttemptsByUser = useCallback(async () => {
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

  // Question Management - Simple version
  const getQuestionsByAssignment = useCallback(async (assignmentId: string) => {
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

  // Answer Management - Simple version
  const submitAnswer = useCallback(async (data: any) => {
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

  const getAnswersByAttempt = useCallback(async (attemptId: string) => {
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

  // Leaderboard - Simplified version that works reliably
  const getLeaderboard = useCallback(async (courseId?: string, moduleId?: string) => {
    setLoading(true);
    try {
      // Get all published attempts with scores
      const { data: attemptData, error: attemptError } = await supabase
        .from('clp_attempts')
        .select(`
          user_id,
          score_points,
          assignment_id
        `)
        .eq('review_status', 'published')
        .not('score_points', 'is', null);

      if (attemptError) throw attemptError;

      if (!attemptData?.length) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(attemptData.map(a => a.user_id))];

      // Get user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Create a map of users for quick lookup
      const userMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Group by user and calculate totals
      const userStats = new Map();
      
      attemptData.forEach(attempt => {
        const userId = attempt.user_id;
        const points = attempt.score_points || 0;
        const userProfile = userMap.get(userId);
        
        if (!userProfile) {
          // If no profile found, create a fallback entry
          console.warn(`⚠️ No profile found for user ${userId}`);
          return;
        }
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            id: `leaderboard_${userId}`,
            user_id: userId,
            user: {
              user_id: userProfile.user_id,
              full_name: userProfile.full_name || 'Unknown User',
              username: userProfile.username || `user${userId.slice(0,8)}`,
              profile_image_url: userProfile.profile_image_url,
              email: userProfile.email
            },
            points_total: 0,
            assignments_completed: 0
          });
        }
        
        const stats = userStats.get(userId);
        stats.points_total += points;
        stats.assignments_completed += 1;
      });

      // Convert to array and sort by points
      const leaderboardData = Array.from(userStats.values())
        .filter(entry => entry.assignments_completed > 0) // Only show users with completed assignments
        .sort((a, b) => b.points_total - a.points_total)
        .slice(0, 100);

      console.log('🎯 Final leaderboard data structure:', leaderboardData);
      console.log('🎯 Sample entry structure:', leaderboardData[0]); 
      return leaderboardData;
    } catch (error: any) {
      console.error('Leaderboard error:', error);
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

  // Get assignments with progress information for the current user
  const getAssignmentsWithProgress = useCallback(async () => {
    if (!user) return [];
    
    setLoading(true);
    try {
      // First get user's institute and batch information
      const { data: userAssignment } = await supabase
        .from('user_assignments')
        .select('institute_id, batch_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // Get assignments visible to this user
      const { data: assignments, error: assignmentsError } = await supabase
        .from('clp_assignments')
        .select(`
          *,
          section:course_sections(
            *,
            course:clp_courses(*)
          ),
          visibility:clp_assignments_visibility(*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      // Filter assignments based on visibility rules
      const visibleAssignments = (assignments || []).filter(assignment => {
        // If no visibility rules exist, assignment is visible to everyone
        if (!assignment.visibility || assignment.visibility.length === 0) {
          return true;
        }

        // Check each visibility rule
        return assignment.visibility.some(visibility => {
          if (visibility.audience === 'all') {
            return true;
          }
          
          if (visibility.audience === 'cohort' && userAssignment?.batch_id) {
            return visibility.cohort_id === userAssignment.batch_id;
          }
          
          if (visibility.audience === 'users') {
            const userIds = Array.isArray(visibility.user_ids) ? visibility.user_ids : [];
            return userIds.includes(user.id);
          }
          
          return false;
        });
      });

      // Get user's attempts for these assignments
      const assignmentIds = visibleAssignments.map(a => a.id);
      const { data: attempts, error: attemptsError } = await supabase
        .from('clp_attempts')
        .select('*')
        .eq('user_id', user.id)
        .in('assignment_id', assignmentIds);

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
        throw attemptsError;
      }

      // Combine assignments with user attempts
      const assignmentsWithProgress = visibleAssignments.map(assignment => {
        const userAttempts = (attempts || []).filter(attempt => 
          attempt.assignment_id === assignment.id
        );

        // Capture visibility rules count before creating final object
        const visibilityRulesCount = assignment.visibility?.length || 0;

        // Determine assignment status based on attempts
        const hasStartedAttempt = userAttempts.some(attempt => attempt.status === 'started');
        const submittedAttempts = userAttempts.filter(attempt => 
          attempt.status === 'submitted' || attempt.status === 'auto_submitted'
        );
        const hasSubmittedAttempts = submittedAttempts.length > 0;
        
        // Check if any submitted attempts have been reviewed (published)
        const hasReviewedAttempts = submittedAttempts.some(attempt => 
          attempt.review_status === 'published'
        );
        
        // Check if assignment is currently open by time constraints
        const now = new Date();
        const startAt = assignment.start_at ? new Date(assignment.start_at) : null;
        const endAt = assignment.end_at ? new Date(assignment.end_at) : null;
        const dueAt = assignment.due_at ? new Date(assignment.due_at) : null;
        
        let status = 'open';
        
        // Determine status based on review status and submission status
        if (hasReviewedAttempts) {
          status = 'completed'; // Only mark as completed after admin review
        } else if (hasSubmittedAttempts) {
          status = 'submitted'; // Show as submitted until admin reviews
        } else if (startAt && now < startAt) {
          status = 'scheduled';
        } else if (endAt && now > endAt) {
          status = 'closed';
        } else if (dueAt && now > dueAt) {
          status = 'closed';
        }
        
        // User can only attempt if:
        // 1. Assignment is open (not completed, closed, or scheduled)
        // 2. No submitted attempts exist (one submission per assignment)
        // 3. No attempt is currently in progress
        const canAttempt = status === 'open' && !hasSubmittedAttempts && !hasStartedAttempt;

        // Remove visibility from assignment object for the return type
        const { visibility, ...assignmentWithoutVisibility } = assignment;

        return {
          ...assignmentWithoutVisibility,
          userAttempts,
          canAttempt,
          attemptsRemaining: hasSubmittedAttempts ? 0 : (hasStartedAttempt ? 0 : 1), // 0 if submitted/started, 1 if can attempt
          status,
          visibilityRulesCount // Store for logging but don't include in final type
        } as AssignmentWithProgress & { visibilityRulesCount: number };
      });

      console.log('📚 Fetched user-assigned assignments:', {
        total: assignmentsWithProgress.length,
        userInstitute: userAssignment?.institute_id,
        userBatch: userAssignment?.batch_id,
        assignments: assignmentsWithProgress.map(a => ({
          id: a.id,
          title: a.title,
          userAttempts: a.userAttempts.length,
          canAttempt: a.canAttempt,
          status: a.status,
          attemptsRemaining: a.attemptsRemaining,
          visibilityRules: a.visibilityRulesCount
        }))
      });
      
      // Remove the extra property for return
      return assignmentsWithProgress.map(({ visibilityRulesCount, ...assignment }) => assignment);
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

  // Assignment Management Functions
  const createAssignment = useCallback(async (data: any) => {
    console.log('🎯 Creating assignment - User ID:', user?.id);
    console.log('🎯 Assignment data:', data);
    
    setLoading(true);
    try {
      // Check user role first
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      
      console.log('🎯 User role check:', userRole, roleError);
      
      const { data: assignment, error } = await supabase
        .from('clp_assignments')
        .insert({
          ...data,
          created_by: user?.id
        })
        .select()
        .single();

      console.log('🎯 Assignment creation result:', assignment, error);
      
      if (error) {
        console.error('🔥 Assignment creation error:', error);
        throw error;
      }

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

  const updateAssignment = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const { data: assignment, error } = await supabase
        .from('clp_assignments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment updated successfully'
      });

      return assignment;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assignment',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteAssignment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_assignments')
        .delete()
        .eq('id', id);

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
  }, [toast]);

  const publishAssignment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: assignment, error } = await supabase
        .from('clp_assignments')
        .update({ is_published: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment published successfully'
      });

      return assignment;
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
  }, [toast]);

  // Question Management Functions
  const createQuestion = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const { data: question, error } = await supabase
        .from('clp_questions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

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

  const updateQuestion = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const { data: question, error } = await supabase
        .from('clp_questions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return question;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update question',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteQuestion = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clp_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete question',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Additional helper functions
  const getModulesByCourse = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clp_modules')
        .select('*')
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

  const getUserAssignmentsOrganized = useCallback(async () => {
    // This function can be implemented based on specific requirements
    return {};
  }, []);

  return {
    loading,
    getCourses,
    getAssignments,
    startAttempt,
    submitAssignment,
    getAttemptsByUser,
    getQuestionsByAssignment,
    submitAnswer,
    getAnswersByAttempt,
    getLeaderboard,
    deleteAssignment,
    publishAssignment,
    getModulesByCourse,
    createAssignment,
    updateAssignment,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getAssignmentsWithProgress,
    getUserAssignmentsOrganized
  };
};