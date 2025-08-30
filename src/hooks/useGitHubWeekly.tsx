import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { useOptimisticUpdates } from '@/utils/optimisticUpdates';
import { startOfWeek } from 'date-fns';

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
  verification_notes?: string;
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
  numberOfCommits?: number;
  numberOfReadmes?: number;
}

export const useGitHubWeekly = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Optimistic updates
  const { data: optimisticData, applyUpdate } = useOptimisticUpdates([]);

  // Fetch weekly tasks for current period
  const { data: weeklyTasksData = [], isLoading: weeklyLoading } = useQuery({
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

  // Fetch evidence for weekly tasks
  const { data: evidenceData = [] } = useQuery({
    queryKey: ['github-weekly-evidence', user?.id, weeklyTasksData.length],
    queryFn: async () => {
      if (!user?.id || !weeklyTasksData.length) return [];
      
      const taskIds = weeklyTasksData.map(task => task.id);
      const { data, error } = await supabase
        .from('github_evidence')
        .select('*')
        .in('user_task_id', taskIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && weeklyTasksData.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Combine tasks with their evidence and verification notes
  const weeklyTasks = weeklyTasksData.map(task => {
    const taskEvidence = evidenceData.filter(evidence => evidence.user_task_id === task.id);
    const latestEvidence = taskEvidence[0]; // Most recent evidence
    
    return {
      ...task,
      evidence: taskEvidence,
      latestEvidence,
      verification_notes: latestEvidence?.verification_notes,
      evidence_verified_at: latestEvidence?.verified_at,
      evidence_verification_status: latestEvidence?.verification_status
    };
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

  // Fetch recent signals with enhanced query for better activity tracking
  const { data: signals = [] } = useQuery({
    queryKey: ['github-signals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get last 30 days of activity for more comprehensive recent activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('github_signals')
        .select('*')
        .eq('user_id', user.id)
        .gte('happened_at', thirtyDaysAgo.toISOString())
        .order('happened_at', { ascending: false })
        .limit(100); // Increased limit for better activity tracking
      
      if (error) {
        console.error('Error fetching GitHub signals:', error);
        throw error;
      }
      console.log('GitHub signals fetched:', data?.length || 0, 'activities in last 30 days');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently for recent activity
  });

  // Fetch all historical scores for comprehensive weekly performance tracking
  const { data: allScores = [] } = useQuery({
    queryKey: ['github-all-scores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('period', { ascending: false });
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching all GitHub scores:', error);
        throw error;
      }
      console.log('All GitHub scores fetched:', data?.length || 0, 'periods');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
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

  // Fetch historical assignments (all assignments regardless of status or period) with more comprehensive data
  const { data: historicalAssignments = [] } = useQuery({
    queryKey: ['github-historical-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_user_tasks')
        .select(`
          *,
          github_tasks (
            id,
            title,
            description,
            points_base,
            code,
            scope,
            cadence,
            display_order,
            evidence_types,
            bonus_rules
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching historical assignments:', error);
        throw error;
      }
      
      // Filter out future weeks - only show current week and past weeks
      const currentPeriod = getCurrentPeriod();
      const filteredData = data?.filter(assignment => {
        if (!assignment.period) return true; // Keep assignments without period (repo tasks)
        
        // Compare periods as strings (YYYY-WW format)
        return assignment.period <= currentPeriod;
      }) || [];
      
      console.log('Historical assignments fetched:', filteredData.length, 'assignments (filtered out future weeks)');
      return filteredData;
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

      console.log('🔍 submitEvidenceMutation - evidenceData:', evidenceData);
      console.log('🔍 submitEvidenceMutation - numberOfCommits:', evidenceData.numberOfCommits);
      console.log('🔍 submitEvidenceMutation - numberOfReadmes:', evidenceData.numberOfReadmes);

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

      const parsed_json_data = { 
        description: evidenceData.description,
        numberOfCommits: evidenceData.numberOfCommits,
        numberOfReadmes: evidenceData.numberOfReadmes,
        commits_count: evidenceData.numberOfCommits,
        readmes_count: evidenceData.numberOfReadmes,
        repo_url: evidenceData.url,
        repositoryUrl: evidenceData.url
      };

      console.log('🔍 submitEvidenceMutation - parsed_json_data to save:', parsed_json_data);

      const { data, error } = await supabase
        .from('github_evidence')
        .insert({
          user_task_id: taskId,
          kind: evidenceData.kind,
          url: evidenceData.url,
          file_key: fileKey,
          parsed_json: parsed_json_data,
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
      queryClient.invalidateQueries({ queryKey: ['github-weekly-evidence'] });
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
      queryClient.invalidateQueries({ queryKey: ['github-weekly-evidence'] });
    },
  });

  // Helper function to get current period (YYYY-WW format)
  const getCurrentPeriod = (): string => {
    const now = new Date();
    // Use proper ISO week calculation
    const year = now.getFullYear();
    // Calculate ISO week number correctly
    const jan4 = new Date(year, 0, 4);
    const week1Monday = startOfWeek(jan4, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    
    // Calculate the week number from the difference in days
    const daysDiff = Math.floor((currentWeekStart.getTime() - week1Monday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekNumber = daysDiff + 1;
    
    return `${year}-${weekNumber.toString().padStart(2, '0')}`;
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
    allScores, // Add all scores for comprehensive historical view
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