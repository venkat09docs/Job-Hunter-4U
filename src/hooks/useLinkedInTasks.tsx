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
  status: 'NOT_STARTED' | 'SUBMITTED' | 'PARTIALLY_VERIFIED' | 'VERIFIED';
  score_awarded: number;
  created_at: string;
  updated_at: string;
  linkedin_tasks: LinkedInTask;
}

export interface Evidence {
  id: string;
  user_task_id: string;
  kind: 'URL' | 'EMAIL' | 'SCREENSHOT' | 'DATA_EXPORT';
  url?: string;
  file_key?: string;
  email_meta?: any;
  parsed_json?: any;
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

  // Calculate current ISO week
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    setCurrentPeriod(`${year}-${week.toString().padStart(2, '0')}`);
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
      console.log('Successfully initialized tasks:', data);
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['linkedin-user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-scores'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-evidence'] });
      
      // Force refetch after short delay to ensure data is fresh
      setTimeout(() => {
        refetchTasks();
      }, 500);
      
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
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get linkedin user
      const { data: linkedinUser, error: userError } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!linkedinUser) {
        // User doesn't exist, they need to initialize manually
        console.log('LinkedIn user not found, user needs to initialize week');
        return [];
      }

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
            active
          )
        `)
        .eq('user_id', linkedinUser.id)
        .eq('period', currentPeriod)
        .order('created_at');

      if (error) throw error;
      return data as LinkedInUserTask[];
    },
    enabled: !!currentPeriod,
    staleTime: 1000, // Refetch after 1 second to ensure fresh data
    refetchOnWindowFocus: true
  });

  // Get evidence for tasks
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

  // Submit evidence
  const submitEvidenceMutation = useMutation({
    mutationFn: async ({ 
      taskId, 
      kind, 
      url, 
      file 
    }: { 
      taskId: string; 
      kind: 'URL' | 'EMAIL' | 'SCREENSHOT' | 'DATA_EXPORT';
      url?: string;
      file?: File;
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

      const { data, error } = await supabase
        .from('linkedin_evidence')
        .insert({
          user_task_id: taskId,
          kind,
          url,
          file_key: fileKey
        })
        .select()
        .single();

      if (error) throw error;
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
    signals,
    userBadges,
    weeklyScore,
    currentPeriod,
    tasksLoading,
    initializeWeek: initializeWeekMutation.mutate,
    submitEvidence: submitEvidenceMutation.mutate,
    verifyTasks: verifyTasksMutation.mutate,
    isSubmittingEvidence: submitEvidenceMutation.isPending,
    isVerifying: verifyTasksMutation.isPending,
    isInitializing: initializeWeekMutation.isPending
  };
};