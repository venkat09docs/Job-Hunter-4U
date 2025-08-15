import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface DailySnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
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

export const useDailyProgress = () => {
  const { user } = useAuth();
  const [dailySnapshots, setDailySnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDailySnapshots();
    }
  }, [user]);

  const fetchDailySnapshots = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get last 30 days of snapshots
      const { data: snapshots, error } = await supabase
        .from('daily_progress_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching daily snapshots:', error);
        return;
      }

      setDailySnapshots(snapshots || []);

      // If we don't have today's data, create it
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      const hasToday = snapshots?.some(s => s.snapshot_date === todayStr);
      
      if (!hasToday) {
        console.log('No data for today, creating snapshot...');
        try {
          await createTodaySnapshot();
        } catch (error) {
          console.error('Failed to create today snapshot:', error);
          // Continue anyway, don't block the UI
        }
      }

    } catch (error) {
      console.error('Error in fetchDailySnapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTodaySnapshot = async () => {
    if (!user) return;

    try {
      // Call the edge function to capture current progress
      const { data, error } = await supabase.functions.invoke('daily-progress-capture', {
        body: { user_id: user.id, manual: true }
      });

      if (error) {
        console.error('Error creating today snapshot:', error);
        return;
      }

      console.log('Created today snapshot:', data);
      
      // Only refresh if this was called manually (not during initial load)
      // This prevents infinite loops
      return data;
    } catch (error) {
      console.error('Error calling daily progress capture:', error);
      throw error;
    }
  };

  const getTrendIndicator = (current: number, previous: number): string => {
    if (current > previous) return '↗️';
    if (current < previous) return '↘️';
    return '➡️';
  };

  const getDailyTrends = () => {
    if (dailySnapshots.length < 2) return {};

    const current = dailySnapshots[0];
    const previous = dailySnapshots[1];

    return {
      resume: getTrendIndicator(current.resume_progress, previous.resume_progress),
      linkedin: getTrendIndicator(current.linkedin_progress, previous.linkedin_progress),
      github: getTrendIndicator(current.github_progress, previous.github_progress),
      network: getTrendIndicator(current.network_progress || 0, previous.network_progress || 0),
      jobApplications: getTrendIndicator(current.job_applications_count, previous.job_applications_count),
      blogs: getTrendIndicator(current.published_blogs_count, previous.published_blogs_count),
    };
  };

  const formatWeeklyMetrics = () => {
    // Group daily snapshots into weeks for display
    const weeklyData: any[] = [];
    const last4Weeks = [];
    
    // Get last 4 weeks (28 days, grouped by 7-day periods)
    for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
      const weekStart = subDays(new Date(), weekIndex * 7);
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Find snapshots for this week
      const weekSnapshots = dailySnapshots.filter(snapshot => {
        const snapshotDate = new Date(snapshot.snapshot_date);
        const weekStartDate = subDays(new Date(), weekIndex * 7 + 6);
        const weekEndDate = subDays(new Date(), weekIndex * 7);
        return snapshotDate >= weekStartDate && snapshotDate <= weekEndDate;
      });

      // Get the most recent snapshot for this week (or average if multiple)
      if (weekSnapshots.length > 0) {
        const mostRecent = weekSnapshots[0]; // Already sorted by date desc
        last4Weeks.push({
          week: format(subDays(new Date(), weekIndex * 7), 'MMM dd'),
          resumeProgress: mostRecent.resume_progress,
          linkedinProgress: mostRecent.linkedin_progress,
          githubProgress: mostRecent.github_progress,
          networkProgress: mostRecent.network_progress || 0,
          jobApplications: mostRecent.job_applications_count,
          blogPosts: mostRecent.published_blogs_count,
          resumeOpens: mostRecent.total_resume_opens,
          jobSearches: mostRecent.total_job_searches,
          aiQueries: mostRecent.total_ai_queries,
        });
      } else {
        // If no data for this week, use placeholder
        last4Weeks.push({
          week: format(subDays(new Date(), weekIndex * 7), 'MMM dd'),
          resumeProgress: 0,
          linkedinProgress: 0,
          githubProgress: 0,
          networkProgress: 0,
          jobApplications: 0,
          blogPosts: 0,
          resumeOpens: 0,
          jobSearches: 0,
          aiQueries: 0,
        });
      }
    }
    
    return last4Weeks;
  };

  const formatDailyMetrics = () => {
    return dailySnapshots.slice(0, 7).map(snapshot => ({
      date: format(new Date(snapshot.snapshot_date), 'MMM dd'),
      resumeProgress: snapshot.resume_progress,
      linkedinProgress: snapshot.linkedin_progress,
      githubProgress: snapshot.github_progress,
      networkProgress: snapshot.network_progress || 0,
      jobApplications: snapshot.job_applications_count,
      blogPosts: snapshot.published_blogs_count,
      resumeOpens: snapshot.total_resume_opens,
      jobSearches: snapshot.total_job_searches,
      aiQueries: snapshot.total_ai_queries,
    })); // Show latest dates first (no reverse)
  };

  return {
    dailySnapshots,
    loading,
    getDailyTrends,
    formatWeeklyMetrics,
    formatDailyMetrics,
    refreshProgress: fetchDailySnapshots,
    createTodaySnapshot
  };
};