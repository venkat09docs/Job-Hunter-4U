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
  subscription_active: boolean;
  subscription_plan: string | null;
  subscription_end_date: string | null;
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
      // Get basic profile info including subscription details
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, username, subscription_active, subscription_plan, subscription_end_date')
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

      // Calculate profile completion using the same logic as Career Growth Report
      // This is the "Overall Career Development Score" calculation
      const careerDevelopmentScores = [resumeProgress, linkedinProgress, githubCompletion];
      const profileCompletion = Math.round(careerDevelopmentScores.reduce((sum, score) => sum + score, 0) / careerDevelopmentScores.length);

      // Get last activity
      const { data: lastActivityData } = await supabase
        .from('daily_progress_snapshots')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastActivity = lastActivityData?.created_at || 'Never';

      // Fetch real daily activities from database
      const dailyActivities = await fetchDailyActivities(userId);
      const weeklySummary = await fetchWeeklySummary(userId);
      const careerMetrics = await fetchCareerMetrics(userId);

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
        subscription_active: profile.subscription_active || false,
        subscription_plan: profile.subscription_plan,
        subscription_end_date: profile.subscription_end_date,
        daily_activities: dailyActivities,
        weekly_summary: weeklySummary,
        career_metrics: careerMetrics
      };
    } catch (error) {
      console.error(`Error fetching stats for user ${userId}:`, error);
      return null;
    }
  };

  const fetchDailyActivities = async (userId: string) => {
    try {
      const { data: snapshots } = await supabase
        .from('daily_progress_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(7);

      if (!snapshots?.length) {
        return [];
      }

      return snapshots.reverse().map(snapshot => ({
        date: snapshot.snapshot_date,
        job_applications: snapshot.job_applications_count || 0,
        linkedin_activities: snapshot.network_progress || 0,
        github_commits: snapshot.github_progress || 0,
        resume_updates: snapshot.resume_progress || 0,
        profile_views: snapshot.published_blogs_count || 0
      }));
    } catch (error) {
      console.error('Error fetching daily activities:', error);
      return [];
    }
  };

  const fetchWeeklySummary = async (userId: string) => {
    try {
      const { data: snapshots } = await supabase
        .from('daily_progress_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (!snapshots?.length) {
        return [];
      }

      // Group by week
      const weeklyData = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(Date.now() - (4 - i) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const weekSnapshots = snapshots.filter(s => {
          const date = new Date(s.snapshot_date);
          return date >= weekStart && date < weekEnd;
        });

        const totalActivities = weekSnapshots.reduce((sum, s) => 
          sum + (s.job_applications_count || 0) + (s.network_progress || 0) + (s.github_progress || 0), 0
        );
        const jobApplications = weekSnapshots.reduce((sum, s) => sum + (s.job_applications_count || 0), 0);
        const networking = weekSnapshots.reduce((sum, s) => sum + (s.network_progress || 0), 0);
        const skillDevelopment = weekSnapshots.reduce((sum, s) => sum + (s.github_progress || 0), 0);

        weeklyData.push({
          week: `Week ${i + 1}`,
          total_activities: totalActivities,
          job_applications: jobApplications,
          networking: networking,
          skill_development: skillDevelopment
        });
      }

      return weeklyData;
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      return [];
    }
  };

  const fetchCareerMetrics = async (userId: string) => {
    try {
      // Get leaderboard points
      const { data: rankings } = await supabase
        .from('leaderboard_rankings')
        .select('total_points')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      // Get activity streaks and engagement from daily snapshots
      const { data: recentSnapshots } = await supabase
        .from('daily_progress_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(30);

      let activityStreak = 0;
      let weeklyPoints = 0;
      let monthlyPoints = 0;

      if (recentSnapshots?.length) {
        // Calculate streak
        const today = new Date();
        for (let i = 0; i < recentSnapshots.length; i++) {
          const snapshotDate = new Date(recentSnapshots[i].snapshot_date);
          const diffDays = Math.floor((today.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === i) {
            const dailyActivity = (recentSnapshots[i].job_applications_count || 0) + 
                                 (recentSnapshots[i].network_progress || 0) + 
                                 (recentSnapshots[i].github_progress || 0);
            if (dailyActivity > 0) {
              activityStreak++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        // Calculate weekly and monthly points based on activity
        const lastWeek = recentSnapshots.slice(0, 7);
        weeklyPoints = lastWeek.reduce((sum, s) => 
          sum + (s.job_applications_count || 0) * 5 + (s.network_progress || 0) * 3 + (s.github_progress || 0) * 4, 0
        );

        monthlyPoints = recentSnapshots.reduce((sum, s) => 
          sum + (s.job_applications_count || 0) * 5 + (s.network_progress || 0) * 3 + (s.github_progress || 0) * 4, 0
        );
      }

      const totalPoints = rankings?.total_points || 0;
      const engagementScore = Math.min(100, Math.round((activityStreak * 10 + weeklyPoints) / 2));

      return {
        total_points: totalPoints,
        weekly_points: weeklyPoints,
        monthly_points: monthlyPoints,
        activity_streak: activityStreak,
        engagement_score: engagementScore
      };
    } catch (error) {
      console.error('Error fetching career metrics:', error);
      return {
        total_points: 0,
        weekly_points: 0,
        monthly_points: 0,
        activity_streak: 0,
        engagement_score: 0
      };
    }
  };

  return {
    batches,
    loading,
    refreshData: fetchEnhancedStudentData
  };
};