import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { useOptimisticUpdates } from '@/utils/optimisticUpdates';

interface GitHubRepo {
  id: string;
  user_id: string;
  full_name: string;
  html_url: string;
  default_branch?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GitHubTask {
  id: string;
  scope: string;
  code: string;
  title: string;
  description?: string;
  cadence: string;
  evidence_types: string[];
  points_base: number;
  bonus_rules: any;
  active: boolean;
}

interface GitHubUserTask {
  id: string;
  user_id: string;
  task_id: string;
  period?: string;
  repo_id?: string;
  due_at?: string;
  status: 'NOT_STARTED' | 'STARTED' | 'SUBMITTED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'REJECTED';
  score_awarded: number;
  created_at: string;
  updated_at: string;
  github_tasks?: GitHubTask;
}

interface GitHubSignal {
  id: string;
  user_id: string;
  repo_id?: string;
  kind: string;
  actor?: string;
  subject?: string;
  link?: string;
  happened_at: string;
  raw_meta?: Record<string, any>;
  created_at: string;
}

interface EvidenceSubmission {
  kind: 'URL' | 'SCREENSHOT' | 'DATA_EXPORT';
  url?: string;
  description?: string;
  file?: File;
}

export const useGitHubWeekly = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Optimistic updates
  const { data: optimisticData, applyUpdate } = useOptimisticUpdates([]);

  // Fetch weekly tasks for current period
  const { data: weeklyTasks = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['github-weekly-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const currentPeriod = getCurrentPeriod();
      const { data, error } = await supabase
        .from('github_user_tasks')
        .select(`
          *,
          github_tasks (*)
        `)
        .eq('user_id', user.id)
        .eq('period', currentPeriod)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch repositories
  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ['github-repos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_repos')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch repo-specific tasks
  const { data: allRepoTasks = [], isLoading: repoTasksLoading } = useQuery({
    queryKey: ['github-repo-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_user_tasks')
        .select(`
          *,
          github_tasks (*)
        `)
        .eq('user_id', user.id)
        .is('period', null) // One-time repo tasks have no period
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Group repo tasks by repository
  const repoTasks = allRepoTasks.reduce((acc, task) => {
    if (task.repo_id) {
      if (!acc[task.repo_id]) acc[task.repo_id] = [];
      acc[task.repo_id].push(task);
    }
    return acc;
  }, {} as Record<string, GitHubUserTask[]>);

  // Fetch recent signals
  const { data: signals = [] } = useQuery({
    queryKey: ['github-signals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_signals')
        .select('*')
        .eq('user_id', user.id)
        .order('happened_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch current period scores
  const { data: scores } = useQuery({
    queryKey: ['github-scores', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const currentPeriod = getCurrentPeriod();
      const { data, error } = await supabase
        .from('github_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('period', currentPeriod)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user badges
  const { data: badges = [] } = useQuery({
    queryKey: ['github-user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_user_badges')
        .select(`
          *,
          github_badges (*)
        `)
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch historical assignments (all assignments regardless of status or period)
  const { data: historicalAssignments = [] } = useQuery({
    queryKey: ['github-historical-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_user_tasks')
        .select(`
          *,
          github_tasks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching historical assignments:', error);
        throw error;
      }
      console.log('Historical assignments fetched:', data);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Add repository mutation
  const addRepoMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, try to fetch repo info from GitHub API (optional enhancement)
      const repoUrl = `https://github.com/${repoFullName}`;
      
      const { data, error } = await supabase
        .from('github_repos')
        .insert({
          user_id: user.id,
          full_name: repoFullName,
          html_url: repoUrl,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      // After adding repo, instantiate its showcase tasks
      await supabase.functions.invoke('instantiate-repo-tasks', {
        body: { userId: user.id, repoId: data.id },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-repos'] });
      queryClient.invalidateQueries({ queryKey: ['github-repo-tasks'] });
    },
  });

  // Submit evidence mutation
  const submitEvidenceMutation = useMutation({
    mutationFn: async ({ taskId, evidenceData }: { taskId: string; evidenceData: EvidenceSubmission }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let fileKey: string | undefined;

      // Handle file upload if needed
      if (evidenceData.file) {
        const fileExt = evidenceData.file.name.split('.').pop();
        const fileName = `${user.id}/${taskId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('github-evidence')
          .upload(fileName, evidenceData.file);

        if (uploadError) throw uploadError;
        fileKey = fileName;
      }

      const { data, error } = await supabase
        .from('github_evidence')
        .insert({
          user_task_id: taskId,
          kind: evidenceData.kind,
          url: evidenceData.url,
          file_key: fileKey,
          parsed_json: { description: evidenceData.description },
        })
        .select()
        .single();

      if (error) throw error;

      // Update task status optimistically
      await supabase
        .from('github_user_tasks')
        .update({ status: 'SUBMITTED' })
        .eq('id', taskId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-weekly-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['github-repo-tasks'] });
    },
  });

  // Verify tasks mutation
  const verifyTasksMutation = useMutation({
    mutationFn: async (period?: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('verify-github-weekly', {
        body: { userId: user.id, period },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-weekly-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['github-repo-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['github-scores'] });
      queryClient.invalidateQueries({ queryKey: ['github-user-badges'] });
    },
  });

  // Instantiate week mutation
  const instantiateWeekMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('instantiate-week-github', {
        body: { userId: user.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-weekly-tasks'] });
    },
  });

  // Helper function to get current period (YYYY-WW format)
  const getCurrentPeriod = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-${week.toString().padStart(2, '0')}`;
  };

  // Wrapper functions with retry logic
  const addRepo = useCallback(async (repoFullName: string) => {
    return retryWithBackoff(() => addRepoMutation.mutateAsync(repoFullName));
  }, [addRepoMutation]);

  const submitEvidence = useCallback(async (taskId: string, evidenceData: EvidenceSubmission) => {
    setIsSubmittingEvidence(true);
    try {
      return await retryWithBackoff(() => submitEvidenceMutation.mutateAsync({ taskId, evidenceData }));
    } finally {
      setIsSubmittingEvidence(false);
    }
  }, [submitEvidenceMutation]);

  const verifyTasks = useCallback(async (period?: string) => {
    return retryWithBackoff(() => verifyTasksMutation.mutateAsync(period));
  }, [verifyTasksMutation]);

  const instantiateWeek = useCallback(async () => {
    return retryWithBackoff(() => instantiateWeekMutation.mutateAsync());
  }, [instantiateWeekMutation]);

  return {
    // Data
    weeklyTasks,
    repos,
    repoTasks,
    signals,
    scores,
    badges,
    historicalAssignments,

    // Loading states
    isLoading: weeklyLoading || reposLoading || repoTasksLoading,
    isSubmittingEvidence,

    // Actions
    addRepo,
    submitEvidence,
    verifyTasks,
    instantiateWeek,

    // Mutations (for additional control)
    addRepoMutation,
    submitEvidenceMutation,
    verifyTasksMutation,
    instantiateWeekMutation,
  };
};