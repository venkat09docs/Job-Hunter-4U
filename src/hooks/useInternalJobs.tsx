import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InternalJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  description: string;
  requirements: string;
  benefits?: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  created_at: string;
  posted_by: string;
  is_active: boolean;
}

export interface InternalJobFilters {
  search: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
}

export const useInternalJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<InternalJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<InternalJobFilters>({
    search: "",
    location: "",
    job_type: "all",
    experience_level: "all",
    salary_min: "",
    salary_max: "",
  });

  const fetchJobs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters.job_type && filters.job_type !== 'all') {
        query = query.eq('job_type', filters.job_type);
      }
      
      if (filters.experience_level && filters.experience_level !== 'all') {
        query = query.eq('experience_level', filters.experience_level);
      }
      
      if (filters.salary_min) {
        query = query.gte('salary_min', parseInt(filters.salary_min));
      }
      
      if (filters.salary_max) {
        query = query.lte('salary_max', parseInt(filters.salary_max));
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching internal jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof InternalJobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      job_type: "all",
      experience_level: "all",
      salary_min: "",
      salary_max: "",
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
    refetch: fetchJobs,
  };
};