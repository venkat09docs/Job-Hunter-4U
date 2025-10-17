import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface RecruiterJob {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  description: string;
  requirements: string;
  benefits: string;
  salary_min: number | null;
  salary_max: number | null;
  application_deadline: string | null;
  job_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  posted_by: string;
  is_active: boolean;
}

export interface RecruiterJobFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  job_type: string;
}

export const useRecruiterJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<RecruiterJobFilters>({
    search: '',
    status: 'all',
    job_type: 'all',
  });

  const fetchJobs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Apply job type filter
      if (filters.job_type && filters.job_type !== 'all') {
        query = query.eq('job_type', filters.job_type);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching recruiter jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });

      fetchJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !currentStatus })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Job ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchJobs();
    } catch (error: any) {
      console.error('Error toggling job status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    }
  };

  const updateFilter = (key: keyof RecruiterJobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      job_type: 'all',
    });
  };

  useEffect(() => {
    fetchJobs();
  }, [user, filters]);

  return {
    jobs,
    loading,
    filters,
    updateFilter,
    clearFilters,
    deleteJob,
    toggleJobStatus,
    refetch: fetchJobs,
  };
};
