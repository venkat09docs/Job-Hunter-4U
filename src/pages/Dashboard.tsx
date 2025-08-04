import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
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
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

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
  const { progress: resumeProgress, loading: resumeLoading } = useResumeProgress();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading, refreshProgress: refreshLinkedInProgress } = useLinkedInProgress();
  const { completionPercentage: networkProgress, loading: networkLoading, refreshProgress: refreshNetworkProgress } = useLinkedInNetworkProgress();
  const { getCompletionPercentage: getGitHubProgress, loading: githubLoading, refreshProgress: refreshGitHubProgress } = useGitHubProgress();
  const { metrics: networkMetrics, loading: networkGrowthLoading } = useNetworkGrowthMetrics();
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
  useEffect(() => {
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

        // Fetch total job applications (excluding wishlist)
        const { count, error: countError } = await supabase
          .from('job_tracker')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .neq('status', 'wishlist');

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

    fetchJobData();
  }, [user]);

  // Calculate overall career development score
  const getOverallCareerScore = () => {
    const scores = [resumeProgress, linkedinProgress, getGitHubProgress(), networkProgress];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Listen for real-time updates from Career Growth page
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('dashboard-progress-sync')
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
            refreshNetworkProgress();
            refreshGitHubProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, refreshLinkedInProgress, refreshNetworkProgress, refreshGitHubProgress]);

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
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Job Hunter Pro
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <SubscriptionStatus />
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.username || profile?.full_name || 'Job Hunter'}!
              </h2>
              <p className="text-muted-foreground">
                Here's your personalized dashboard. Track your progress and manage your job search.
              </p>
            </div>

            {/* Overall Career Development Score */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Overall Career Development Score
                  </CardTitle>
                  <CardDescription>
                    Your comprehensive career readiness assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Profile Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/build-my-profile')}
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
                            strokeDasharray={`${getOverallCareerScore() * 2.827} ${(100 - getOverallCareerScore()) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{getOverallCareerScore()}%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Profile Status</h4>
                      <p className="text-sm text-muted-foreground text-center">Overall percentage</p>
                    </div>

                    {/* Job Application Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/job-tracker')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {jobStatusCounts.applied + jobStatusCounts.interviewing + jobStatusCounts.negotiating}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Job Application Status</h4>
                      <p className="text-sm text-muted-foreground text-center">In pipeline</p>
                    </div>

                    {/* Network Growth */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/linkedin-network')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{networkMetrics.weeklyProgress || 0}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Network Growth</h4>
                      <p className="text-sm text-muted-foreground text-center">This week activities</p>
                    </div>

                    {/* GitHub Activities */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/github-activity-tracker')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{getGitHubProgress()}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">GitHub Activities</h4>
                      <p className="text-sm text-muted-foreground text-center">This week activities</p>
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{savedReadmeFilesCount}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">GitHub</h4>
                      <p className="text-sm text-muted-foreground text-center">
                        {savedReadmeFilesCount} README files saved
                      </p>
                    </div>

                    {/* Blog Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/blog')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{publishedBlogsCount}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">No of Blog Posts</h4>
                      <p className="text-sm text-muted-foreground text-center">Articles published</p>
                    </div>

                    {/* Job Tracker Stats */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate('/dashboard/job-tracker')}
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{totalJobApplications}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Jobs In Process</h4>
                      <p className="text-sm text-muted-foreground text-center">Total applications</p>
                    </div>


                    {/* Enhancements Status */}
                    <div 
                      className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        console.log('Overall Progress clicked - navigating to /dashboard/career-growth');
                        navigate('/dashboard/career-growth');
                      }}
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
                            strokeDasharray={`${getOverallCareerScore() * 2.827} ${(100 - getOverallCareerScore()) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{getOverallCareerScore()}%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Overall Progress</h4>
                      <p className="text-sm text-muted-foreground text-center">Career development score</p>
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/linkedin-network')}>
                        <div className="text-2xl font-bold text-blue-500">{networkMetrics.totalConnections}</div>
                        <div className="text-sm text-muted-foreground">Total Connections</div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/linkedin-network')}>
                        <div className="text-2xl font-bold text-rose-500">{networkMetrics.totalLikes}</div>
                        <div className="text-sm text-muted-foreground">Posts Liked</div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/linkedin-network')}>
                        <div className="text-2xl font-bold text-purple-500">{networkMetrics.totalComments}</div>
                        <div className="text-sm text-muted-foreground">Comments Made</div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/linkedin-network')}>
                        <div className="text-2xl font-bold text-green-500">{networkMetrics.totalPosts}</div>
                        <div className="text-sm text-muted-foreground">Posts Created</div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/linkedin-network')}>
                        <div className="text-2xl font-bold text-orange-500">{networkMetrics.weeklyProgress}</div>
                        <div className="text-sm text-muted-foreground">Weekly Activity</div>
                      </div>
                    </div>
                  )}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-4">
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="h-4 lg:h-6 w-4 lg:w-6 text-orange-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-orange-500">{jobStatusCounts.wishlist}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Wishlist</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Search className="h-4 lg:h-6 w-4 lg:w-6 text-blue-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-blue-500">{jobStatusCounts.applied}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Applied</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Users className="h-4 lg:h-6 w-4 lg:w-6 text-purple-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-purple-500">{jobStatusCounts.interviewing}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Interviewing</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="h-4 lg:h-6 w-4 lg:w-6 text-green-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-green-500">{jobStatusCounts.negotiating}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Negotiating</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Trophy className="h-4 lg:h-6 w-4 lg:w-6 text-emerald-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-emerald-500">{jobStatusCounts.accepted}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Accepted</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Users className="h-4 lg:h-6 w-4 lg:w-6 text-red-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-red-500">{jobStatusCounts.not_selected}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Not Selected</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="h-4 lg:h-6 w-4 lg:w-6 text-slate-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-slate-500">{jobStatusCounts.no_response}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">No Response</div>
                      </div>
                      
                      <div className="text-center p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                           onClick={() => navigate('/dashboard/job-tracker')}>
                        <div className="flex items-center justify-center mb-2">
                          <Archive className="h-4 lg:h-6 w-4 lg:w-6 text-gray-500" />
                        </div>
                        <div className="text-lg lg:text-2xl font-bold text-gray-500">{jobStatusCounts.archived}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground">Archived</div>
                      </div>
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