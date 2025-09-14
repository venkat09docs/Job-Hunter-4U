import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface LearningGoal {
  id: string;
  user_id: string;
  skill_name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  priority: 'low' | 'medium' | 'high';
  resources?: Array<{ name: string; url: string; type: string }>;
  notes?: string;
  course_id?: string;
  reward_points_awarded?: boolean;
  completion_bonus_points?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLearningGoalData {
  skill_name: string;
  description?: string;
  start_date: string;
  end_date: string;
  priority: 'low' | 'medium' | 'high';
  resources?: Array<{ name: string; url: string; type: string }>;
  notes?: string;
  course_id?: string | null;
}

export interface UpdateLearningGoalData extends Partial<CreateLearningGoalData> {
  status?: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
}

export function useLearningGoals() {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchGoals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedGoals = (data || []).map((goal: any) => ({
        ...goal,
        resources: Array.isArray(goal.resources) ? goal.resources as { name: string; url: string; type: string; }[] : [],
        status: (goal.status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
        priority: (goal.priority as 'low' | 'medium' | 'high') || 'medium',
        course_id: goal.course_id || undefined,
        reward_points_awarded: goal.reward_points_awarded || false,
        completion_bonus_points: goal.completion_bonus_points || 0
      })) as LearningGoal[];

      setGoals(transformedGoals);
    } catch (error) {
      console.error('Error fetching learning goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch learning goals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: CreateLearningGoalData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .insert({
          ...goalData,
          user_id: user.id,
          status: 'not_started',
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      const transformedGoal = {
        ...data,
        resources: Array.isArray(data.resources) ? data.resources as { name: string; url: string; type: string; }[] : []
      } as LearningGoal;

      setGoals(prev => [transformedGoal, ...prev]);
      toast({
        title: 'Success',
        description: 'Learning goal created successfully'
      });

      return true;
    } catch (error) {
      console.error('Error creating learning goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create learning goal',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateGoal = async (id: string, updates: UpdateLearningGoalData): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedGoal = {
        ...data,
        resources: Array.isArray(data.resources) ? data.resources as { name: string; url: string; type: string; }[] : []
      } as LearningGoal;

      setGoals(prev => prev.map(goal => goal.id === id ? transformedGoal : goal));
      toast({
        title: 'Success',
        description: 'Learning goal updated successfully'
      });

      return true;
    } catch (error) {
      console.error('Error updating learning goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update learning goal',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast({
        title: 'Success',
        description: 'Learning goal deleted successfully'
      });

      return true;
    } catch (error) {
      console.error('Error deleting learning goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete learning goal',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getGoalStatus = (goal: LearningGoal) => {
    const now = new Date();
    const startDate = new Date(goal.start_date);
    const endDate = new Date(goal.end_date);

    if (goal.status === 'completed') {
      return { type: 'completed', color: 'success', text: 'Completed' };
    }

    if (now < startDate) {
      return { type: 'upcoming', color: 'info', text: 'Upcoming' };
    }

    if (now > endDate) {
      return { type: 'overdue', color: 'danger', text: 'Overdue' };
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysPassed;

    if (daysRemaining <= 3) {
      return { type: 'critical', color: 'danger', text: `${daysRemaining} days left` };
    }

    if (daysRemaining <= 7) {
      return { type: 'warning', color: 'warning', text: `${daysRemaining} days left` };
    }

    return { type: 'active', color: 'success', text: `${daysRemaining} days left` };
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('learning-goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'learning_goals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalStatus
  };
}