import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useOptimizedUserPoints } from '@/hooks/useOptimizedUserPoints';
import { useOptimizedDashboardStats } from '@/hooks/useOptimizedDashboardStats';
import { useOptimizedLeaderboard } from '@/hooks/useOptimizedLeaderboard';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useLinkedInTasks } from '@/hooks/useLinkedInTasks';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { useRole } from '@/hooks/useRole';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { usePaymentSocialProof } from '@/hooks/usePaymentSocialProof';
import { useLearningGoals } from '@/hooks/useLearningGoals';
import { useRecentEnrolledCourses } from '@/hooks/useRecentEnrolledCourses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResizableLayout } from '@/components/ResizableLayout';
import { useCourseStatistics } from '@/hooks/useCourseStatistics';
import { useAssignmentStatistics } from '@/hooks/useAssignmentStatistics';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { User, Briefcase, Target, TrendingUp, Calendar, CreditCard, Eye, Search, Bot, Github, Clock, CheckCircle, Users, DollarSign, Trophy, Archive, FileText, Lock, BarChart3, BookOpen, Clipboard } from 'lucide-react';
import { SubscriptionStatus, SubscriptionUpgrade, useSubscription } from '@/components/SubscriptionUpgrade';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ActivityChart from '@/components/ActivityChart';
import LeaderBoard from '@/components/LeaderBoard';
import { InstituteLeaderBoard } from '@/components/InstituteLeaderBoard';
import { VerifyActivitiesButton } from '@/components/VerifyActivitiesButton';
import { BadgeLeadersSlider } from '@/components/BadgeLeadersSlider';
import { RecentCoursesCard } from '@/components/RecentCoursesCard';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';
import PricingDialog from '@/components/PricingDialog';
import { TestSocialProof } from '@/components/TestSocialProof';
import { getTaskDayAvailability } from '@/utils/dayBasedTaskValidation';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  application_date: string;
  created_at: string;
}

const Dashboard = () => {
  // Constants - MUST be defined before hooks
  const REPO_TASK_IDS = ['pinned_repos','repo_descriptions','readme_files','topics_tags','license'];
  const WEEKLY_TARGET = 3;
  
  // ALL REACT HOOKS MUST BE CALLED FIRST - UNCONDITIONALLY AND IN SAME ORDER EVERY TIME
  const { user, signOut, hasLoggedOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Early redirect for signed-out users - do this immediately after auth hooks
  useEffect(() => {
    if (!authLoading && (!user || hasLoggedOut)) {
      console.log('Dashboard: User signed out, redirecting to auth...');
      navigate('/auth');
    }
  }, [user, hasLoggedOut, authLoading, navigate]);

  // Only proceed with other hooks if user is authenticated
  const { profile, analytics, loading: profileLoading, incrementAnalytics, hasActiveSubscription } = useProfile();
  const { isInstituteAdmin, isAdmin, isRecruiter } = useRole();
  
  // Progress and metrics hooks - only if user exists
  const { getModuleProgress, assignments, getTasksByModule } = useCareerAssignments();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading, refreshProgress: refreshGitHubProgress } = useGitHubProgress();
  const { weeklyTasks, isLoading: weeklyLoading } = useGitHubWeekly();
  const { userTasks: linkedinTasks, tasksLoading: linkedinTasksLoading } = useLinkedInTasks();
  const { isIT } = useUserIndustry();
  const { metrics: networkMetrics, loading: networkGrowthLoading, refreshMetrics: refreshNetworkMetrics } = useNetworkGrowthMetrics();
  
  // Social proof tracking for payments
  usePaymentSocialProof();
  
  // Learning Goals hook
  const { goals, loading: goalsLoading, getGoalStatus } = useLearningGoals();
  
  // Get courses from career level program for learning goals
  const { getCourses } = useCareerLevelProgram();
  
  // State for courses from learning goals
  const [learningGoalCourses, setLearningGoalCourses] = useState([]);
  const [learningCoursesLoading, setLearningCoursesLoading] = useState(false);
  
  // Optimized hooks for better performance
  const { totalPoints, currentWeekPoints, currentMonthPoints, loading: pointsLoading } = useOptimizedUserPoints();
  const { 
    totalJobApplications, 
    publishedBlogsCount, 
    savedCoverLettersCount, 
    savedReadmeFilesCount, 
    totalJobResultsCount, 
    jobStatusCounts, 
    recentJobs, 
    loading: statsLoading 
  } = useOptimizedDashboardStats();
  const { statistics: courseStats, loading: courseStatsLoading } = useCourseStatistics();
  const { statistics: assignmentStats, loading: assignmentStatsLoading } = useAssignmentStatistics();
  const { leaderboard: optimizedLeaderboard, loading: leaderboardLoading } = useOptimizedLeaderboard();
  
  // Define eligible subscription plans for Badge Leaders and Leaderboard
  const eligiblePlans = ['One Month Plan', '3 Months Plan', '6 Months Plan', '1 Year Plan'];
  
  // Check if user has eligible subscription (with flexible plan name matching)
  const hasEligibleSubscription = () => {
    const hasActive = hasActiveSubscription();
    if (!hasActive || !profile?.subscription_plan) return false;
    
    const planName = profile.subscription_plan.toLowerCase();
    
    // Check for exact match or variations of plan names
    const hasPlan = eligiblePlans.some(plan => plan.toLowerCase() === planName) ||
                    planName.includes('1 month') || planName.includes('one month') ||
                    planName.includes('3 month') || planName.includes('three month') || planName.includes('quarterly') ||
                    planName.includes('6 month') || planName.includes('six month') || planName.includes('half year') ||
                    planName.includes('1 year') || planName.includes('one year') || planName.includes('annual');
    
    return hasActive && hasPlan;
  };

  // Check if user can access Badge Leaders (admin, recruiter, or eligible subscription: 3M, 6M, 1Y)
  const canAccessBadgeLeaders = () => {
    const result = isAdmin || isRecruiter || hasEligibleSubscription();
    return result;
  };

  // Check if user can access Leaderboard (admin, recruiter, or any active subscription)
  const canAccessLeaderboard = () => {
    const result = isAdmin || isRecruiter || hasActiveSubscription();
    return result;
  };

  // Check if user has restricted plan for Badge Leaders (not admin, recruiter, or eligible plans)
  const hasRestrictedPlanForBadgeLeaders = () => {
    if (isAdmin || isRecruiter) return false;
    if (!profile?.subscription_plan || !hasActiveSubscription()) return true;
    
    const planName = profile.subscription_plan.toLowerCase();
    // One month plan is restricted - check for variations
    return planName.includes('1 month') || planName.includes('one month') || 
           (planName.includes('month') && !planName.includes('3') && !planName.includes('6') && 
            !planName.includes('three') && !planName.includes('six'));
  };

  // Debug logging for subscription status
  console.log('🔍 Dashboard Subscription Debug:', {
    currentPlan: profile?.subscription_plan,
    hasActiveSubscription: hasActiveSubscription(),
    isAdmin,
    isRecruiter,
    canAccessBadgeLeaders: canAccessBadgeLeaders(),
    hasRestrictedPlan: hasRestrictedPlanForBadgeLeaders(),
    eligiblePlans
  });

  // Check if user has no active subscription (not admin or recruiter)
  const hasNoActiveSubscription = () => {
    if (isAdmin || isRecruiter) return false;
    return !hasActiveSubscription();
  };

  // Check if user can access Status Tracker (only unsubscribed users)
  const canAccessStatusTracker = () => {
    if (isAdmin || isRecruiter) return false; // Don't show for admins or recruiters
    return !hasActiveSubscription(); // Only unsubscribed users
  };

  // Check if user can access Level Up Status (3M, 6M, 1Y plans)
  const canAccessLevelUpStatus = () => {
    if (isAdmin || isRecruiter) return true;
    const hasActive = hasActiveSubscription();
    if (!hasActive || !profile?.subscription_plan) return false;
    
    const planName = profile.subscription_plan.toLowerCase();
    
    // Check for exact match or variations of plan names
    const hasPlan = eligiblePlans.some(plan => plan.toLowerCase() === planName) ||
                    planName.includes('1 month') || planName.includes('one month') ||
                    planName.includes('3 month') || planName.includes('three month') || planName.includes('quarterly') ||
                    planName.includes('6 month') || planName.includes('six month') || planName.includes('half year') ||
                    planName.includes('1 year') || planName.includes('one year') || planName.includes('annual');
    
    return hasActive && hasPlan;
  };

  // All available subscription plans for upgrade dialog
  const allSubscriptionPlans = ['One Month Plan', '3 Months Plan', '6 Months Plan', '1 Year Plan'];
  
  // All useState hooks - MUST be called unconditionally - removed job-related state (now from optimized hook)
  const [jobsLoading, setJobsLoading] = useState(false); // Keep for compatibility
  const [weeklyDailyBreakdown, setWeeklyDailyBreakdown] = useState<Record<string, Record<string, number>>>({});
  const [repoMetrics, setRepoMetrics] = useState({ completed: 0, total: REPO_TASK_IDS.length });
  const [weeklyFlowCompleted, setWeeklyFlowCompleted] = useState(0);
  const [jobSearchPricingOpen, setJobSearchPricingOpen] = useState(false);
  const [jobTrackerPricingOpen, setJobTrackerPricingOpen] = useState(false);
  const [githubTrackerPricingOpen, setGithubTrackerPricingOpen] = useState(false);
  
  // All useCallback hooks - MUST be called unconditionally  
  const refreshWeeklyFlow = useCallback(async () => {
    if (!user) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const { data, error } = await supabase
      .from('github_daily_flow_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('session_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('session_date', format(weekEnd, 'yyyy-MM-dd'));
    if (!error) setWeeklyFlowCompleted(data?.length || 0);
  }, [user]);

  const fetchJobData = useCallback(async () => {
    // This function is kept for compatibility but no longer used 
    // since we're using optimized hooks for job data
    console.log('fetchJobData called but using optimized hooks instead');
  }, []);

  const fetchWeeklyDailyBreakdown = useCallback(async () => {
    if (!user) return;
    try {
      const baseStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const startDate = format(baseStart, 'yyyy-MM-dd');
      const endDate = format(addDays(baseStart, 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('date, activity_id, value')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      const breakdown: Record<string, Record<string, number>> = {};
      (data || []).forEach((metric: any) => {
        const dateKey = metric.date;
        if (!breakdown[dateKey]) breakdown[dateKey] = {};
        let key = metric.activity_id as string;
        if (key === 'industry_research') key = 'research';
        if (key === 'follow_up') key = 'follow_up_messages';
        if (key === 'industry_groups') key = 'engage_in_groups';
        if (key === 'article_draft') key = 'work_on_article';
        breakdown[dateKey][key] = (breakdown[dateKey][key] || 0) + (metric.value || 0);
      });
      setWeeklyDailyBreakdown(breakdown);
    } catch (e) {
      console.error('Error fetching weekly network breakdown:', e);
    }
  }, [user]);

  // Fetch courses from learning goals
  useEffect(() => {
    const fetchLearningGoalCourses = async () => {
      if (!user || goalsLoading) return;
      
      setLearningCoursesLoading(true);
      try {
        // Get all courses
        const allCourses = await getCourses();
        
        // Get courses that are linked to learning goals
        const goalsWithCourses = goals.filter(goal => goal.course_id);
        const courseIds = goalsWithCourses.map(goal => goal.course_id);
        
        // Filter courses that are in learning goals
        const filteredCourses = allCourses.filter(course => 
          courseIds.includes(course.id)
        );
        
        setLearningGoalCourses(filteredCourses);
      } catch (error) {
        console.error('Error fetching learning goal courses:', error);
        setLearningGoalCourses([]);
      } finally {
        setLearningCoursesLoading(false);
      }
    };

    fetchLearningGoalCourses();
  }, [user, goals, goalsLoading, getCourses]);

  // All useEffect hooks - MUST be called unconditionally
  useEffect(() => {
    if (!githubTasks) return;
    const completed = githubTasks.filter(t => REPO_TASK_IDS.includes(t.task_id) && t.completed).length;
    setRepoMetrics({ completed, total: REPO_TASK_IDS.length });
  }, [githubTasks]);

  useEffect(() => {
    refreshWeeklyFlow();
  }, [refreshWeeklyFlow]);

  // Remove old fetchJobData useEffect since we're using optimized hook
  useEffect(() => {
    fetchWeeklyDailyBreakdown();
  }, [fetchWeeklyDailyBreakdown]);

  // Optimized real-time subscriptions - reduced from 6 to 2 channels
  useEffect(() => {
    console.log('🔍 Dashboard: Setting up optimized real-time subscriptions');
    if (!user) return;

    const channel = supabase
      .channel('dashboard-linkedin-github-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linkedin_network_metrics',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshNetworkMetrics();
          fetchWeeklyDailyBreakdown();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'github_daily_flow_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshWeeklyFlow();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'github_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshGitHubProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshGitHubProgress, refreshNetworkMetrics, fetchWeeklyDailyBreakdown, refreshWeeklyFlow]);

  // Early redirect for recruiters to their specific dashboard
  useEffect(() => {
    if (!authLoading && !profileLoading && user && !hasLoggedOut && isRecruiter && !isAdmin && !isInstituteAdmin) {
      navigate('/recruiter');
    }
  }, [user, authLoading, profileLoading, hasLoggedOut, navigate, isRecruiter, isAdmin, isInstituteAdmin]);

  // AFTER ALL HOOKS - Now safe to do conditional rendering
  console.log('Dashboard: user =', user);
  console.log('Dashboard: profile =', profile);
  console.log('Dashboard: authLoading =', authLoading);
  console.log('Dashboard: profileLoading =', profileLoading);
  
  // If user is signed out or being redirected, don't render anything
  if (!authLoading && (!user || hasLoggedOut)) {
    return null;
  }
  
  // Check loading states IMMEDIATELY after all hooks are called - include new loading states
  if (authLoading || profileLoading || networkLoading || githubLoading || weeklyLoading || linkedinTasksLoading || pointsLoading || statsLoading || goalsLoading || learningCoursesLoading || courseStatsLoading || assignmentStatsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (authLoading || profileLoading) {
    console.log('Dashboard showing loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto border-2 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    console.log('Dashboard: Profile loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto border-2 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  console.log('Dashboard: Rendering main content');

  // Calculate skill assignments progress
  const skillAssignmentsProgress = (() => {
    if (!assignments || assignments.length === 0) return 0;
    // Filter skill-related assignments (excluding resume, linkedin, github modules)
    const skillTasks = assignments.filter(a => {
      const templateCategory = a.career_task_templates?.category?.toLowerCase() || '';
      const templateTitle = a.career_task_templates?.title?.toLowerCase() || '';
      // Exclude known profile modules and include general skill assignments
      return !templateTitle.includes('resume') && 
             !templateTitle.includes('linkedin') && 
             !templateTitle.includes('github') &&
             !templateCategory.includes('resume') &&
             !templateCategory.includes('linkedin') &&
             !templateCategory.includes('github') &&
             (templateCategory.includes('skill') || 
              templateCategory.includes('development') ||
              templateCategory.includes('learning') ||
              a.career_task_templates?.sub_category_id === null); // General assignments
    });
    return skillTasks.length > 0 
      ? Math.round((skillTasks.filter(t => t.status === 'verified').length / skillTasks.length) * 100)
      : 0;
  })();

  // Calculate LinkedIn growth task stats to sync with CareerActivities page
  const linkedinGrowthStats = (() => {
    console.log('🔍 LinkedIn Growth Stats Debug:', {
      linkedinTasks,
      linkedinTasksLength: linkedinTasks?.length,
      linkedinTasksLoading
    });
    
    if (!linkedinTasks || linkedinTasks.length === 0) {
      console.log('🔍 LinkedIn tasks empty, returning zero stats');
      return { total: 0, completed: 0, inProgress: 0, pending: 0, activeTasks: 0 };
    }
    
    const total = linkedinTasks.length;
    const completed = linkedinTasks.filter(task => task.status === 'VERIFIED').length;
    const inProgress = linkedinTasks.filter(task => 
      task.status === 'SUBMITTED' || task.status === 'PARTIALLY_VERIFIED'
    ).length;
    const pending = linkedinTasks.filter(task => task.status === 'NOT_STARTED').length;
    
    // Calculate active tasks using the EXACT same logic as CareerActivities page
    const activeTasks = linkedinTasks.filter(task => {
      // Exclude completed tasks
      if (task.status === 'VERIFIED') return false;
      
      // Check day availability - exclude future day tasks (same logic as CareerActivities)
      const dayAvailability = getTaskDayAvailability(task.linkedin_tasks?.title || '');
      if (dayAvailability.isFutureDay) return false;
      
      return true;
    }).length;
    
    const stats = { total, completed, inProgress, pending, activeTasks };
    console.log('🔍 LinkedIn Growth Stats Calculated:', stats);
    
    return stats;
  })();

  // Calculate progress percentages using career assignments data to sync with Profile Assignments page
  const resumeProgress = (() => {
    // Calculate Resume progress from Resume Building subcategory assignments to match Profile Assignments page
    if (!assignments || assignments.length === 0) return 0;
    const resumeTasks = assignments.filter(a => {
      // Use specific Resume Building subcategory ID to match Profile Assignments calculation
      return a.career_task_templates?.sub_category_id === 'ce552091-3a66-4aed-a165-686a524c8bca';
    });
    return resumeTasks.length > 0 
      ? Math.round((resumeTasks.filter(t => t.status === 'verified').length / resumeTasks.length) * 100)
      : 0;
  })();
  const linkedinProgress = (() => {
    // Calculate LinkedIn progress from LinkedIn Profile subcategory assignments (synchronized with Profile Assignments page)
    if (!assignments || assignments.length === 0) return 0;
    const linkedinTasks = assignments.filter(a => {
      return a.career_task_templates?.sub_category_id === '1f6bd7f0-117c-4167-8719-f55525b362e2';
    });
    return linkedinTasks.length > 0 
      ? Math.round((linkedinTasks.filter(t => t.status === 'verified').length / linkedinTasks.length) * 100)
      : 0;
  })();
  const githubProgress = (() => {
    // Calculate GitHub progress from GitHub Profile subcategory assignments to match Profile Assignments page
    if (!assignments || assignments.length === 0) return 0;
    const githubTasks = assignments.filter(a => {
      // Use specific GitHub Profile subcategory ID to match Profile Assignments calculation
      return a.career_task_templates?.sub_category_id === '1c47c855-7705-456b-867a-0e7a563f54db';
    });
    return githubTasks.length > 0 
      ? Math.round((githubTasks.filter(t => t.status === 'verified').length / githubTasks.length) * 100)
      : 0;
  })();

  const weeklyChartData = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index);
    const key = format(date, 'yyyy-MM-dd');
    const dayData = (weeklyDailyBreakdown[key] || {}) as Record<string, number>;
    const total = Object.values(dayData).reduce((sum, v) => sum + (v || 0), 0);
    return { label: format(date, 'EEE'), total };
  });

  const jobStatusData = [
    { name: 'Wishlist', value: jobStatusCounts.wishlist, color: 'hsl(var(--chart-wishlist))' },
    { name: 'Applied', value: jobStatusCounts.applied, color: 'hsl(var(--chart-applied))' },
    { name: 'Interviewing', value: jobStatusCounts.interviewing, color: 'hsl(var(--chart-interviewing))' },
    { name: 'Negotiating', value: jobStatusCounts.negotiating, color: 'hsl(var(--chart-negotiating))' },
    { name: 'Accepted', value: jobStatusCounts.accepted, color: 'hsl(var(--chart-accepted))' },
    { name: 'Not Selected', value: jobStatusCounts.not_selected, color: 'hsl(var(--chart-not-selected))' },
    { name: 'No Response', value: jobStatusCounts.no_response, color: 'hsl(var(--chart-no-response))' },
    { name: 'Archived', value: jobStatusCounts.archived, color: 'hsl(var(--chart-archived))' },
  ];

  const repoCompleted = repoMetrics.completed;
  const repoPending = Math.max(0, repoMetrics.total - repoCompleted);
  const repoPercent = Math.round((repoCompleted / repoMetrics.total) * 100);
  
  console.log('🔍 Dashboard GitHub Debug:', {
    isIT: isIT(),
    industry: profile?.industry,
    githubProgress,
    githubTasks: githubTasks?.length || 0,
    githubLoading
  });

  // GitHub Weekly progress calculation - synchronized with GitHubWeekly page task categorization
  const githubWeeklyStats = (() => {
    if (!weeklyTasks || weeklyTasks.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0, activeTasks: 0 };
    }
    
    const total = weeklyTasks.length;
    const completed = weeklyTasks.filter(task => task.status === 'VERIFIED').length;
    
    // Calculate active tasks - same logic as GitHubWeekly.tsx
    const activeTasks = weeklyTasks.filter(task => {
      // Exclude completed tasks
      if (task.status === 'VERIFIED') return false;
      
      // Check day availability - exclude future day tasks
      const dayAvailability = getTaskDayAvailability(task.github_tasks?.title || '');
      if (dayAvailability.isFutureDay) return false;
      
      return true;
    }).length;
    
    // In-progress tasks are those that have been started but not completed
    const inProgress = weeklyTasks.filter(task => 
      task.status === 'STARTED' || task.status === 'SUBMITTED' || task.status === 'PARTIALLY_VERIFIED'
    ).length;
    
    // Pending includes tasks that show "Start Assignment" (NOT_STARTED) and submitted tasks awaiting verification (SUBMITTED)
    const pending = weeklyTasks.filter(task => 
      (task.status === 'NOT_STARTED' && !getTaskDayAvailability(task.github_tasks?.title || '').isFutureDay) ||
      task.status === 'SUBMITTED'
    ).length;
    
    return { total, completed, inProgress, pending, activeTasks };
  })();
  
  const flowCompleted = githubWeeklyStats.completed;
  const flowRemaining = Math.max(0, githubWeeklyStats.total - githubWeeklyStats.completed);
  const weeklyTarget = githubWeeklyStats.total;

  // Calculate task statistics for each category using subcategory-based filtering to match CareerAssignments page
  const calculateTaskStats = (categoryName: string) => {
    if (!assignments || assignments.length === 0) {
      console.log(`📊 No assignments available for ${categoryName} tasks, showing zeros`);
      return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    }
    
    try {
      // Filter tasks by subcategory just like CareerAssignments page does
      let tasks: any[] = [];
      
      if (categoryName === 'RESUME') {
        // Get tasks that belong specifically to Resume Building subcategory (ID: ce552091-3a66-4aed-a165-686a524c8bca)
        tasks = assignments.filter(a => {
          return a.career_task_templates?.sub_category_id === 'ce552091-3a66-4aed-a165-686a524c8bca';
        });
      } else if (categoryName === 'LINKEDIN') {
        // Get tasks that belong specifically to LinkedIn Profile subcategory (ID: 1f6bd7f0-117c-4167-8719-f55525b362e2)
        tasks = assignments.filter(a => {
          return a.career_task_templates?.sub_category_id === '1f6bd7f0-117c-4167-8719-f55525b362e2';
        });
      } else if (categoryName === 'GITHUB') {
        // Get tasks that belong specifically to GitHub Profile subcategory (ID: 1c47c855-7705-456b-867a-0e7a563f54db)
        tasks = assignments.filter(a => {
          return a.career_task_templates?.sub_category_id === '1c47c855-7705-456b-867a-0e7a563f54db';
        });
      } else if (categoryName === 'DIGITAL_PROFILE') {
        // Get tasks that belong to digital profile subcategory
        tasks = assignments.filter(a => {
          const title = a.career_task_templates?.title?.toLowerCase() || '';
          const category = a.career_task_templates?.category?.toLowerCase() || '';
          return a.career_task_templates?.sub_category_id && 
                 (title.includes('digital') || category.includes('digital'));
        });
      }
      
      console.log(`📊 ${categoryName} tasks (subcategory-based):`, tasks);
      
      // Debug logging for RESUME category specifically
      if (categoryName === 'RESUME') {
        console.log(`📊 DEBUG RESUME TASKS:`, {
          totalAssignments: assignments.length,
          filteredTasks: tasks.length,
          taskTitles: tasks.map(t => t.career_task_templates?.title),
          taskStatuses: tasks.map(t => ({ title: t.career_task_templates?.title, status: t.status }))
        });
      }
      
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'verified').length;
      const inProgress = tasks.filter(t => 
        t.status === 'started' ||
        t.status === 'rejected' ||
        t.status === 'submitted' || 
        t.status === 'under_review' || 
        t.status === 'pending_verification'
      ).length;
      const pending = tasks.filter(t => 
        t.status === 'assigned' || 
        t.status === 'not_started' || 
        !t.status
      ).length;
      
      console.log(`📊 ${categoryName} stats (synchronized with CareerAssignments):`, { total, completed, inProgress, pending });
      
      return { total, completed, inProgress, pending };
    } catch (error) {
      console.error(`Error calculating stats for ${categoryName}:`, error);
      return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    }
  };

  const resumeStats = calculateTaskStats('RESUME');
  const linkedinStats = calculateTaskStats('LINKEDIN');
  const githubStats = calculateTaskStats('GITHUB');
  const digitalProfileStats = calculateTaskStats('DIGITAL_PROFILE');
  
  // Debug output for task stats
  console.log('📊 Dashboard Task Stats:', {
    resume: resumeStats,
    linkedin: linkedinStats,
    github: githubStats,
    digitalProfile: digitalProfileStats,
    assignmentsCount: assignments?.length || 0,
    hasGetTasksByModule: !!getTasksByModule
  });
  

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of your account.',
      });
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'There was a problem signing you out.',
        variant: 'destructive'
      });
    }
  };

  const handleDemoAction = async (actionType: 'resume_open' | 'job_search' | 'ai_query') => {
    await incrementAnalytics(actionType);
    toast({
      title: 'Activity recorded',
      description: `${actionType.replace('_', ' ')} has been logged!`,
    });
  };


  const handleJobClick = (jobId: string) => {
    if (hasActiveSubscription()) {
      navigate('/dashboard/job-tracker');
    } else {
      setJobTrackerPricingOpen(true);
    }
  };

  const handleStartJobSearch = () => {
    if (hasActiveSubscription()) {
      navigate('/dashboard/find-your-next-role');
    } else {
      setJobSearchPricingOpen(true);
    }
  };

  const handleViewAllJobs = () => {
    if (hasActiveSubscription()) {
      navigate('/dashboard/job-tracker');
    } else {
      setJobTrackerPricingOpen(true);
    }
  };

  const handleViewGithubTracker = () => {
    if (hasActiveSubscription()) {
      navigate('/dashboard/github-activity-tracker');
    } else {
      setGithubTrackerPricingOpen(true);
    }
  };

  const handleResumeClick = () => {
    navigate('/dashboard/career-assignments?category=resume');
  };

  const handleLinkedInProfileClick = () => {
    navigate('/dashboard/career-assignments?category=linkedin');
  };

  const handleGitHubProfileClick = () => {
    navigate('/dashboard/career-assignments?category=github');
  };

  const handleJobApplicationsClick = () => {
    navigate('/dashboard/job-tracker');
  };

  const handleLinkedInGrowthClick = () => {
    navigate('/career-activities');
  };

  const handleGitHubWeeklyClick = () => {
    navigate('/github-weekly');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'interviewing':
      case 'interview':
        return 'default';
      case 'applied':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'accepted':
      case 'negotiating':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <ResizableLayout>
      
      <main className="h-full flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
              <h1 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                AI CAREER LEVEL UP
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {(!profile?.subscription_active || !hasActiveSubscription()) && (
                <Button 
                  onClick={() => navigate('/dashboard/resume-builder?tab=resume')}
                  variant="default"
                  className="hidden sm:flex"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Build a Free Resume
                </Button>
              )}
              <div className="hidden sm:flex">
                <SubscriptionStatus />
              </div>
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                  Welcome back, {profile?.username || user?.email?.split('@')[0] || 'User'}!
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Let's continue building your professional presence
                </p>
              </div>
            </div>

            {/* Badge Leaders - Premium Feature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Badge Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {canAccessBadgeLeaders() ? (
                  <div>
                    <div className="mb-2 text-xs text-muted-foreground">
                      ✅ Access granted - Plan: {profile?.subscription_plan} | Active: {profile?.subscription_active ? 'Yes' : 'No'}
                    </div>
                    <BadgeLeadersSlider />
                  </div>
                ) : hasRestrictedPlanForBadgeLeaders() ? (
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Badge Leaders</h3>
                    <p className="text-muted-foreground mb-4">
                      {profile?.subscription_plan && ['One Month Plan'].includes(profile.subscription_plan) 
                        ? `Upgrade from your ${profile.subscription_plan} to access Badge Leaders` 
                        : 'Available with 3 Months, 6 Months, or 1 Year plans'
                      }
                    </p>
                    <SubscriptionUpgrade featureName="Badge Leaders" eligiblePlans={eligiblePlans}>
                      <Button>Upgrade Plan</Button>
                    </SubscriptionUpgrade>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Badge Leaders</h3>
                    <p className="text-muted-foreground mb-4">
                      Available with premium subscription plans
                    </p>
                    <SubscriptionUpgrade featureName="Badge Leaders" eligiblePlans={eligiblePlans}>
                      <Button>Upgrade Plan</Button>
                    </SubscriptionUpgrade>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard - Premium Feature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {canAccessLeaderboard() ? (
                  isInstituteAdmin ? <InstituteLeaderBoard /> : <LeaderBoard />
                ) : hasNoActiveSubscription() ? (
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
                    <p className="text-muted-foreground mb-4">
                      Subscription required to access Leaderboard
                    </p>
                    <SubscriptionUpgrade featureName="Leaderboard" eligiblePlans={allSubscriptionPlans}>
                      <Button>Upgrade Plan</Button>
                    </SubscriptionUpgrade>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
                    <p className="text-muted-foreground mb-4">
                      Subscription required to access Leaderboard
                    </p>
                    <SubscriptionUpgrade featureName="Leaderboard" eligiblePlans={allSubscriptionPlans}>
                      <Button>Upgrade Plan</Button>
                    </SubscriptionUpgrade>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skill Level Up Status - Full Width */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <Clipboard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Skill Level Up Status
                  </CardTitle>
                </div>
              </CardHeader>
                <CardContent>
                 {/* Two Boards - Courses and Skill Assignments */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Courses - First Board */}
                   <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/dashboard/skill-level?tab=skill-programs')}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between mb-3">
                         <div>
                           <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Courses</p>
                           <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{courseStats.total}</p>
                         </div>
                         <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                       </div>
                       <div className="grid grid-cols-3 gap-2 text-xs">
                         <div className="text-center">
                           <div className="text-orange-700 dark:text-orange-300 font-medium">{courseStats.inProgress}</div>
                           <div className="text-orange-600 dark:text-orange-400">In Progress</div>
                         </div>
                         <div className="text-center">
                           <div className="text-green-700 dark:text-green-300 font-medium">{courseStats.completed}</div>
                           <div className="text-green-600 dark:text-green-400">Completed</div>
                         </div>
                         <div className="text-center">
                           <div className="text-gray-700 dark:text-gray-300 font-medium">{courseStats.pending}</div>
                           <div className="text-gray-600 dark:text-gray-400">Pending</div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Skill Assignments - Second Board */}
                   <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/dashboard/skill-level?tab=my-assignments')}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between mb-3">
                         <div>
                           <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Skill Assignments</p>
                           <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{assignmentStats.total}</p>
                         </div>
                         <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                       </div>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                         <div className="text-center">
                           <div className="text-blue-700 dark:text-blue-300 font-medium">{assignmentStats.available}</div>
                           <div className="text-blue-600 dark:text-blue-400">Available</div>
                         </div>
                         <div className="text-center">
                           <div className="text-green-700 dark:text-green-300 font-medium">{assignmentStats.completed}</div>
                           <div className="text-green-600 dark:text-green-400">Completed</div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </CardContent>
            </Card>

            {canAccessStatusTracker() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Status Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Resume</p>
                            <p className="text-lg font-bold">{resumeProgress}%</p>
                          </div>
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <Progress value={resumeProgress} className="mt-3" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">LinkedIn</p>
                            <p className="text-lg font-bold">{linkedinProgress}%</p>
                          </div>
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <Progress value={linkedinProgress} className="mt-3" />
                      </CardContent>
                    </Card>

                    {isIT() && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">GitHub</p>
                              <p className="text-lg font-bold">{githubProgress}%</p>
                            </div>
                            <Github className="h-6 w-6 text-primary" />
                          </div>
                          <Progress value={githubProgress} className="mt-3" />
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Job Apps</p>
                            <p className="text-lg font-bold">{totalJobApplications}</p>
                          </div>
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Build Status - Full Width */}
            {canAccessLevelUpStatus() ? (
              <Card className="border-gradient-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Profile Build Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* First Row: Resume, LinkedIn, GitHub */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {/* Resume Status */}
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleResumeClick}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Resume Tasks</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{resumeStats.total} Total</p>
                          </div>
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 dark:text-green-400">{resumeStats.completed}</div>
                            <div className="text-blue-600 dark:text-blue-400">Complete</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600 dark:text-yellow-400">{resumeStats.inProgress}</div>
                            <div className="text-blue-600 dark:text-blue-400">In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-600 dark:text-gray-400">{resumeStats.pending}</div>
                            <div className="text-blue-600 dark:text-blue-400">Pending</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* LinkedIn Profile Tasks */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleLinkedInProfileClick}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">LinkedIn Profile</p>
                            <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{linkedinStats.total} Total</p>
                          </div>
                          <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 dark:text-green-400">{linkedinStats.completed}</div>
                            <div className="text-indigo-600 dark:text-indigo-400">Complete</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600 dark:text-yellow-400">{linkedinStats.inProgress}</div>
                            <div className="text-indigo-600 dark:text-indigo-400">In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-600 dark:text-gray-400">{linkedinStats.pending}</div>
                            <div className="text-indigo-600 dark:text-indigo-400">Pending</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* GitHub Profile Tasks */}
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGitHubProfileClick}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-medium text-green-700 dark:text-green-300">GitHub Profile</p>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">{githubStats.total} Total</p>
                          </div>
                          <Github className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 dark:text-green-400">{githubStats.completed}</div>
                            <div className="text-green-600 dark:text-green-400">Complete</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600 dark:text-yellow-400">{githubStats.inProgress}</div>
                            <div className="text-green-600 dark:text-green-400">In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-600 dark:text-gray-400">{githubStats.pending}</div>
                            <div className="text-green-600 dark:text-green-400">Pending</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Profile Build Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Profile Build Status</h3>
                    <p className="text-muted-foreground mb-4">
                      Advanced tracking available with premium subscription plans
                    </p>
                    <SubscriptionUpgrade featureName="Profile Build Status" eligiblePlans={eligiblePlans}>
                      <Button>Upgrade Plan</Button>
                    </SubscriptionUpgrade>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Status - Full Width */}
            {canAccessLevelUpStatus() ? (
              <Card className="border-gradient-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Weekly Activities Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Second Row: LinkedIn Growth, GitHub Weekly, Skill Assignments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {/* LinkedIn Growth Activities */}
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleLinkedInGrowthClick}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">LinkedIn Growth</p>
                            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{linkedinGrowthStats.activeTasks} Active</p>
                          </div>
                          <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 dark:text-green-400">{linkedinGrowthStats.completed}</div>
                            <div className="text-purple-600 dark:text-purple-400">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600 dark:text-yellow-400">{linkedinGrowthStats.inProgress}</div>
                            <div className="text-purple-600 dark:text-purple-400">In Progress</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* GitHub Weekly Tasks */}
                    <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 border-teal-200 dark:border-teal-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGitHubWeeklyClick}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-medium text-teal-700 dark:text-teal-300">GitHub Weekly</p>
                            <p className="text-lg font-bold text-teal-900 dark:text-teal-100">{githubWeeklyStats.activeTasks} Active</p>
                          </div>
                          <Github className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 dark:text-green-400">{githubWeeklyStats.completed}</div>
                            <div className="text-teal-600 dark:text-teal-400">Complete</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-600 dark:text-gray-400">{githubWeeklyStats.pending}</div>
                            <div className="text-teal-600 dark:text-teal-400">Pending</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* JobHunter Status */}
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/job-tracker')}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">JobHunter</p>
                            <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{totalJobApplications} Total</p>
                          </div>
                          <Briefcase className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 dark:text-green-400">{jobStatusCounts.applied}</div>
                            <div className="text-amber-600 dark:text-amber-400">Applied</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600 dark:text-blue-400">{jobStatusCounts.interviewing}</div>
                            <div className="text-amber-600 dark:text-amber-400">Interview</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600 dark:text-purple-400">{jobStatusCounts.accepted}</div>
                            <div className="text-amber-600 dark:text-amber-400">Accepted</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Weekly Activities Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Weekly Activities Status</h3>
                    <p className="text-muted-foreground mb-4">
                      Advanced tracking available with premium subscription plans
                    </p>
                    <SubscriptionUpgrade featureName="Weekly Activities Status" eligiblePlans={eligiblePlans}>
                      <Button>Upgrade Plan</Button>
                    </SubscriptionUpgrade>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Job Applications - Full Width */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Recent Job Applications
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewAllJobs}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentJobs && recentJobs.length > 0 ? (
                  <div className="space-y-3">
                    {recentJobs && recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleJobClick(job.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{job.job_title}</p>
                          <p className="text-sm text-muted-foreground truncate">{job.company_name}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            {job.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {formatDistanceToNow(new Date(job.created_at))} ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No job applications yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleStartJobSearch}
                    >
                      Start Job Search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Courses Section */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Recent Courses
                  </CardTitle>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/dashboard/skill-level?tab=completed-learning')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {learningGoalCourses && learningGoalCourses.length > 0 ? (
                  <RecentCoursesCard
                    courses={learningGoalCourses}
                    hasActiveSubscription={hasActiveSubscription()}
                    loading={learningCoursesLoading}
                  />
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-blue-400 mb-3" />
                    <p className="text-blue-700 dark:text-blue-300 mb-2">No enrolled courses yet</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                      Start learning by enrolling in your first course
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
                      onClick={() => navigate('/dashboard/skill-level?tab=skill-programs')}
                    >
                      Browse Courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Goals Section - Full Width */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Learning Goals
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/skill-level?tab=completed-learning')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Total Goals</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{goals?.length || 0}</p>
                        </div>
                        <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/50 dark:bg-gray-800/50 border-green-200 dark:border-green-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-300">Completed</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {goals?.filter(g => g.status === 'completed').length || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-orange-700 dark:text-orange-300">In Progress</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {goals?.filter(g => g.status === 'in_progress').length || 0}
                          </p>
                        </div>
                        <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Goals */}
                {goals && goals.length > 0 ? (
                  <div className="space-y-3">
                    {goals.slice(0, 3).map((goal) => {
                      const statusInfo = getGoalStatus(goal);
                      return (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                          onClick={() => navigate('/dashboard/skill-level?tab=completed-learning')}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate text-purple-900 dark:text-purple-100">{goal.skill_name}</p>
                            <p className="text-sm text-purple-700 dark:text-purple-300 truncate">
                              {goal.description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={goal.progress} className="flex-1 max-w-24" />
                              <span className="text-xs text-purple-600 dark:text-purple-400 min-w-fit">
                                {goal.progress}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <Badge 
                              variant={
                                statusInfo.type === 'completed' ? 'default' :
                                statusInfo.type === 'critical' || statusInfo.type === 'overdue' ? 'destructive' :
                                statusInfo.type === 'warning' ? 'secondary' : 'outline'
                              } 
                              className={
                                statusInfo.type === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                statusInfo.type === 'critical' || statusInfo.type === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                statusInfo.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }
                            >
                              {statusInfo.text}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {goal.priority}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-purple-400 mb-3" />
                    <p className="text-purple-700 dark:text-purple-300 mb-2">No learning goals yet</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
                      Set learning goals to track your skill development progress
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20"
                      onClick={() => navigate('/dashboard/skill-level?tab=completed-learning')}
                    >
                      Create First Goal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* Job Search Pricing Dialog */}
      <Dialog open={jobSearchPricingOpen} onOpenChange={setJobSearchPricingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade to Access Job Search
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Get access to powerful job search tools and find your dream job faster.
            </p>
          </DialogHeader>
          <PricingDialog />
        </DialogContent>
      </Dialog>

      {/* Job Tracker Pricing Dialog */}
      <Dialog open={jobTrackerPricingOpen} onOpenChange={setJobTrackerPricingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade to Access Job Tracker
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Get access to job tracking tools to manage your applications effectively.
            </p>
          </DialogHeader>
          <PricingDialog />
        </DialogContent>
      </Dialog>

      {/* GitHub Tracker Pricing Dialog */}
      <Dialog open={githubTrackerPricingOpen} onOpenChange={setGithubTrackerPricingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade to Access GitHub Tracker
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Get access to GitHub activity tracking tools to monitor your coding progress.
            </p>
          </DialogHeader>
          <PricingDialog />
        </DialogContent>
      </Dialog>
    </ResizableLayout>
  );
};

export default Dashboard;
