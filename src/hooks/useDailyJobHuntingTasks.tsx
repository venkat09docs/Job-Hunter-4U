import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export type TaskType = 'job_applications' | 'referral_requests' | 'follow_up_messages';
export type TaskStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface DailyTask {
  id: string;
  user_id: string;
  task_type: TaskType;
  task_date: string;
  target_count: number;
  actual_count: number;
  evidence_data: any;
  evidence_urls?: string[];
  file_urls?: string[];
  description?: string;
  status: TaskStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export const useDailyJobHuntingTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);

  const taskConfigs = {
    job_applications: {
      title: 'Apply to 5 Job Roles',
      target: 5,
      description: 'Apply to 5 relevant job positions with customized resume and cover letter',
      points: 10
    },
    referral_requests: {
      title: 'Request 3 Job Referrals',
      target: 3,
      description: 'Request referrals from connections for 3 job opportunities',
      points: 8
    },
    follow_up_messages: {
      title: 'Send 5 Follow-up Messages',
      target: 5,
      description: 'Send follow-up messages to 5 previous job applications or connections',
      points: 6
    }
  };

  // Fetch tasks for a specific date
  const fetchTasksForDate = async (date: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_job_hunting_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', date)
        .order('task_type', { ascending: true });

      if (error) throw error;

      setTasks((data as DailyTask[]) || []);
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      toast.error('Failed to load daily tasks');
    } finally {
      setLoading(false);
    }
  };

  // Create or update a task
  const upsertTask = async (
    taskType: TaskType,
    date: string,
    actualCount: number,
    evidenceData: any = {},
    description?: string,
    evidenceUrls?: string[],
    fileUrls?: string[]
  ) => {
    if (!user?.id) return;

    try {
      const config = taskConfigs[taskType];
      const taskData = {
        user_id: user.id,
        task_type: taskType,
        task_date: date,
        target_count: config.target,
        actual_count: actualCount,
        evidence_data: evidenceData,
        evidence_urls: evidenceUrls || [],
        file_urls: fileUrls || [],
        description,
        status: 'pending' as TaskStatus,
        points_earned: 0
      };

      const { data, error } = await supabase
        .from('daily_job_hunting_tasks')
        .upsert(taskData, {
          onConflict: 'user_id,task_type,task_date'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTasks(prev => {
        const index = prev.findIndex(t => t.task_type === taskType && t.task_date === date);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data as DailyTask;
          return updated;
        } else {
          return [...prev, data as DailyTask];
        }
      });

      toast.success('Task updated successfully');
      return data;
    } catch (error) {
      console.error('Error upserting task:', error);
      toast.error('Failed to update task');
      throw error;
    }
  };

  // Submit task for review
  const submitTask = async (taskId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('daily_job_hunting_tasks')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? data as DailyTask : task
      ));

      toast.success('Task submitted for review');
      return data;
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task');
      throw error;
    }
  };

  // Get task for specific type and date
  const getTask = (taskType: TaskType, date: string) => {
    return tasks.find(t => t.task_type === taskType && t.task_date === date);
  };

  // Get all tasks for a specific date
  const getTasksForDate = (date: string) => {
    return tasks.filter(t => t.task_date === date);
  };

  // Calculate daily progress
  const getDailyProgress = (date: string) => {
    const dailyTasks = getTasksForDate(date);
    const totalTasks = Object.keys(taskConfigs).length;
    const completedTasks = dailyTasks.filter(t => t.status === 'approved').length;
    const submittedTasks = dailyTasks.filter(t => t.status === 'submitted').length;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      submitted: submittedTasks,
      pending: totalTasks - completedTasks - submittedTasks,
      percentage: Math.round((completedTasks / totalTasks) * 100)
    };
  };

  // Auto-fetch tasks for today when component mounts
  useEffect(() => {
    if (user?.id) {
      const today = format(new Date(), 'yyyy-MM-dd');
      fetchTasksForDate(today);
    }
  }, [user?.id]);

  return {
    tasks,
    loading,
    taskConfigs,
    fetchTasksForDate,
    upsertTask,
    submitTask,
    getTask,
    getTasksForDate,
    getDailyProgress
  };
};