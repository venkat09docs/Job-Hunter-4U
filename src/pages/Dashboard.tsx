import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useRole } from '@/hooks/useRole';
import { useUserIndustry } from '@/hooks/useUserIndustry';
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
  
  // ALL HOOKS MUST BE CALLED FIRST - UNCONDITIONALLY AND IN SAME ORDER EVERY TIME
  const { user, signOut, hasLoggedOut } = useAuth();
  const { profile, analytics, loading, incrementAnalytics, hasActiveSubscription } = useProfile();
  const { isInstituteAdmin, isAdmin, isRecruiter } = useRole();
  
  // Define eligible subscription plans for Badge Leaders and Leaderboard
  const eligiblePlans = ['3 Months Plan', '6 Months Plan', '1 Year Plan'];
  
  // Check if user has eligible subscription
  const hasEligibleSubscription = () => {
    const hasActive = hasActiveSubscription();
    const hasPlan = profile?.subscription_plan && eligiblePlans.includes(profile.subscription_plan);
    console.log('🔍 Badge Leaders eligibility check:', {
      hasActiveSubscription: hasActive,
      currentPlan: profile?.subscription_plan,
      eligiblePlans,
      hasPlan,
      canAccess: hasActive && hasPlan,
      isAdmin,
      isRecruiter,
      finalAccess: isAdmin || isRecruiter || (hasActive && hasPlan)
    });
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
    return ['One Week Plan', 'One Month Plan'].includes(profile.subscription_plan);
  };

  // Check if user has no active subscription (not admin or recruiter)
  const hasNoActiveSubscription = () => {
    if (isAdmin || isRecruiter) return false;
    return !hasActiveSubscription();
  };

  // All available subscription plans for upgrade dialog
  const allSubscriptionPlans = ['One Week Plan', 'One Month Plan', '3 Months Plan', '6 Months Plan', '1 Year Plan'];
  const { progress: resumeProgress, loading: resumeLoading } = useResumeProgress();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading, refreshProgress: refreshLinkedInProgress } = useLinkedInProgress();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading, refreshProgress: refreshGitHubProgress } = useGitHubProgress();
  const { isIT } = useUserIndustry();
  const { metrics: networkMetrics, loading: networkGrowthLoading, refreshMetrics: refreshNetworkMetrics } = useNetworkGrowthMetrics();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // All useState hooks - MUST be called unconditionally
  const [recentJobs, setRecentJobs] = useState<JobEntry[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [totalJobApplications, setTotalJobApplications] = useState(0);
  const [publishedBlogsCount, setPublishedBlogsCount] = useState(0);
  const [savedCoverLettersCount, setSavedCoverLettersCount] = useState(0);
  const [savedReadmeFilesCount, setSavedReadmeFilesCount] = useState(0);
  const [totalJobResultsCount, setTotalJobResultsCount] = useState(0);
  const [jobSearchPricingOpen, setJobSearchPricingOpen] = useState(false);
  const [jobTrackerPricingOpen, setJobTrackerPricingOpen] = useState(false);
  const [jobStatusCounts, setJobStatusCounts] = useState({
    wishlist: 0,
    applied: 0,
    interviewing: 0,
    negotiating: 0,
    accepted: 0,
    not_selected: 0,
    no_response: 0,
    archived: 0
  });
  const [weeklyDailyBreakdown, setWeeklyDailyBreakdown] = useState<Record<string, Record<string, number>>>({});
  const [repoMetrics, setRepoMetrics] = useState({ completed: 0, total: REPO_TASK_IDS.length });
  const [weeklyFlowCompleted, setWeeklyFlowCompleted] = useState(0);
  
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
    if (!user) return;
    
    try {
      // Fetch recent jobs
      const { data: recentData, error: recentError } = await supabase
        .from('job_tracker')
        .select('id, company_name, job_title, status, application_date, created_at')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentJobs(recentData || []);

      // Fetch total job applications in process (excluding wishlist and final statuses)
      const { count, error: countError } = await supabase
        .from('job_tracker')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .not('status', 'in', '(\\\"wishlist\\\",\\\"not_selected\\\",\\\"no_response\\\",\\\"archived\\\")');

      if (countError) throw countError;
      setTotalJobApplications(count || 0);

      // Fetch published blogs count
      const { count: blogsCount, error: blogsError } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_public', true);

      if (blogsError) throw blogsError;
      setPublishedBlogsCount(blogsCount || 0);

      // Fetch saved cover letters count
      const { count: coverLettersCount, error: coverLettersError } = await supabase
        .from('saved_cover_letters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (coverLettersError) throw coverLettersError;
      setSavedCoverLettersCount(coverLettersCount || 0);

      // Fetch saved README files count
      const { count: readmeFilesCount, error: readmeFilesError } = await supabase
        .from('saved_readme_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (readmeFilesError) throw readmeFilesError;
      setSavedReadmeFilesCount(readmeFilesCount || 0);

      // Fetch total job results count from job search history
      const { count: jobResultsCount, error: jobResultsError } = await supabase
        .from('job_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (jobResultsError) throw jobResultsError;
      setTotalJobResultsCount(jobResultsCount || 0);

      // Fetch job status counts
      const statusTypes = ['wishlist', 'applied', 'interviewing', 'negotiating', 'accepted', 'not_selected', 'no_response', 'archived'];
      const statusCounts = { 
        wishlist: 0, 
        applied: 0, 
        interviewing: 0, 
        negotiating: 0, 
        accepted: 0,
        not_selected: 0,
        no_response: 0,
        archived: 0
      };
      
      for (const status of statusTypes) {
        const { count: statusCount, error: statusError } = await supabase
          .from('job_tracker')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', status)
          .eq('is_archived', status === 'archived');

        if (statusError) throw statusError;
        statusCounts[status as keyof typeof statusCounts] = statusCount || 0;
      }
      
      setJobStatusCounts(statusCounts);
    } catch (error) {
      // Error fetching data
    } finally {
      setJobsLoading(false);
    }
  }, [user]);

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

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  useEffect(() => {
    fetchWeeklyDailyBreakdown();
  }, [fetchWeeklyDailyBreakdown]);

  useEffect(() => {
    console.log('🔍 Dashboard: Setting up real-time subscriptions');
    if (!user) return;

    const channel = supabase
      .channel('dashboard-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Profile updated, refreshing...', payload);
          // Refresh profile data when subscription changes
          fetchJobData();
          refreshLinkedInProgress();
          refreshGitHubProgress();
          refreshNetworkMetrics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_progress_snapshots',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshLinkedInProgress();
          refreshGitHubProgress();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_tracker',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchJobData();
        }
      )
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
  }, [user?.id, refreshLinkedInProgress, refreshGitHubProgress, refreshNetworkMetrics, fetchWeeklyDailyBreakdown, fetchJobData, refreshWeeklyFlow]);

  // Early redirect for recruiters to their specific dashboard
  useEffect(() => {
    if (!loading && user && !hasLoggedOut && isRecruiter && !isAdmin && !isInstituteAdmin) {
      navigate('/recruiter');
    }
  }, [user, loading, hasLoggedOut, navigate, isRecruiter, isAdmin, isInstituteAdmin]);

  // AFTER ALL HOOKS - Now safe to do conditional rendering
  console.log('Dashboard: user =', user);
  console.log('Dashboard: profile =', profile);
  console.log('Dashboard: loading =', loading);
  
  // Check loading states IMMEDIATELY after all hooks are called, before any other logic
  if (loading || resumeLoading || linkedinLoading || networkLoading || githubLoading) {
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
  
  if (loading) {
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
  
  if (!user) {
    console.log('Dashboard: No user, redirecting to auth...');
    navigate('/auth');
    return null;
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

  // GitHub Activities tracker metrics
  const githubProgress = isIT() ? getGitHubProgress() : 0;
  console.log('🔍 Dashboard GitHub Debug:', {
    isIT: isIT(),
    industry: profile?.industry,
    githubProgress,
    githubTasks: githubTasks?.length || 0,
    githubLoading
  });

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
  const flowCompleted = weeklyFlowCompleted;
  const flowRemaining = Math.max(0, WEEKLY_TARGET - flowCompleted);

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
      navigate('/dashboard/job-search');
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
                JOB HUNTER 4U
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
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
                      Available with 3 Months, 6 Months, or 1 Year plans
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
                      Available with 3 Months, 6 Months, or 1 Year plans
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


            {/* Status Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                  <Card>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resume</p>
                          <p className="text-lg sm:text-2xl font-bold">{resumeProgress}%</p>
                        </div>
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <Progress value={resumeProgress} className="mt-3" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">LinkedIn</p>
                          <p className="text-lg sm:text-2xl font-bold">{linkedinProgress}%</p>
                        </div>
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <Progress value={linkedinProgress} className="mt-3" />
                    </CardContent>
                  </Card>

                  {isIT() && (
                    <Card>
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">GitHub</p>
                            <p className="text-lg sm:text-2xl font-bold">{githubProgress}%</p>
                          </div>
                          <Github className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <Progress value={githubProgress} className="mt-3" />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Job Apps</p>
                          <p className="text-lg sm:text-2xl font-bold">{totalJobApplications}</p>
                        </div>
                        <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Left Column */}
              <div className="xl:col-span-2 space-y-4 lg:space-y-6">

                {/* Recent Job Applications */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
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
                    ) : recentJobs.length > 0 ? (
                      <div className="space-y-3">
                        {recentJobs.map((job) => (
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
                {/* GitHub Activities Card */}
                {isIT() && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        GitHub Activities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Profile Setup</span>
                          <span className="text-sm text-muted-foreground">{repoCompleted}/{repoMetrics.total}</span>
                        </div>
                        <Progress value={repoPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {repoPending} tasks remaining
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Weekly Flow</span>
                          <span className="text-sm text-muted-foreground">{flowCompleted}/{WEEKLY_TARGET}</span>
                        </div>
                        <Progress value={(flowCompleted / WEEKLY_TARGET) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {flowRemaining > 0 ? `${flowRemaining} sessions remaining` : 'Weekly target met! 🎉'}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/dashboard/github-activity-tracker')}
                      >
                        View GitHub Tracker
                      </Button>
                    </CardContent>
                  </Card>
                )}

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
    </ResizableLayout>
  );
};

export default Dashboard;
