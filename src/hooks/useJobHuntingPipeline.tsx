import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JobPipelineItem {
  id: string;
  user_id: string;
  job_tracker_id?: string;
  pipeline_stage: string;
  company_name: string;
  job_title: string;
  job_url?: string;
  source?: string;
  priority: string;
  notes?: any;
  tags?: string[];
  application_date?: string;
  interview_dates?: any[];
  offer_details?: any;
  rejection_reason?: string;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export const useJobHuntingPipeline = () => {
  const { user } = useAuth();
  const [pipelineItems, setPipelineItems] = useState<JobPipelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const pipelineStages = ['leads', 'applied', 'interviewing', 'offers', 'closed'];
  const stageLabels = {
    leads: 'Leads',
    applied: 'Applied',
    interviewing: 'Interviewing',
    offers: 'Offers',
    closed: 'Closed'
  };
  const stageColors = {
    leads: 'bg-gray-500',
    applied: 'bg-blue-500',
    interviewing: 'bg-yellow-500',
    offers: 'bg-green-500',
    closed: 'bg-slate-500'
  };

  useEffect(() => {
    if (user) {
      fetchPipelineItems();
    }
  }, [user]);

  const fetchPipelineItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_hunting_pipeline')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPipelineItems(data || []);
    } catch (error) {
      console.error('Error fetching pipeline items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPipelineItem = async (itemData: Partial<JobPipelineItem>) => {
    try {
      const { data, error } = await supabase
        .from('job_hunting_pipeline')
        .insert({
          user_id: user?.id,
          ...itemData
        })
        .select()
        .single();

      if (error) throw error;
      
      setPipelineItems(prev => [data, ...prev]);
      toast.success('Job added to pipeline!');
      return data;
    } catch (error: any) {
      toast.error('Failed to add job: ' + error.message);
      throw error;
    }
  };

  const updatePipelineItem = async (id: string, updates: Partial<JobPipelineItem>) => {
    try {
      const { data, error } = await supabase
        .from('job_hunting_pipeline')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPipelineItems(prev => 
        prev.map(item => item.id === id ? data : item)
      );
      toast.success('Job updated successfully!');
      return data;
    } catch (error: any) {
      toast.error('Failed to update job: ' + error.message);
      throw error;
    }
  };

  const movePipelineStage = async (id: string, newStage: string) => {
    try {
      const points = getStagePoints(newStage);
      await updatePipelineItem(id, { 
        pipeline_stage: newStage,
        points_earned: points
      });
      
      // Update streaks based on stage transitions
      await updateStreaks(newStage);
      
    } catch (error: any) {
      toast.error('Failed to move job: ' + error.message);
    }
  };

  const deletePipelineItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_hunting_pipeline')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPipelineItems(prev => prev.filter(item => item.id !== id));
      toast.success('Job removed from pipeline!');
    } catch (error: any) {
      toast.error('Failed to remove job: ' + error.message);
    }
  };

  const getStagePoints = (stage: string): number => {
    const pointsMap = {
      leads: 5,
      applied: 15,
      interviewing: 25,
      offers: 50,
      closed: 10
    };
    return pointsMap[stage as keyof typeof pointsMap] || 0;
  };

  const updateStreaks = async (stage: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (stage === 'applied') {
        await supabase.rpc('update_job_hunting_streak', {
          p_user_id: user?.id,
          p_streak_type: 'daily_application',
          p_activity_date: today
        });
      }
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  };

  const getStageCounts = () => {
    return pipelineStages.reduce((counts, stage) => {
      counts[stage] = pipelineItems.filter(item => item.pipeline_stage === stage).length;
      return counts;
    }, {} as Record<string, number>);
  };

  const getItemsByStage = (stage: string) => {
    return pipelineItems.filter(item => item.pipeline_stage === stage);
  };

  const getTotalPoints = () => {
    return pipelineItems.reduce((sum, item) => sum + (item.points_earned || 0), 0);
  };

  const getWeeklyProgress = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyItems = pipelineItems.filter(item => 
      new Date(item.created_at) >= oneWeekAgo
    );
    
    return {
      totalAdded: weeklyItems.length,
      applied: weeklyItems.filter(item => item.pipeline_stage === 'applied').length,
      interviewing: weeklyItems.filter(item => item.pipeline_stage === 'interviewing').length,
      offers: weeklyItems.filter(item => item.pipeline_stage === 'offers').length,
      points: weeklyItems.reduce((sum, item) => sum + item.points_earned, 0)
    };
  };

  return {
    pipelineItems,
    loading,
    pipelineStages,
    stageLabels,
    stageColors,
    addPipelineItem,
    updatePipelineItem,
    movePipelineStage,
    deletePipelineItem,
    getStageCounts,
    getItemsByStage,
    getTotalPoints,
    getWeeklyProgress,
    refetch: fetchPipelineItems
  };
};