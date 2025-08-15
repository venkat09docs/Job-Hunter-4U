import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { User, Briefcase, Target, TrendingUp, Calendar, CreditCard, Eye, Search, Bot, Github, Clock, CheckCircle, Users, DollarSign, Trophy, Archive } from 'lucide-react';
import { SubscriptionStatus, SubscriptionUpgrade, useSubscription } from '@/components/SubscriptionUpgrade';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ActivityChart from '@/components/ActivityChart';
import LeaderBoard from '@/components/LeaderBoard';
import { InstituteLeaderBoard } from '@/components/InstituteLeaderBoard';
import { VerifyActivitiesButton } from '@/components/VerifyActivitiesButton';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { formatDistanceToNow, startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  application_date: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { profile, analytics, loading, incrementAnalytics, hasActiveSubscription } = useProfile();
  const { isInstituteAdmin, isAdmin } = useRole();
  const { progress: resumeProgress, loading: resumeLoading } = useResumeProgress();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading, refreshProgress: refreshLinkedInProgress } = useLinkedInProgress();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading, refreshProgress: refreshGitHubProgress } = useGitHubProgress();
  
  // Get the GitHub progress percentage
  const githubProgress = getGitHubProgress();
  const { metrics: networkMetrics, loading: networkGrowthLoading, refreshMetrics: refreshNetworkMetrics } = useNetworkGrowthMetrics();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<JobEntry[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [totalJobApplications, setTotalJobApplications] = useState(0);
  const [publishedBlogsCount, setPublishedBlogsCount] = useState(0);
  const [savedCoverLettersCount, setSavedCoverLettersCount] = useState(0);
  const [savedReadmeFilesCount, setSavedReadmeFilesCount] = useState(0);
  const [totalJobResultsCount, setTotalJobResultsCount] = useState(0);
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

  // GitHub Activities tracker metrics
  const REPO_TASK_IDS = ['pinned_repos','repo_descriptions','readme_files','topics_tags','license'];
  const [repoMetrics, setRepoMetrics] = useState({ completed: 0, total: REPO_TASK_IDS.length });
  const [weeklyFlowCompleted, setWeeklyFlowCompleted] = useState(0);

  useEffect(() => {
    if (!githubTasks) return;
    const completed = githubTasks.filter(t => REPO_TASK_IDS.includes(t.task_id) && t.completed).length;
    setRepoMetrics({ completed, total: REPO_TASK_IDS.length });
  }, [githubTasks]);

  const refreshWeeklyFlow = async () => {
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
  };

  useEffect(() => {
    refreshWeeklyFlow();
  }, [user]);

  const WEEKLY_TARGET = 3;
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

  // Fetch recent job applications and total count
  const fetchJobData = async () => {
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
        .not('status', 'in', '("wishlist","not_selected","no_response","archived")');

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
      console.error('Error fetching data:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [user]);

  // Fetch current week day-wise network activity totals
  const fetchWeeklyDailyBreakdown = async () => {
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
  };

  useEffect(() => {
    fetchWeeklyDailyBreakdown();
  }, [user]);

  // Calculate overall career development score based on the three core tasks
  const getOverallCareerScore = () => {
    const scores = [resumeProgress, linkedinProgress, getGitHubProgress()];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Listen for real-time updates from Career Growth page and Job Tracker
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('dashboard-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_progress_snapshots',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh all progress data when daily snapshots are updated
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
            // Refresh job data when job tracker is updated
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
            // Refresh network metrics when LinkedIn network activities are updated
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
            // Refresh GitHub daily flow weekly completions when sessions change
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
            // Refresh GitHub profile setup progress when github_progress updates
            refreshGitHubProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, refreshLinkedInProgress, refreshGitHubProgress, refreshNetworkMetrics, fetchWeeklyDailyBreakdown]);

  const handleJobClick = (jobId: string) => {
    navigate('/dashboard/job-tracker');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'interviewing':
      case 'interview':
        return 'default';
      case 'applied':
      case 'applying':
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger />
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Job Hunter Pro
                </h1>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex">
                  <SubscriptionStatus />
                </div>
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'User'}!
              </h2>
              <p className="text-muted-foreground">
                Here's your personalized dashboard. Track your progress and manage your job search.
              </p>
            </div>

            {/* Activity Verification (Admin Only) */}
            <div className="mb-8">
              <VerifyActivitiesButton />
            </div>

            {/* Leader Board */}
            <div className="mb-8">
              {(() => {
                console.log('Dashboard LeaderBoard condition check:', { isInstituteAdmin, isAdmin, condition: isInstituteAdmin && !isAdmin });
                return null;
              })()}
              {isInstituteAdmin && !isAdmin ? (
                <>
                  <div className="mb-2 text-sm text-green-600 font-medium">
                    ✅ Institute Admin Detected - Loading Institute Leaderboards
                  </div>
                  <InstituteLeaderBoard />
                </>
              ) : (
                <>
                  <div className="mb-2 text-sm text-blue-600 font-medium">
                    ℹ️ Loading General Leaderboards (Role: {isAdmin ? 'Super Admin' : isInstituteAdmin ? 'Institute Admin (but condition failed)' : 'Regular User'})
                  </div>
                  <LeaderBoard />
                </>
              )}
            </div>

            {/* Overall Career Development Score */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch min-h-[200px]">
                    {/* Profile Picture Section - Full width on mobile, 1/3rd on desktop */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 sm:p-6">
                      <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                        <AvatarImage src={profile?.profile_image_url} alt={profile?.full_name || profile?.username || 'User'} />
                        <AvatarFallback className="text-2xl sm:text-3xl">
                          {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center mt-4">
                        <p className="font-semibold text-base sm:text-lg">{profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'}</p>
                        <p className="text-sm text-muted-foreground">Career Professional</p>
                      </div>
                    </div>
                    
                    {/* Right Side - Header + 4 Boards - Full width on mobile, 2/3rd on desktop */}
                    <div className="lg:col-span-2 flex flex-col justify-center space-y-4 sm:space-y-6">
                      {/* Header Section */}
                      <div className="text-center lg:text-left">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2">Status Tracker</h3>
                      </div>
                      
                      {/* 4 Boards Section */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* Profile Status */}
                        <div 
                          className="flex flex-col items-center p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate('/dashboard/build-my-profile')}
                        >
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="hsl(var(--muted))"
                                strokeWidth="8"
                                fill="none"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="hsl(var(--primary))"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${getOverallCareerScore() * 2.827} ${(100 - getOverallCareerScore()) * 2.827}`}
                                className="transition-all duration-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs sm:text-sm font-bold text-primary">{getOverallCareerScore()}%</span>
                            </div>
                          </div>
                          <h4 className="font-medium text-center text-xs sm:text-sm">Profile Status</h4>
                          <p className="text-xs text-muted-foreground text-center hidden sm:block">Overall percentage</p>
                        </div>

                        {/* Job Application Status */}
                        <div 
                          className="flex flex-col items-center p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate('/dashboard/job-tracker')}
                        >
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                               <span className="text-base sm:text-lg font-bold text-primary">
                                 {totalJobApplications}
                               </span>
                            </div>
                          </div>
                          <h4 className="font-medium text-center text-xs sm:text-sm">Job Applications</h4>
                          <p className="text-xs text-muted-foreground text-center hidden sm:block">In pipeline</p>
                        </div>

                        {/* Network Growth */}
                        <div 
                          className="flex flex-col items-center p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}
                        >
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-base sm:text-lg font-bold text-primary">{networkMetrics.weeklyProgress || 0}</span>
                            </div>
                          </div>
                          <h4 className="font-medium text-center text-xs sm:text-sm">Network Growth</h4>
                          <p className="text-xs text-muted-foreground text-center hidden sm:block">This week activities</p>
                        </div>

                        {/* GitHub Activities */}
                        <div 
                          className="flex flex-col items-center p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate('/dashboard/career-growth-activities?tab=skill&gitTab=repo')}
                        >
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-base sm:text-lg font-bold text-primary">{repoPercent}%</span>
                            </div>
                          </div>
                          <h4 className="font-medium text-center text-xs sm:text-sm">GitHub Status</h4>
                          <p className="text-xs text-muted-foreground text-center hidden sm:block">Repository tasks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Profile Status */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      My Profile Status
                    </CardTitle>
                    <CardDescription>
                      Track your progress across all career development areas
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => navigate('/dashboard/build-my-profile')}
                    className="bg-gradient-primary hover:bg-gradient-primary/90"
                  >
                    Build My Profile
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Resume Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/resume-builder')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="hsl(var(--primary))"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${resumeProgress * 2.827} ${(100 - resumeProgress) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{resumeProgress}%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Resume</h4>
                      <p className="text-sm text-muted-foreground text-center">Document completed</p>
                    </div>

                    {/* Cover Letter Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/resume-builder', { state: { activeTab: 'cover-letter' } })}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{savedCoverLettersCount}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Cover Letter</h4>
                      <p className="text-sm text-muted-foreground text-center">Saved in library</p>
                    </div>

                    {/* LinkedIn Profile Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/linkedin-optimization')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="hsl(var(--primary))"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${linkedinProgress * 2.827} ${(100 - linkedinProgress) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{linkedinProgress}%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">LinkedIn Profile</h4>
                      <p className="text-sm text-muted-foreground text-center">Profile optimization</p>
                    </div>

                    {/* GitHub Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/github-optimization')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="hsl(var(--border))"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="hsl(var(--primary))"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${githubProgress * 2.827} ${(100 - githubProgress) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{githubProgress}%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">GitHub</h4>
                      <p className="text-sm text-muted-foreground text-center">Profile setup progress</p>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Network Growth */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    My Network Growth Tracker
                  </CardTitle>
                  <CardDescription>
                    Track your LinkedIn networking activities and overall growth
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {networkGrowthLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="text-center p-4 rounded-lg border bg-card animate-pulse">
                          <div className="h-8 bg-muted rounded mb-2"></div>
                          <div className="h-4 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}>
                          <div className="text-2xl font-bold text-primary">{networkMetrics.totalConnections}</div>
                          <div className="text-sm text-muted-foreground">Total Connections</div>
                        </div>
                        <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}>
                          <div className="text-2xl font-bold text-primary">{networkMetrics.totalLikes}</div>
                          <div className="text-sm text-muted-foreground">Posts Liked</div>
                        </div>
                        <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}>
                          <div className="text-2xl font-bold text-primary">{networkMetrics.totalComments}</div>
                          <div className="text-sm text-muted-foreground">Comments Made</div>
                        </div>
                        <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}>
                          <div className="text-2xl font-bold text-primary">{networkMetrics.totalPosts}</div>
                          <div className="text-sm text-muted-foreground">Posts Created</div>
                        </div>
                        <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                             onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}>
                          <div className="text-2xl font-bold text-primary">{networkMetrics.weeklyProgress}</div>
                          <div className="text-sm text-muted-foreground">Weekly Activity</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Day-wise Total Activities</div>
                        <div style={{ width: '100%', height: 300 }}>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <Tooltip />
                              <Bar dataKey="total" name="Total Activities" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* GitHub Activities Tracker */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Github className="h-5 w-5 text-primary" />
                    GitHub Activities Tracker
                  </CardTitle>
                  <CardDescription>
                    Combined status from GitHub Activity Tracker and Activity & Engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium mb-2">Repository Setup Progress</div>
                      <div className="w-full" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { name: 'Repo Completed', value: repoCompleted, color: 'hsl(var(--chart-accepted))' },
                              { name: 'Repo Pending', value: repoPending, color: 'hsl(var(--chart-not-selected))' },
                            ]}
                            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" interval={0} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickMargin={8} />
                            <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                              {[
                                { name: 'Repo Completed', color: 'hsl(var(--chart-accepted))' },
                                { name: 'Repo Pending', color: 'hsl(var(--chart-not-selected))' },
                              ].map((entry, index) => (
                                <Cell
                                  key={`repo-cell-${index}`}
                                  fill={entry.color}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate('/dashboard/career-growth-activities?tab=skill&gitTab=repo')}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Weekly Flow (Mon–Sun)</div>
                      <div className="w-full" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { name: 'Flow Completed', value: flowCompleted, color: 'hsl(var(--chart-applied))' },
                              { name: 'Flow Remaining', value: flowRemaining, color: 'hsl(var(--chart-no-response))' },
                            ]}
                            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" interval={0} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickMargin={8} />
                            <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                              {[
                                { name: 'Flow Completed', color: 'hsl(var(--chart-applied))' },
                                { name: 'Flow Remaining', color: 'hsl(var(--chart-no-response))' },
                              ].map((entry, index) => (
                                <Cell
                                  key={`flow-cell-${index}`}
                                  fill={entry.color}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate('/dashboard/career-growth-activities?tab=skill&gitTab=engagement')}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Job Application Status */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Job Application Status
                  </CardTitle>
                  <CardDescription>
                    Track your job applications across different pipeline stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="text-center p-4 rounded-lg border bg-card animate-pulse">
                          <div className="h-8 bg-muted rounded mb-2"></div>
                          <div className="h-4 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full" style={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={jobStatusData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" interval={0} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickMargin={8} />
                          <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Applications" radius={[4,4,0,0]}>
                            {jobStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/job-tracker')} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Job Application Statistics */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Job Application Statistics
                  </CardTitle>
                  <CardDescription>
                    View your job search activity and results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                         onClick={() => navigate('/dashboard/find-your-next-role')}>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {profile?.total_job_searches || 0}
                        </div>
                        <h4 className="font-medium">No of Job Searches</h4>
                        <p className="text-sm text-muted-foreground">
                          Total "Find Your Next Role" clicks
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                         onClick={() => navigate('/dashboard/job-search')}>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Briefcase className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {totalJobResultsCount}
                        </div>
                        <h4 className="font-medium">No of Jobs in History</h4>
                        <p className="text-sm text-muted-foreground">
                          Total jobs found in search history
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* Recent Applications */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Your latest job application submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-48"></div>
                          <div className="h-3 bg-muted rounded w-32"></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-6 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recentJobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleJobClick(job.id)}
                      >
                        <div>
                          <h4 className="font-medium">{job.job_title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            {job.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No job applications yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/dashboard/job-tracker')}
                    >
                      Start tracking your applications
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;