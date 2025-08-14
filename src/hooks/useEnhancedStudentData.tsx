import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedStudentStats {
  user_id: string;
  full_name: string;
  email: string;
  username: string;
  batch_id: string;
  batch_name: string;
  profile_completion: number;
  resume_progress: number;
  linkedin_progress: number;
  github_completion: number;
  linkedin_connections: number;
  linkedin_posts: number;
  total_job_applications: number;
  active_job_applications: number;
  last_activity: string;
  daily_activities: {
    date: string;
    job_applications: number;
    linkedin_activities: number;
    github_commits: number;
    resume_updates: number;
    profile_views: number;
  }[];
  weekly_summary: {
    week: string;
    total_activities: number;
    job_applications: number;
    networking: number;
    skill_development: number;
  }[];
  career_metrics: {
    total_points: number;
    weekly_points: number;
    monthly_points: number;
    activity_streak: number;
    engagement_score: number;
  };
}

interface BatchSummary {
  batch_id: string;
  batch_name: string;
  batch_code: string;
  student_count: number;
  avg_completion: number;
  avg_linkedin_progress: number;
  avg_github_progress: number;
  avg_job_applications: number;
  students: EnhancedStudentStats[];
}

export const useEnhancedStudentData = () => {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEnhancedStudentData();
    }
  }, [user]);

  const fetchEnhancedStudentData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First, get the user's role and institute assignments
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => role.role === 'admin');
      const isInstituteAdmin = userRoles?.some(role => role.role === 'institute_admin');

      if (!isAdmin && !isInstituteAdmin) {
        toast.error('Access denied');
        return;
      }

      let batchQuery;
      
      if (isAdmin && !isInstituteAdmin) {
        // Super admin - get all batches
        batchQuery = supabase
          .from('batches')
          .select(`
            id,
            name,
            code,
            institute_id,
            institutes (
              name
            )
          `)
          .eq('is_active', true);
      } else {
        // Institute admin - get only their institute's batches
        const { data: assignments } = await supabase
          .from('institute_admin_assignments')
          .select('institute_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!assignments?.length) {
          setBatches([]);
          return;
        }

        const instituteIds = assignments.map(a => a.institute_id);
        batchQuery = supabase
          .from('batches')
          .select(`
            id,
            name,
            code,
            institute_id,
            institutes (
              name
            )
          `)
          .in('institute_id', instituteIds)
          .eq('is_active', true);
      }

      const { data: batchesData, error: batchError } = await batchQuery;
      if (batchError) throw batchError;

      const enhancedBatches: BatchSummary[] = [];

      for (const batch of batchesData || []) {
        // Get students in this batch
        const { data: assignments } = await supabase
          .from('user_assignments')
          .select('user_id')
          .eq('batch_id', batch.id)
          .eq('assignment_type', 'batch')
          .eq('is_active', true);

        if (!assignments?.length) {
          enhancedBatches.push({
            batch_id: batch.id,
            batch_name: batch.name,
            batch_code: batch.code,
            student_count: 0,
            avg_completion: 0,
            avg_linkedin_progress: 0,
            avg_github_progress: 0,
            avg_job_applications: 0,
            students: []
          });
          continue;
        }

        const studentIds = assignments.map(a => a.user_id);
        const students: EnhancedStudentStats[] = [];

        for (const studentId of studentIds) {
          const studentStats = await fetchDetailedStudentStats(studentId, batch.id, batch.name);
          if (studentStats) {
            students.push(studentStats);
          }
        }

        // Calculate batch averages
        const avgCompletion = students.length > 0 
          ? Math.round(students.reduce((sum, s) => sum + s.profile_completion, 0) / students.length)
          : 0;
        const avgLinkedInProgress = students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.linkedin_progress, 0) / students.length)
          : 0;
        const avgGitHubProgress = students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.github_completion, 0) / students.length)
          : 0;
        const avgJobApplications = students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.total_job_applications, 0) / students.length)
          : 0;

        enhancedBatches.push({
          batch_id: batch.id,
          batch_name: batch.name,
          batch_code: batch.code,
          student_count: students.length,
          avg_completion: avgCompletion,
          avg_linkedin_progress: avgLinkedInProgress,
          avg_github_progress: avgGitHubProgress,
          avg_job_applications: avgJobApplications,
          students
        });
      }

      setBatches(enhancedBatches);
    } catch (error) {
      console.error('Error fetching enhanced student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedStudentStats = async (
    userId: string, 
    batchId: string, 
    batchName: string
  ): Promise<EnhancedStudentStats | null> => {
    try {
      // Get basic profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, username')
        .eq('user_id', userId)
        .single();

      if (!profile) return null;

      // Get resume progress
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      let resumeProgress = 0;
      if (resumeData) {
        const sections = [
          resumeData.personal_details,
          resumeData.experience,
          resumeData.education,
          resumeData.skills_interests,
          resumeData.professional_summary
        ];
        const completedSections = sections.filter(section => 
          section && (Array.isArray(section) ? section.length > 0 : Object.keys(section).length > 0)
        ).length;
        resumeProgress = Math.round((completedSections / sections.length) * 100);
      }

      // Get LinkedIn progress
      const { count: linkedinCompletedTasks } = await supabase
        .from('linkedin_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);

      const linkedinProgress = Math.round((linkedinCompletedTasks || 0) * 100 / 9);

      // Get GitHub progress
      const { count: githubCompletedTasks } = await supabase
        .from('github_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);

      const githubCompletion = Math.round((githubCompletedTasks || 0) * 100 / 8);

      // Get job application stats
      const { count: totalJobApps } = await supabase
        .from('job_tracker')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: activeJobApps } = await supabase
        .from('job_tracker')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['applied', 'interviewing', 'offer']);

      // Get LinkedIn metrics
      const { data: linkedinMetrics } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      let linkedinConnections = 0;
      let linkedinPosts = 0;
      
      if (linkedinMetrics) {
        linkedinConnections = linkedinMetrics.find(m => m.activity_id === 'connections')?.value || 0;
        linkedinPosts = linkedinMetrics.find(m => m.activity_id === 'posts')?.value || 0;
      }

      // Calculate profile completion
      const profileFields = [
        profile.full_name,
        profile.email,
        resumeProgress > 0,
        linkedinProgress > 0,
        githubCompletion > 0
      ];
      const completedFields = profileFields.filter(Boolean).length;
      const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

      // Get last activity
      const { data: lastActivityData } = await supabase
        .from('daily_progress_snapshots')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastActivity = lastActivityData?.created_at || 'Never';

      // Generate sample daily and weekly data (in real implementation, fetch from database)
      const dailyActivities = generateSampleDailyData();
      const weeklySummary = generateSampleWeeklyData();
      const careerMetrics = generateSampleCareerMetrics();

      return {
        user_id: userId,
        full_name: profile.full_name || 'Unknown',
        email: profile.email || '',
        username: profile.username || '',
        batch_id: batchId,
        batch_name: batchName,
        profile_completion: profileCompletion,
        resume_progress: resumeProgress,
        linkedin_progress: linkedinProgress,
        github_completion: githubCompletion,
        linkedin_connections: linkedinConnections,
        linkedin_posts: linkedinPosts,
        total_job_applications: totalJobApps || 0,
        active_job_applications: activeJobApps || 0,
        last_activity: lastActivity,
        daily_activities: dailyActivities,
        weekly_summary: weeklySummary,
        career_metrics: careerMetrics
      };
    } catch (error) {
      console.error(`Error fetching stats for user ${userId}:`, error);
      return null;
    }
  };

  const generateSampleDailyData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        job_applications: Math.floor(Math.random() * 5),
        linkedin_activities: Math.floor(Math.random() * 8),
        github_commits: Math.floor(Math.random() * 3),
        resume_updates: Math.floor(Math.random() * 2),
        profile_views: Math.floor(Math.random() * 10)
      });
    }
    return data;
  };

  const generateSampleWeeklyData = () => {
    return [
      { week: 'Week 1', total_activities: 12, job_applications: 3, networking: 5, skill_development: 4 },
      { week: 'Week 2', total_activities: 15, job_applications: 4, networking: 6, skill_development: 5 },
      { week: 'Week 3', total_activities: 18, job_applications: 5, networking: 7, skill_development: 6 },
      { week: 'Week 4', total_activities: 22, job_applications: 6, networking: 8, skill_development: 8 }
    ];
  };

  const generateSampleCareerMetrics = () => {
    return {
      total_points: Math.floor(Math.random() * 1000) + 500,
      weekly_points: Math.floor(Math.random() * 100) + 50,
      monthly_points: Math.floor(Math.random() * 400) + 200,
      activity_streak: Math.floor(Math.random() * 30) + 1,
      engagement_score: Math.floor(Math.random() * 100) + 1
    };
  };

  return {
    batches,
    loading,
    refreshData: fetchEnhancedStudentData
  };
};