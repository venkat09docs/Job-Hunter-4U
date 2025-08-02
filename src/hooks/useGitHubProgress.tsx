import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
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
      // For now, we'll use localStorage until the database types are updated
      const storedProgress = localStorage.getItem(`github_progress_${user.id}`);
      if (storedProgress) {
        setTasks(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.error('Error fetching GitHub progress:', error);
      toast.error('Failed to load GitHub progress');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!user) return;

    try {
      // For now, we'll use localStorage until the database types are updated
      const storedProgress = localStorage.getItem(`github_progress_${user.id}`);
      let allTasks: GitHubProgress[] = [];
      
      if (storedProgress) {
        allTasks = JSON.parse(storedProgress);
      }

      const existingTaskIndex = allTasks.findIndex(task => task.task_id === taskId);
      
      if (existingTaskIndex >= 0) {
        // Update existing task
        allTasks[existingTaskIndex] = {
          ...allTasks[existingTaskIndex],
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        };
      } else {
        // Add new task
        const newTask: GitHubProgress = {
          id: crypto.randomUUID(),
          user_id: user.id,
          task_id: taskId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        allTasks.push(newTask);
      }

      localStorage.setItem(`github_progress_${user.id}`, JSON.stringify(allTasks));
      setTasks(allTasks);
    } catch (error) {
      console.error('Error updating GitHub progress:', error);
      toast.error('Failed to update progress');
      throw error;
    }
  };

  const getCompletionPercentage = () => {
    const totalTasks = 14; // Total number of GitHub tasks
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