import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LinkedInTask {
  id: string;
  code: string;
  title: string;
  description: string;
  evidence_types: string[];
  points_base: number;
  bonus_rules: any;
  active: boolean;
}

export interface LinkedInUserTask {
  id: string;
  user_id: string;
  task_id: string;
  period: string;
  due_at: string;
  status: 'NOT_STARTED' | 'STARTED' | 'SUBMITTED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'REJECTED';
  score_awarded: number;
  created_at: string;
  updated_at: string;
  verification_notes?: string;
  admin_extended?: boolean;
  extended_by?: string;
  extended_at?: string;
  extension_reason?: string;
  linkedin_tasks: LinkedInTask;
  extension_requests?: Array<{
    id: string;
    status: string;
    created_at: string;
  }>;
}

export interface Evidence {
  id: string;
  user_task_id: string;
  kind: 'URL' | 'EMAIL' | 'SCREENSHOT' | 'DATA_EXPORT';
  url?: string;
  file_key?: string;
  email_meta?: any;
  parsed_json?: any;
  evidence_data?: {
    tracking_metrics?: {
      connections_accepted: number;
      posts_count: number;
      profile_views: number;
    };
    submission_timestamp?: string;
  };
  created_at: string;
}

export interface Signal {
  id: string;
  user_id: string;
  kind: 'COMMENTED' | 'REACTED' | 'MENTIONED' | 'INVITE_ACCEPTED' | 'POST_PUBLISHED' | 'PROFILE_UPDATED';
  actor?: string;
  subject?: string;
  link?: string;
  happened_at: string;
  raw_meta?: any;
}

export interface Badge {
  id: string;
  code: string;
  title: string;
  icon?: string;
  criteria: any;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  linkedin_badges: Badge;
}

export const useLinkedInTasks = () => {
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const queryClient = useQueryClient();

  // Calculate current week period (Monday to Sunday)
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get Monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    // Calculate week number from Monday dates
    const startOfYear = new Date(year, 0, 1);
    const startOfYearDay = startOfYear.getDay();
    const daysToFirstMonday = (8 - startOfYearDay) % 7;
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    
    const diffTime = monday.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    
    const calculatedPeriod = `${year}-${week.toString().padStart(2, '0')}`;
    
    console.log('🔍 Calculated current period:', calculatedPeriod);
    console.log('🔍 Current date:', now.toISOString());
    console.log('🔍 Monday of week:', monday.toISOString().split('T')[0]);
    console.log('🔍 Week number:', week);
    
    setCurrentPeriod(calculatedPeriod);
  }, []);

  // Initialize week tasks
  const initializeWeekMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('instantiate-linkedin-week', {
        body: {}
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Successfully initialized tasks:', data);
      console.log('✅ Tasks period from response:', data?.period);
      console.log('✅ Current hook period:', currentPeriod);
      console.log('✅ Period match:', data?.period === currentPeriod);
      
      // Update current period to match the response if different
      if (data?.period && data.period !== currentPeriod) {
        console.log('🔄 Updating period from', currentPeriod, 'to', data.period);
        setCurrentPeriod(data.period);
      }
      
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['linkedin-user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-scores'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-evidence'] });
      
      // Force refetch after short delay to ensure data is fresh
      setTimeout(() => {
        console.log('🔄 Force refetching tasks...');
        refetchTasks();
      }, 1000); // Increased delay to 1 second
      
      toast.success(`Successfully initialized ${data?.userTasks?.length || 0} LinkedIn tasks for this week!`);
    },
    onError: (error) => {
      console.error('Error initializing week:', error);
      toast.error('Failed to initialize weekly tasks. Please try again.');
    }
  });

  // Get user tasks for current period
  const { data: userTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['linkedin-user-tasks', currentPeriod],
    queryFn: async () => {
      console.log('🔍 Fetching LinkedIn tasks for period:', currentPeriod);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      console.log('🔍 Authenticated user:', user.user.id);

      // Get linkedin user
      const { data: linkedinUser, error: userError } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('🔍 Error fetching linkedin user:', userError);
        throw userError;
      }

      if (!linkedinUser) {
        console.log('🔍 LinkedIn user not found, user needs to initialize week');
        return [];
      }

      console.log('🔍 LinkedIn user found:', linkedinUser.id);

      const { data, error } = await supabase
        .from('linkedin_user_tasks')
        .select(`
          *,
          linkedin_tasks:task_id (
            id,
            code,
            title,
            description,
            evidence_types,
            points_base,
            bonus_rules,
            active,
            display_order
          ),
          extension_requests:linkedin_task_renable_requests!user_task_id (
            id,
            status,
            created_at
          )
        `)
        .eq('user_id', linkedinUser.id)
        .eq('period', currentPeriod)
        .order('created_at');
      
      // Sort by display_order from linkedin_tasks
      const sortedData = data?.sort((a, b) => {
        const orderA = a.linkedin_tasks?.display_order || 999;
        const orderB = b.linkedin_tasks?.display_order || 999;
        return orderA - orderB;
      });

      if (error) {
        console.error('🔍 Error fetching tasks:', error);
        throw error;
      }
      
      console.log('🔍 Fetched tasks:', sortedData?.length || 0, 'tasks for period', currentPeriod);
      console.log('🔍 Tasks data:', sortedData);

      // If no tasks found for current period, automatically initialize fresh tasks
      if (!sortedData || sortedData.length === 0) {
        console.log('🔄 No tasks found for current period, triggering auto-initialization...');
        
        // Trigger initialization asynchronously
        setTimeout(async () => {
          try {
            console.log('🔄 Auto-initializing fresh tasks for period:', currentPeriod);
            const { data: initData, error: initError } = await supabase.functions.invoke('instantiate-linkedin-week', {
              body: {}
            });
            
            if (initError) {
              console.error('❌ Auto-initialization failed:', initError);
            } else {
              console.log('✅ Auto-initialization successful:', initData);
              // Refetch tasks after initialization
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['linkedin-user-tasks'] });
              }, 1000);
            }
          } catch (error) {
            console.error('❌ Auto-initialization error:', error);
          }
        }, 500);
        
        return [];
      }
      
      return sortedData as LinkedInUserTask[];
    },
    enabled: !!currentPeriod,
    staleTime: 1000, // Refetch after 1 second to ensure fresh data
    refetchOnWindowFocus: true
  });

  // Get evidence for current week tasks (for task-specific display)
  const { data: evidence = [] } = useQuery({
    queryKey: ['linkedin-evidence', userTasks.map(t => t.id)],
    queryFn: async () => {
      if (userTasks.length === 0) return [];

      const taskIds = userTasks.map(t => t.id);
      const { data, error } = await supabase
        .from('linkedin_evidence')
        .select('*')
        .in('user_task_id', taskIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Evidence[];
    },
    enabled: userTasks.length > 0
  });

  // Get ALL evidence for cumulative stats (across all periods)
  const { data: allEvidence = [] } = useQuery({
    queryKey: ['linkedin-all-evidence'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get linkedin user
      const { data: linkedinUser, error: userError } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching linkedin user for stats:', userError);
        throw userError;
      }

      if (!linkedinUser) return [];

      // Get ALL evidence for this user across all periods
      const { data, error } = await supabase
        .from('linkedin_evidence')
        .select(`
          *,
          linkedin_user_tasks!inner(user_id)
        `)
        .eq('linkedin_user_tasks.user_id', linkedinUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Evidence[];
    }
  });

  // Get recent signals
  const { data: signals = [] } = useQuery({
    queryKey: ['linkedin-signals'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: linkedinUser } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (!linkedinUser) return [];

      const { data, error } = await supabase
        .from('linkedin_signals')
        .select('*')
        .eq('user_id', linkedinUser.id)
        .order('happened_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Signal[];
    }
  });

  // Get user badges
  const { data: userBadges = [] } = useQuery({
    queryKey: ['linkedin-user-badges'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: linkedinUser } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (!linkedinUser) return [];

      const { data, error } = await supabase
        .from('linkedin_user_badges')
        .select(`
          *,
          linkedin_badges:badge_id (
            id,
            code,
            title,
            icon,
            criteria
          )
        `)
        .eq('user_id', linkedinUser.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      return data as UserBadge[];
    }
  });

  // Get current week score
  const { data: weeklyScore } = useQuery({
    queryKey: ['linkedin-scores', currentPeriod],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: linkedinUser } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (!linkedinUser) return null;

      const { data, error } = await supabase
        .from('linkedin_scores')
        .select('*')
        .eq('user_id', linkedinUser.id)
        .eq('period', currentPeriod)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!currentPeriod
  });

  // Update task status
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const { data, error } = await supabase
        .from('linkedin_user_tasks')
        .update({ 
          status: newStatus as 'NOT_STARTED' | 'STARTED' | 'SUBMITTED' | 'PARTIALLY_VERIFIED' | 'VERIFIED',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-scores'] });
      toast.success('Task status updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  });

  // Submit evidence
  const submitEvidenceMutation = useMutation({
    mutationFn: async ({ 
      taskId, 
      kind, 
      url, 
      file,
      trackingMetrics 
    }: { 
      taskId: string; 
      kind: 'URL' | 'EMAIL' | 'SCREENSHOT' | 'DATA_EXPORT';
      url?: string;
      file?: File;
      trackingMetrics?: {
        connections_accepted: number;
        posts_count: number;
        profile_views: number;
      };
    }) => {
      let fileKey: string | undefined;
      
      if (file) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');
        
        const fileName = `${user.user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('linkedin-evidence')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        fileKey = fileName;
      }

      // Prepare evidence data with tracking metrics
      const evidenceData = {
        ...(trackingMetrics && { tracking_metrics: trackingMetrics }),
        submission_timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('linkedin_evidence')
        .insert({
          user_task_id: taskId,
          kind,
          url,
          file_key: fileKey,
          evidence_data: evidenceData
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update task status to SUBMITTED
      await supabase
        .from('linkedin_user_tasks')
        .update({ 
          status: 'SUBMITTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-user-tasks'] });
      toast.success('Evidence submitted successfully!');
    },
    onError: (error) => {
      console.error('Error submitting evidence:', error);
      toast.error('Failed to submit evidence');
    }
  });

  // Verify tasks
  const verifyTasksMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('verify-linkedin-tasks', {
        body: { period: currentPeriod }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-scores'] });
      toast.success('Tasks verified successfully!');
    },
    onError: (error) => {
      console.error('Error verifying tasks:', error);
      toast.error('Failed to verify tasks');
    }
  });

  return {
    userTasks,
    evidence,
    allEvidence, // Add this for cumulative stats
    signals,
    userBadges,
    weeklyScore,
    currentPeriod,
    tasksLoading,
    initializeWeek: initializeWeekMutation.mutate,
    submitEvidence: submitEvidenceMutation.mutate,
    updateTaskStatus: (taskId: string, newStatus: string) => 
      updateTaskStatusMutation.mutate({ taskId, newStatus }),
    verifyTasks: verifyTasksMutation.mutate,
    isSubmittingEvidence: submitEvidenceMutation.isPending,
    isVerifying: verifyTasksMutation.isPending,
    isInitializing: initializeWeekMutation.isPending,
    // Debug info
    debugInfo: {
      userTasksCount: userTasks.length,
      currentPeriod,
      tasksLoading
    }
  };
};