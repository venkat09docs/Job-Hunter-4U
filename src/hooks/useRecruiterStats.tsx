import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RecruiterStats {
  activeJobs: number;
  totalApplications: number;
  profileViews: number;
  pendingAssignments: number;
  verifiedAssignments: number;
  extensionRequests: number;
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
    pendingAssignments: 0,
    verifiedAssignments: 0,
    extensionRequests: 0,
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

        // Fetch assignment statistics - matching the same sources as VerifyAssignments page
        
        // 1. Career task assignments (submitted)
        const { data: pendingCareerAssignments, error: pendingCareerError } = await supabase
          .from('career_task_assignments')
          .select('id, user_id')
          .eq('status', 'submitted');

        if (pendingCareerError) throw pendingCareerError;

        // 2. LinkedIn user tasks (SUBMITTED)
        const { data: pendingLinkedInAssignments, error: pendingLinkedInError } = await supabase
          .from('linkedin_user_tasks')
          .select('id, user_id')
          .eq('status', 'SUBMITTED');

        if (pendingLinkedInError) throw pendingLinkedInError;

        // 3. Job hunting assignments (submitted)
        const { data: pendingJobAssignments, error: pendingJobError } = await supabase
          .from('job_hunting_assignments')
          .select('id, user_id')
          .eq('status', 'submitted');

        if (pendingJobError) throw pendingJobError;

        // 4. GitHub user tasks (SUBMITTED)
        const { data: pendingGitHubAssignments, error: pendingGitHubError } = await supabase
          .from('github_user_tasks')
          .select('id, user_id')
          .eq('status', 'SUBMITTED');

        if (pendingGitHubError) throw pendingGitHubError;

        console.log('🔍 Recruiter Stats - Pending Assignments by type:', {
          career: pendingCareerAssignments?.length || 0,
          linkedIn: pendingLinkedInAssignments?.length || 0,
          jobHunting: pendingJobAssignments?.length || 0,
          gitHub: pendingGitHubAssignments?.length || 0
        });

        // Get verified assignments from all sources
        const { data: verifiedCareerAssignments, error: verifiedCareerError } = await supabase
          .from('career_task_assignments')
          .select('id, user_id')
          .eq('status', 'verified');

        if (verifiedCareerError) throw verifiedCareerError;

        const { data: verifiedLinkedInAssignments, error: verifiedLinkedInError } = await supabase
          .from('linkedin_user_tasks')
          .select('id, user_id')
          .eq('status', 'VERIFIED');

        if (verifiedLinkedInError) throw verifiedLinkedInError;

        const { data: verifiedJobAssignments, error: verifiedJobError } = await supabase
          .from('job_hunting_assignments')
          .select('id, user_id')
          .eq('status', 'verified');

        if (verifiedJobError) throw verifiedJobError;

        const { data: verifiedGitHubAssignments, error: verifiedGitHubError } = await supabase
          .from('github_user_tasks')
          .select('id, user_id')
          .eq('status', 'VERIFIED');

        if (verifiedGitHubError) throw verifiedGitHubError;

        console.log('🔍 Recruiter Stats - Verified Assignments by type:', {
          career: verifiedCareerAssignments?.length || 0,
          linkedIn: verifiedLinkedInAssignments?.length || 0,
          jobHunting: verifiedJobAssignments?.length || 0,
          gitHub: verifiedGitHubAssignments?.length || 0
        });

        // Get extension requests
        const { data: extensionRequests, error: extensionError } = await supabase
          .from('linkedin_task_renable_requests')
          .select('id')
          .eq('status', 'pending');

        if (extensionError) throw extensionError;

        console.log('🔍 Recruiter Stats - Extension Requests:', extensionRequests?.length || 0);

        const totalPendingAssignments = (pendingCareerAssignments?.length || 0) + 
                                        (pendingLinkedInAssignments?.length || 0) + 
                                        (pendingJobAssignments?.length || 0) + 
                                        (pendingGitHubAssignments?.length || 0);
        
        const totalVerifiedAssignments = (verifiedCareerAssignments?.length || 0) + 
                                         (verifiedLinkedInAssignments?.length || 0) + 
                                         (verifiedJobAssignments?.length || 0) + 
                                         (verifiedGitHubAssignments?.length || 0);
        const totalExtensionRequests = extensionRequests?.length || 0;

        console.log('🔍 Recruiter Stats - Final Totals (fixed):', {
          pending: totalPendingAssignments,
          verified: totalVerifiedAssignments, 
          extensions: totalExtensionRequests
        });

        // For now, we'll set applications and views to 0 since we don't have those tables yet
        // These can be implemented later when application tracking is added
        setStats({
          activeJobs,
          totalApplications: 0,
          profileViews: 0,
          pendingAssignments: totalPendingAssignments,
          verifiedAssignments: totalVerifiedAssignments,
          extensionRequests: totalExtensionRequests,
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

      // Fetch assignment statistics - matching the same sources as VerifyAssignments page
      
      // 1. Career task assignments (submitted)
      const { data: pendingCareerAssignments, error: pendingCareerError } = await supabase
        .from('career_task_assignments')
        .select('id, user_id')
        .eq('status', 'submitted');

      if (pendingCareerError) throw pendingCareerError;

      // 2. LinkedIn user tasks (SUBMITTED)
      const { data: pendingLinkedInAssignments, error: pendingLinkedInError } = await supabase
        .from('linkedin_user_tasks')
        .select('id, user_id')
        .eq('status', 'SUBMITTED');

      if (pendingLinkedInError) throw pendingLinkedInError;

      // 3. Job hunting assignments (submitted)
      const { data: pendingJobAssignments, error: pendingJobError } = await supabase
        .from('job_hunting_assignments')
        .select('id, user_id')
        .eq('status', 'submitted');

      if (pendingJobError) throw pendingJobError;

      // 4. GitHub user tasks (SUBMITTED)
      const { data: pendingGitHubAssignments, error: pendingGitHubError } = await supabase
        .from('github_user_tasks')
        .select('id, user_id')
        .eq('status', 'SUBMITTED');

      if (pendingGitHubError) throw pendingGitHubError;

      // Get verified assignments from all sources
      const { data: verifiedCareerAssignments, error: verifiedCareerError } = await supabase
        .from('career_task_assignments')
        .select('id, user_id')
        .eq('status', 'verified');

      if (verifiedCareerError) throw verifiedCareerError;

      const { data: verifiedLinkedInAssignments, error: verifiedLinkedInError } = await supabase
        .from('linkedin_user_tasks')
        .select('id, user_id')
        .eq('status', 'VERIFIED');

      if (verifiedLinkedInError) throw verifiedLinkedInError;

      const { data: verifiedJobAssignments, error: verifiedJobError } = await supabase
        .from('job_hunting_assignments')
        .select('id, user_id')
        .eq('status', 'verified');

      if (verifiedJobError) throw verifiedJobError;

      const { data: verifiedGitHubAssignments, error: verifiedGitHubError } = await supabase
        .from('github_user_tasks')
        .select('id, user_id')
        .eq('status', 'VERIFIED');

      if (verifiedGitHubError) throw verifiedGitHubError;

      // Get extension requests
      const { data: extensionRequests, error: extensionError } = await supabase
        .from('linkedin_task_renable_requests')
        .select('id')
        .eq('status', 'pending');

      if (extensionError) throw extensionError;

      const totalPendingAssignments = (pendingCareerAssignments?.length || 0) + 
                                      (pendingLinkedInAssignments?.length || 0) + 
                                      (pendingJobAssignments?.length || 0) + 
                                      (pendingGitHubAssignments?.length || 0);
      
      const totalVerifiedAssignments = (verifiedCareerAssignments?.length || 0) + 
                                       (verifiedLinkedInAssignments?.length || 0) + 
                                       (verifiedJobAssignments?.length || 0) + 
                                       (verifiedGitHubAssignments?.length || 0);
      const totalExtensionRequests = extensionRequests?.length || 0;

      setStats({
        activeJobs,
        totalApplications: 0,
        profileViews: 0,
        pendingAssignments: totalPendingAssignments,
        verifiedAssignments: totalVerifiedAssignments,
        extensionRequests: totalExtensionRequests,
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