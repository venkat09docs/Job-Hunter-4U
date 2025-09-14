import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
import { useOptimizedUserPoints } from '@/hooks/useOptimizedUserPoints';
import { useOptimizedDashboardStats } from '@/hooks/useOptimizedDashboardStats';
import { useOptimizedLeaderboard } from '@/hooks/useOptimizedLeaderboard';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { useRole } from '@/hooks/useRole';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { usePaymentSocialProof } from '@/hooks/usePaymentSocialProof';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResizableLayout } from '@/components/ResizableLayout';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { User, Briefcase, Target, TrendingUp, Calendar, CreditCard, Eye, Search, Bot, Github, Clock, CheckCircle, Users, DollarSign, Trophy, Archive, FileText, Lock, BarChart3 } from 'lucide-react';
import { SubscriptionStatus, SubscriptionUpgrade, useSubscription } from '@/components/SubscriptionUpgrade';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ActivityChart from '@/components/ActivityChart';
import LeaderBoard from '@/components/LeaderBoard';
import { InstituteLeaderBoard } from '@/components/InstituteLeaderBoard';
import { VerifyActivitiesButton } from '@/components/VerifyActivitiesButton';
import { BadgeLeadersSlider } from '@/components/BadgeLeadersSlider';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';
import PricingDialog from '@/components/PricingDialog';
import { TestSocialProof } from '@/components/TestSocialProof';

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
  const { getModuleProgress, assignments } = useCareerAssignments();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading, refreshProgress: refreshGitHubProgress } = useGitHubProgress();
  const { weeklyTasks, isLoading: weeklyLoading } = useGitHubWeekly();
  const { isIT } = useUserIndustry();
  const { metrics: networkMetrics, loading: networkGrowthLoading, refreshMetrics: refreshNetworkMetrics } = useNetworkGrowthMetrics();
  
  // Social proof tracking for payments
  usePaymentSocialProof();
  
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
  const { leaderboard: optimizedLeaderboard, loading: leaderboardLoading } = useOptimizedLeaderboard();
  
  // Define eligible subscription plans for Badge Leaders and Leaderboard
  const eligiblePlans = ['One Month Plan', '3 Months Plan', '6 Months Plan', '1 Year Plan'];
  
  // Check if user has eligible subscription
  const hasEligibleSubscription = () => {
    const hasActive = hasActiveSubscription();
    const hasPlan = profile?.subscription_plan && eligiblePlans.includes(profile.subscription_plan);
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
    return ['One Month Plan'].includes(profile.subscription_plan);
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

  // Check if user can access Status Tracker (free, 1-week, 1-month plans)
  const canAccessStatusTracker = () => {
    if (isAdmin || isRecruiter) return true;
    if (!profile?.subscription_plan) return true; // Free users
    return ['One Month Plan'].includes(profile.subscription_plan);
  };

  // Check if user can access Level Up Status (3M, 6M, 1Y plans)
  const canAccessLevelUpStatus = () => {
    if (isAdmin || isRecruiter) return true;
    const hasActive = hasActiveSubscription();
    const hasPlan = profile?.subscription_plan && eligiblePlans.includes(profile.subscription_plan);
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
  if (authLoading || profileLoading || networkLoading || githubLoading || weeklyLoading || pointsLoading || statsLoading) {
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

  // Calculate progress percentages using career assignments data to sync with Profile Assignments page
  const resumeProgress = getModuleProgress('RESUME');
  const linkedinProgress = (() => {
    // Calculate LinkedIn progress from LinkedIn sub-category assignments
    if (!assignments || assignments.length === 0) return 0;
    const linkedinTasks = assignments.filter(a => {
      const templateTitle = a.career_task_templates?.title?.toLowerCase() || '';
      const templateCategory = a.career_task_templates?.category?.toLowerCase() || '';
      return templateTitle.includes('linkedin') || templateCategory.includes('linkedin');
    });
    return linkedinTasks.length > 0 
      ? Math.round((linkedinTasks.filter(t => t.status === 'verified').length / linkedinTasks.length) * 100)
      : 0;
  })();
  const githubProgress = (() => {
    // Calculate GitHub progress from GitHub sub-category assignments to match Profile Assignments page
    if (!assignments || assignments.length === 0) return 0;
    const githubTasks = assignments.filter(a => {
      const templateTitle = a.career_task_templates?.title?.toLowerCase() || '';
      const templateCategory = a.career_task_templates?.category?.toLowerCase() || '';
      // Check for GitHub-related tasks in sub-categories to match Profile Assignments calculation
      return templateTitle.includes('github') || templateCategory.includes('github') || 
             (a.career_task_templates?.sub_category_id && 
              templateTitle.includes('git') || templateCategory.includes('git'));
    });
    return githubTasks.length > 0 
      ? Math.round((githubTasks.filter(t => t.status === 'verified').length / githubTasks.length) * 100)
      : 0;
  })();
  
  console.log('🔍 Dashboard GitHub Debug:', {
    isIT: isIT(),
    industry: profile?.industry,
    githubProgress,
    githubTasks: githubTasks?.length || 0,
    githubLoading
  });

  // GitHub Weekly progress calculation
  const githubWeeklyCompleted = weeklyTasks.filter(task => 
    task.status === 'VERIFIED' || task.status === 'PARTIALLY_VERIFIED'
  ).length;
  const githubWeeklyTotal = weeklyTasks.length || 7; // Default to 7 if no tasks
  const flowCompleted = githubWeeklyCompleted;
  const flowRemaining = Math.max(0, githubWeeklyTotal - githubWeeklyCompleted);
  const weeklyTarget = githubWeeklyTotal;

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
    navigate('/dashboard/career-assignments');
  };

  const handleLinkedInClick = () => {
    navigate('/dashboard/career-assignments');
  };

  const handleGitHubClick = () => {
    navigate('/dashboard/career-assignments');
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
                CAREER LEVEL UP
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


            {/* Status Tracker and Level Up Status - Side by Side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              
              {/* Status Tracker - Only for Free, 1-month plan users */}
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

              {/* Level Up Status - Only for 3M, 6M, 1Y plan users */}
              {canAccessLevelUpStatus() ? (
                <Card className="border-gradient-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Level Up Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Resume Status */}
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleResumeClick}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Resume</p>
                              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{resumeProgress}%</p>
                            </div>
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <Progress value={resumeProgress} className="mt-3 bg-blue-200 dark:bg-blue-800" />
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {resumeProgress === 100 ? 'Complete!' : `${100 - resumeProgress}% remaining`}
                          </p>
                        </CardContent>
                      </Card>

                      {/* LinkedIn Status */}
                      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleLinkedInClick}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">LinkedIn</p>
                              <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{linkedinProgress}%</p>
                            </div>
                            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <Progress value={linkedinProgress} className="mt-3 bg-indigo-200 dark:bg-indigo-800" />
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            {linkedinProgress === 100 ? 'Optimized!' : `${Math.ceil((100 - linkedinProgress) / 11)} tasks left`}
                          </p>
                        </CardContent>
                      </Card>

                      {/* GitHub Status */}
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGitHubClick}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-green-700 dark:text-green-300">GitHub</p>
                              <p className="text-lg font-bold text-green-900 dark:text-green-100">{githubProgress}%</p>
                            </div>
                            <Github className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <Progress value={githubProgress} className="mt-3 bg-green-200 dark:bg-green-800" />
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {githubProgress === 100 ? 'Profile Ready!' : 'In Progress'}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Job Application Status */}
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleJobApplicationsClick}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Applications</p>
                              <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{totalJobApplications}</p>
                            </div>
                            <Briefcase className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="mt-3 text-xs text-orange-600 dark:text-orange-400">
                            {totalJobApplications === 0 ? 'Start applying!' : 
                             totalJobApplications < 10 ? 'Keep applying!' : 
                             'Great progress!'}
                          </div>
                        </CardContent>
                      </Card>

                      {/* LinkedIn Growth Status */}
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleLinkedInGrowthClick}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">LinkedIn Growth</p>
                              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{networkMetrics?.totalConnections || 0}</p>
                            </div>
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="mt-3 text-xs text-purple-600 dark:text-purple-400">
                            {(networkMetrics?.totalConnections || 0) < 100 ? 'Build network' : 
                             (networkMetrics?.totalConnections || 0) < 500 ? 'Growing well!' : 
                             'Strong network!'}
                          </div>
                        </CardContent>
                      </Card>

                       {/* GitHub Growth Status */}
                       <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 border-teal-200 dark:border-teal-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGitHubWeeklyClick}>
                         <CardContent className="p-4">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-xs font-medium text-teal-700 dark:text-teal-300">GitHub Weekly</p>
                               <p className="text-lg font-bold text-teal-900 dark:text-teal-100">{githubWeeklyCompleted}/{githubWeeklyTotal}</p>
                             </div>
                             <Github className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                           </div>
                           <Progress value={(githubWeeklyCompleted / githubWeeklyTotal) * 100} className="mt-3 bg-teal-200 dark:bg-teal-800" />
                           <div className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                             {githubWeeklyCompleted >= githubWeeklyTotal ? 'Weekly tasks complete!' : `${githubWeeklyTotal - githubWeeklyCompleted} tasks remaining`}
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
                      Level Up Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Level Up Status</h3>
                      <p className="text-muted-foreground mb-4">
                        Advanced tracking available with premium subscription plans
                      </p>
                      <SubscriptionUpgrade featureName="Level Up Status" eligiblePlans={eligiblePlans}>
                        <Button>Upgrade Plan</Button>
                      </SubscriptionUpgrade>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Left Column */}
              <div className="xl:col-span-2 space-y-4 lg:space-y-6">

                {/* Recent Job Applications */}
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
              </div>

              {/* Right Column */}
              <div className="space-y-4 lg:space-y-6">
                {/* Removed GitHub Activities section as requested */}
              </div>
            </div>

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
