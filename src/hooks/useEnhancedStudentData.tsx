import { useState, useEffect, useCallback } from 'react';
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
  avg_resume_progress: number;
  avg_linkedin_progress: number;
  avg_github_progress: number;
  avg_job_applications: number;
  students: EnhancedStudentStats[];
}

export const useEnhancedStudentData = () => {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEnhancedStudentData = useCallback(async () => {
    if (!user) {
      console.log('🔍 EnhancedStudentData: No user found, skipping data fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 EnhancedStudentData: Starting enhanced student data fetch for user:', user.id, user.email);

      // First, get the user's role and institute assignments
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('🔍 EnhancedStudentData: Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('🔍 EnhancedStudentData: User roles:', userRoles);

      const isAdmin = userRoles?.some(role => role.role === 'admin');
      const isInstituteAdmin = userRoles?.some(role => role.role === 'institute_admin');

      console.log('🔍 EnhancedStudentData: Role check:', { isAdmin, isInstituteAdmin });

      if (!isAdmin && !isInstituteAdmin) {
        console.log('🔍 EnhancedStudentData: Access denied - user is not admin or institute admin');
        toast.error('Access denied');
        setBatches([]);
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
        console.log('🔍 EnhancedStudentData: Fetching institute admin assignments...');
        const { data: assignments, error: assignmentError } = await supabase
          .from('institute_admin_assignments')
          .select('institute_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (assignmentError) {
          console.error('🔍 EnhancedStudentData: Error fetching institute assignments:', assignmentError);
          throw assignmentError;
        }

        console.log('🔍 EnhancedStudentData: Institute assignments:', assignments);

        if (!assignments?.length) {
          console.log('🔍 EnhancedStudentData: No institute assignments found for user', user.id);
          setBatches([]);
          return;
        }

        const instituteIds = assignments.map(a => a.institute_id);
        console.log('🔍 EnhancedStudentData: Institute IDs for filtering:', instituteIds);
        
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
      if (batchError) {
        console.error('🔍 EnhancedStudentData: Error fetching batches:', batchError);
        throw batchError;
      }

      console.log('🔍 EnhancedStudentData: Batches data for institute admin:', batchesData);

      const enhancedBatches: BatchSummary[] = [];

      for (const batch of batchesData || []) {
        console.log(`🔍 EnhancedStudentData: Processing batch: ${batch.name} (${batch.id})`);
        
        // Get students in this batch
        const { data: assignments, error: assignmentError } = await supabase
          .from('user_assignments')
          .select('user_id')
          .eq('batch_id', batch.id)
          .eq('assignment_type', 'batch')
          .eq('is_active', true);

        if (assignmentError) {
          console.error('🔍 EnhancedStudentData: Error fetching assignments for batch', batch.id, ':', assignmentError);
          continue;
        }

        console.log(`🔍 EnhancedStudentData: Found ${assignments?.length || 0} students in batch ${batch.name}`);

        if (!assignments?.length) {
          enhancedBatches.push({
            batch_id: batch.id,
            batch_name: batch.name,
            batch_code: batch.code,
            student_count: 0,
            avg_completion: 0,
            avg_resume_progress: 0,
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
        const avgResumeProgress = students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.resume_progress, 0) / students.length)
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
          avg_resume_progress: avgResumeProgress,
          avg_linkedin_progress: avgLinkedInProgress,
          avg_github_progress: avgGitHubProgress,
          avg_job_applications: avgJobApplications,
          students
        });
      }

      setBatches(enhancedBatches);
      console.log('Enhanced batches data loaded:', enhancedBatches);
    } catch (error) {
      console.error('Error fetching enhanced student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEnhancedStudentData();
    }
  }, [user, fetchEnhancedStudentData]);

  // Removed auto-refresh functionality to prevent page reloading
  // Institute admins will use manual refresh buttons instead


  const fetchDetailedStudentStats = async (
    userId: string, 
    batchId: string, 
    batchName: string
  ): Promise<EnhancedStudentStats | null> => {
    try {
      // Get basic profile info including subscription details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, username, subscription_active, subscription_plan, subscription_end_date')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile for user', userId, ':', profileError);
        return null;
      }

      if (!profile) return null;

      // Get resume progress - check both resume_data table and career task completions
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Also check for career task completions that might indicate profile progress
      const { count: careerTaskCompletions } = await supabase
        .from('user_activity_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'career_task_completion');

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
      } else if (careerTaskCompletions && careerTaskCompletions > 0) {
        // If no direct resume data but has career task completions, estimate progress
        // Assume each career task completion represents ~5% progress, cap at 100%
        resumeProgress = Math.min(100, Math.round(careerTaskCompletions * 5));
      }

      // Get LinkedIn progress - check both progress table and activity points
      const { data: linkedinData, count: linkedinCompletedTasks, error: linkedinError } = await supabase
        .from('linkedin_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);

      if (linkedinError) {
        console.error('Error fetching LinkedIn progress for user', userId, ':', linkedinError);
      }

      // Also check user_activity_points for LinkedIn task completion
      const { count: linkedinActivityPoints, error: linkedinActivityError } = await supabase
        .from('user_activity_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'linkedin_task_completion');

      if (linkedinActivityError) {
        console.error('Error fetching LinkedIn activity points for user', userId, ':', linkedinActivityError);
      }

      // Use the higher count between progress table and activity points
      const maxLinkedInCompleted = Math.max(linkedinCompletedTasks || 0, linkedinActivityPoints || 0);
      console.log(`LinkedIn count for ${userId}: progress table: ${linkedinCompletedTasks}, activity points: ${linkedinActivityPoints}, using: ${maxLinkedInCompleted}`);

      // Get total LinkedIn task count dynamically
      const { data: linkedinTotalTasks } = await supabase
        .from('activity_point_settings')
        .select('points')
        .eq('activity_id', 'linkedin_total_tasks')
        .maybeSingle();
      
      const totalLinkedInTasks = linkedinTotalTasks?.points || 9; // fallback to 9
      const linkedinProgress = Math.min(100, Math.round((maxLinkedInCompleted || 0) * 100 / totalLinkedInTasks));

      // Get GitHub progress - check both progress table and activity points
      const { data: githubData, count: githubCompletedTasks, error: githubError } = await supabase
        .from('github_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);

      if (githubError) {
        console.error('Error fetching GitHub progress for user', userId, ':', githubError);
      }

      // Also check user_activity_points for GitHub task completion
      const { count: githubActivityPoints, error: githubActivityError } = await supabase
        .from('user_activity_points')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'github_task_completion');

      if (githubActivityError) {
        console.error('Error fetching GitHub activity points for user', userId, ':', githubActivityError);
      }

      console.log(`GitHub count for ${userId}: progress table: ${githubCompletedTasks}, activity points: ${githubActivityPoints}`);

      // Use same logic as useGitHubProgress - only count profile setup tasks for progress table
      const profileTaskIds = ['readme_generated','special_repo_created','readme_added','repo_public'];
      const { data: profileTasks } = await supabase
        .from('github_progress')
        .select('task_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .in('task_id', profileTaskIds);
      
      const completedProfileTasks = profileTasks?.length || 0;
      const totalProfileTasks = profileTaskIds.length; // 4 profile setup tasks
      
      // For GitHub, use activity points if available, otherwise use profile task completion
      let githubCompletion = 0;
      if (githubActivityPoints && githubActivityPoints > 0) {
        // If there are activity points, assume some meaningful progress
        githubCompletion = Math.min(100, Math.round((githubActivityPoints * 25))); // 25% per task assuming 4 total tasks
      } else {
        githubCompletion = Math.min(100, Math.round((completedProfileTasks * 100) / totalProfileTasks));
      }

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
      const profileCompletion = Math.max(0, Math.round(careerDevelopmentScores.reduce((sum, score) => sum + score, 0) / careerDevelopmentScores.length));
      
      console.log(`Student ${profile.full_name} progress:`, {
        userId,
        resumeProgress: `${resumeProgress}% (${resumeData ? 'has resume data' : 'no resume data'}, ${careerTaskCompletions || 0} career tasks)`,
        linkedinProgress: `${linkedinProgress}% (progress: ${linkedinCompletedTasks || 0}, activity: ${linkedinActivityPoints || 0}/${totalLinkedInTasks} tasks)`,
        githubCompletion: `${githubCompletion}% (progress: ${githubCompletedTasks || 0}, activity: ${githubActivityPoints || 0}, profile tasks: ${completedProfileTasks}/${totalProfileTasks})`,
        profileCompletion,
        totalJobApps: totalJobApps || 0,
        linkedinConnections,
        linkedinPosts,
        batchName
      });

      // DEBUG: Add detailed logging to understand why progress is zero
      if (linkedinProgress === 0 && githubCompletion === 0 && resumeProgress === 0) {
        console.warn(`⚠️ No progress data found for ${profile.full_name}:`, {
          userId,
          linkedinTasksCompleted: linkedinCompletedTasks,
          linkedinActivityPoints: linkedinActivityPoints,
          githubTasksCompleted: githubCompletedTasks,
          githubActivityPoints: githubActivityPoints,
          careerTaskCompletions: careerTaskCompletions,
          hasResumeData: !!resumeData,
          resumeDataSections: resumeData ? Object.keys(resumeData).filter(key => resumeData[key] && key !== 'user_id' && key !== 'id') : []
        });
      } else {
        console.log(`✅ Found progress data for ${profile.full_name}: Profile ${profileCompletion}%, LinkedIn ${linkedinProgress}%, GitHub ${githubCompletion}%, Resume ${resumeProgress}%`);
      }

      // Get last activity from multiple sources to get the most recent activity
      const { data: recentActivities } = await supabase
        .from('profiles')
        .select(`
          updated_at,
          user_id
        `)
        .eq('user_id', userId)
        .single();

      // Check for recent job applications
      const { data: recentJobActivity } = await supabase
        .from('job_tracker')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check for recent LinkedIn progress
      const { data: recentLinkedInActivity } = await supabase
        .from('linkedin_progress')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check for recent GitHub progress
      const { data: recentGitHubActivity } = await supabase
        .from('github_progress')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check for recent resume updates
      const { data: recentResumeActivity } = await supabase
        .from('resume_data')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Find the most recent activity from all sources
      const activityDates = [
        recentActivities?.updated_at,
        recentJobActivity?.updated_at,
        recentLinkedInActivity?.updated_at,
        recentGitHubActivity?.updated_at,
        recentResumeActivity?.updated_at
      ].filter(Boolean);

      const lastActivity = activityDates.length > 0 
        ? activityDates.reduce((latest, current) => 
            new Date(current) > new Date(latest) ? current : latest
          ) 
        : 'Never';

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
        .maybeSingle();

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

  // Automatically fetch data when user changes
  useEffect(() => {
    console.log('🔍 EnhancedStudentData: useEffect triggered, user:', user?.id, user?.email);
    fetchEnhancedStudentData();
  }, [user?.id, fetchEnhancedStudentData]);

  return {
    batches,
    loading,
    refreshData: fetchEnhancedStudentData
  };
};