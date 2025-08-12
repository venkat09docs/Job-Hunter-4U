import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitHubProgress {
  id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useGitHubProgress = () => {
  const [tasks, setTasks] = useState<GitHubProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGitHubProgress();
    }
  }, [user]);

  const fetchGitHubProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Fetch from database instead of localStorage
      const { data, error } = await supabase
        .from('github_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching GitHub progress:', error);
      toast.error('Failed to load GitHub progress');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!user) return;

    try {
      // Update database with proper upsert using the new unique constraint
      const { error } = await supabase
        .from('github_progress')
        .upsert({
          user_id: user.id,
          task_id: taskId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,task_id'
        });

      if (error) throw error;

      // Refresh the tasks
      await fetchGitHubProgress();
    } catch (error) {
      console.error('Error updating GitHub progress:', error);
      toast.error('Failed to update progress');
      throw error;
    }
  };

  const getCompletionPercentage = () => {
    const totalTasks = 4; // Total number of GitHub profile setup tasks: readme_generated, special_repo_created, readme_added, repo_public
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  return {
    tasks,
    loading,
    updateTaskStatus,
    getCompletionPercentage,
    refreshProgress: fetchGitHubProgress
  };
};