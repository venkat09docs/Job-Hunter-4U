import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GitHubProfileProgress {
  totalTasks: number;
  completedTasks: number;
  progress: number;
  loading: boolean;
}

export const useGitHubProfileProgress = () => {
  const [data, setData] = useState<GitHubProfileProgress>({
    totalTasks: 0,
    completedTasks: 0,
    progress: 0,
    loading: true,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGitHubProfileProgress();
    }
  }, [user]);

  const fetchGitHubProfileProgress = async () => {
    if (!user) return;

    try {
      setData(prev => ({ ...prev, loading: true }));

      // First, get the GitHub sub-category ID
      const { data: subCategories, error: subCatError } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('parent_category', 'profile')
        .eq('is_active', true)
        .ilike('name', '%github%');

      if (subCatError) throw subCatError;

      const githubSubCategory = subCategories?.[0];
      
      if (!githubSubCategory) {
        console.log('🔍 No GitHub sub-category found');
        setData({
          totalTasks: 0,
          completedTasks: 0,
          progress: 0,
          loading: false,
        });
        return;
      }

      // Fetch assignments for the GitHub sub-category
      const { data: assignments, error: assignmentsError } = await supabase
        .from('career_task_assignments')
        .select(`
          id,
          status,
          user_id,
          career_task_templates!inner (
            id,
            title,
            sub_category_id,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('career_task_templates.sub_category_id', githubSubCategory.id)
        .eq('career_task_templates.is_active', true);

      if (assignmentsError) throw assignmentsError;

      const totalTasks = assignments?.length || 0;
      const completedTasks = assignments?.filter(task => task.status === 'verified').length || 0;
      const progress = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      console.log('🔍 GitHub Profile Progress Hook:', {
        totalTasks,
        completedTasks,
        progress: progress + '%',
        githubSubCategory: githubSubCategory.name,
        assignmentsFound: assignments?.length || 0
      });

      setData({
        totalTasks,
        completedTasks,
        progress,
        loading: false,
      });

    } catch (error) {
      console.error('Error fetching GitHub profile progress:', error);
      setData({
        totalTasks: 0,
        completedTasks: 0,
        progress: 0,
        loading: false,
      });
    }
  };

  const refreshProgress = () => {
    fetchGitHubProfileProgress();
  };

  return {
    ...data,
    refreshProgress,
  };
};