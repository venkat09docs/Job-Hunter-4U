import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RecruiterStats {
  activeJobs: number;
  totalApplications: number;
  profileViews: number;
  recentJobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    created_at: string;
    is_active: boolean;
  }>;
}

export const useRecruiterStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RecruiterStats>({
    activeJobs: 0,
    totalApplications: 0,
    profileViews: 0,
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch jobs posted by the current user
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('posted_by', user.id)
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        const activeJobs = jobs?.filter(job => job.is_active).length || 0;
        const recentJobs = jobs?.slice(0, 5).map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location || 'Not specified',
          created_at: job.created_at,
          is_active: job.is_active,
        })) || [];

        // For now, we'll set applications and views to 0 since we don't have those tables yet
        // These can be implemented later when application tracking is added
        setStats({
          activeJobs,
          totalApplications: 0,
          profileViews: 0,
          recentJobs,
        });
      } catch (err: any) {
        console.error('Error fetching recruiter stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const refetch = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch jobs posted by the current user
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const activeJobs = jobs?.filter(job => job.is_active).length || 0;
      const recentJobs = jobs?.slice(0, 5).map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location || 'Not specified',
        created_at: job.created_at,
        is_active: job.is_active,
      })) || [];

      setStats({
        activeJobs,
        totalApplications: 0,
        profileViews: 0,
        recentJobs,
      });
    } catch (err: any) {
      console.error('Error fetching recruiter stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch };
};