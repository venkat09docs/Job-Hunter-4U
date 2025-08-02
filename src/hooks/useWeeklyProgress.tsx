import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, subWeeks } from 'date-fns';

export interface WeeklySnapshot {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  resume_progress: number;
  linkedin_progress: number;
  github_progress: number;
  network_progress: number;
  job_applications_count: number;
  published_blogs_count: number;
  total_resume_opens: number;
  total_job_searches: number;
  total_ai_queries: number;
  created_at: string;
  updated_at: string;
}

export const useWeeklyProgress = () => {
  const { user } = useAuth();
  const [weeklySnapshots, setWeeklySnapshots] = useState<WeeklySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekProgress, setCurrentWeekProgress] = useState<Partial<WeeklySnapshot> | null>(null);

  useEffect(() => {
    if (user) {
      fetchWeeklySnapshots();
    }
  }, [user]);

  const fetchWeeklySnapshots = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get last 4 weeks of snapshots
      const { data: snapshots, error } = await supabase
        .from('weekly_progress_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching weekly snapshots:', error);
        return;
      }

      setWeeklySnapshots(snapshots || []);

      // If we don't have current week data, create it
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 6 }); // Saturday start
      const currentWeekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      
      const hasCurrentWeek = snapshots?.some(s => s.week_start_date === currentWeekStartStr);
      
      if (!hasCurrentWeek) {
        await createCurrentWeekSnapshot();
      }

    } catch (error) {
      console.error('Error in fetchWeeklySnapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCurrentWeekSnapshot = async () => {
    if (!user) return;

    try {
      // Call the edge function to capture current progress
      const { data, error } = await supabase.functions.invoke('weekly-progress-capture', {
        body: { user_id: user.id, manual: true }
      });

      if (error) {
        console.error('Error creating current week snapshot:', error);
        return;
      }

      console.log('Created current week snapshot:', data);
      // Refresh the data
      await fetchWeeklySnapshots();
    } catch (error) {
      console.error('Error calling weekly progress capture:', error);
    }
  };

  const getTrendIndicator = (current: number, previous: number): string => {
    if (current > previous) return '↗️';
    if (current < previous) return '↘️';
    return '➡️';
  };

  const getWeeklyTrends = () => {
    if (weeklySnapshots.length < 2) return {};

    const current = weeklySnapshots[0];
    const previous = weeklySnapshots[1];

    return {
      resume: getTrendIndicator(current.resume_progress, previous.resume_progress),
      linkedin: getTrendIndicator(current.linkedin_progress, previous.linkedin_progress),
      github: getTrendIndicator(current.github_progress, previous.github_progress),
      network: getTrendIndicator(current.network_progress, previous.network_progress),
      jobApplications: getTrendIndicator(current.job_applications_count, previous.job_applications_count),
      blogs: getTrendIndicator(current.published_blogs_count, previous.published_blogs_count),
    };
  };

  const formatWeeklyMetrics = () => {
    return weeklySnapshots.map(snapshot => ({
      week: format(new Date(snapshot.week_start_date), 'MMM dd'),
      resumeProgress: snapshot.resume_progress,
      linkedinProgress: snapshot.linkedin_progress,
      githubProgress: snapshot.github_progress,
      networkProgress: snapshot.network_progress,
      jobApplications: snapshot.job_applications_count,
      blogPosts: snapshot.published_blogs_count,
      resumeOpens: snapshot.total_resume_opens,
      jobSearches: snapshot.total_job_searches,
      aiQueries: snapshot.total_ai_queries,
    })).reverse(); // Reverse to show oldest first
  };

  return {
    weeklySnapshots,
    currentWeekProgress,
    loading,
    getWeeklyTrends,
    formatWeeklyMetrics,
    refreshProgress: fetchWeeklySnapshots,
    createCurrentWeekSnapshot
  };
};