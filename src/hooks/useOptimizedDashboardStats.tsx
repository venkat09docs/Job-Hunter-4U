import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { requestCache } from '@/utils/simpleRequestCache';

interface DashboardStats {
  totalJobApplications: number;
  publishedBlogsCount: number;
  savedCoverLettersCount: number; 
  savedReadmeFilesCount: number;
  totalJobResultsCount: number;
  jobStatusCounts: Record<string, number>;
  recentJobs: any[];
  loading: boolean;
}

export const useOptimizedDashboardStats = (): DashboardStats => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobApplications: 0,
    publishedBlogsCount: 0,
    savedCoverLettersCount: 0,
    savedReadmeFilesCount: 0,
    totalJobResultsCount: 0,
    jobStatusCounts: {},
    recentJobs: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));

        // Fetch consolidated stats and recent jobs in parallel with caching
        const [statsResult, recentJobsResult] = await Promise.all([
          requestCache.interceptRequest(
            async () => {
              const { data, error } = await supabase.rpc('get_dashboard_stats_consolidated', { target_user_id: user.id });
              return { data, error };
            },
            `/rpc/get_dashboard_stats_consolidated?user=${user.id}`,
            'POST'
          ),
          requestCache.interceptRequest(
            async () => {
              const { data, error } = await supabase
                .from('job_tracker')
                .select('id, company_name, job_title, status, application_date, created_at')
                .eq('user_id', user.id)
                .eq('is_archived', false)
                .order('created_at', { ascending: false })
                .limit(5);
              return { data, error };
            },
            `/job_tracker/recent?user=${user.id}`,
            'GET'
          )
        ]) as [{ data: any[], error: any }, { data: any[], error: any }];

        if (statsResult.error) {
          console.error('Error fetching dashboard stats:', statsResult.error);
          return;
        }

        if (recentJobsResult.error) {
          console.error('Error fetching recent jobs:', recentJobsResult.error);
          return;
        }

        const statsData = statsResult.data?.[0];
        if (statsData) {
          const jobStatusCounts = statsData.job_status_counts || {};
          
          setStats({
            totalJobApplications: Number(statsData.total_job_applications) || 0,
            publishedBlogsCount: Number(statsData.published_blogs_count) || 0,
            savedCoverLettersCount: Number(statsData.saved_cover_letters_count) || 0,
            savedReadmeFilesCount: Number(statsData.saved_readme_files_count) || 0,
            totalJobResultsCount: Number(statsData.total_job_results_count) || 0,
            jobStatusCounts: {
              wishlist: Number(jobStatusCounts.wishlist) || 0,
              applied: Number(jobStatusCounts.applied) || 0,
              interviewing: Number(jobStatusCounts.interviewing) || 0,
              negotiating: Number(jobStatusCounts.negotiating) || 0,
              accepted: Number(jobStatusCounts.accepted) || 0,
              not_selected: Number(jobStatusCounts.not_selected) || 0,
              no_response: Number(jobStatusCounts.no_response) || 0,
              archived: Number(jobStatusCounts.archived) || 0,
            },
            recentJobs: recentJobsResult.data || [],
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error in fetchDashboardStats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardStats();

    // Set up single real-time subscription for job-related updates
    const channel = supabase
      .channel('optimized-dashboard-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_tracker',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Clear relevant cache and refetch
          requestCache.clearCache('get_dashboard_stats_consolidated');
          requestCache.clearCache('job_tracker/recent');
          setTimeout(fetchDashboardStats, 300);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blogs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          requestCache.clearCache('get_dashboard_stats_consolidated');
          setTimeout(fetchDashboardStats, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return stats;
};