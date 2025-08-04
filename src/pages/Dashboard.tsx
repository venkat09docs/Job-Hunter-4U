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
import { User, Briefcase, Target, TrendingUp, Calendar, CreditCard, Eye, Search, Bot, Github } from 'lucide-react';
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
  const [totalJobResultsCount, setTotalJobResultsCount] = useState(0);
  const [jobStatusCounts, setJobStatusCounts] = useState({
    wishlist: 0,
    applied: 0,
    interviewing: 0,
    negotiating: 0,
    accepted: 0
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

        // Fetch total job results count from job search history
        const { count: jobResultsCount, error: jobResultsError } = await supabase
          .from('job_results')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (jobResultsError) throw jobResultsError;
        setTotalJobResultsCount(jobResultsCount || 0);

        // Fetch job status counts
        const statusTypes = ['wishlist', 'applied', 'interviewing', 'negotiating', 'accepted'];
        const statusCounts = { wishlist: 0, applied: 0, interviewing: 0, negotiating: 0, accepted: 0 };
        
        for (const status of statusTypes) {
          const { count: statusCount, error: statusError } = await supabase
            .from('job_tracker')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', status)
            .eq('is_archived', false);

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
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Resume Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
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
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{savedCoverLettersCount}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Cover Letter</h4>
                      <p className="text-sm text-muted-foreground text-center">Saved in library</p>
                    </div>

                    {/* LinkedIn Profile Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
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
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
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
                            strokeDasharray={`${getGitHubProgress() * 2.827} ${(100 - getGitHubProgress()) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{getGitHubProgress()}%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">GitHub</h4>
                      <p className="text-sm text-muted-foreground text-center">Repository showcase</p>
                    </div>

                    {/* Blog Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{publishedBlogsCount}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">No of Blog Posts</h4>
                      <p className="text-sm text-muted-foreground text-center">Articles published</p>
                    </div>

                    {/* Job Tracker Stats */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{totalJobApplications}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Jobs In Process</h4>
                      <p className="text-sm text-muted-foreground text-center">Total applications</p>
                    </div>

                    {/* LinkedIn Network Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{networkMetrics.weeklyProgress}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">LinkedIn Network</h4>
                      <p className="text-sm text-muted-foreground text-center">Weekly activities</p>
                    </div>

                    {/* Enhancements Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
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
                    My Network Growth
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

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    No of Job Searches
                  </CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_job_searches || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Times you searched for jobs
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    No of jobs in history
                  </CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalJobResultsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Total jobs found from searches
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Job Application Status
                  </CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Wishlist</span>
                      <span className="font-medium">{jobStatusCounts.wishlist}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(jobStatusCounts.wishlist / Math.max(Object.values(jobStatusCounts).reduce((a, b) => a + b, 0), 1)) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Applied</span>
                      <span className="font-medium">{jobStatusCounts.applied}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(jobStatusCounts.applied / Math.max(Object.values(jobStatusCounts).reduce((a, b) => a + b, 0), 1)) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Interviewing</span>
                      <span className="font-medium">{jobStatusCounts.interviewing}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(jobStatusCounts.interviewing / Math.max(Object.values(jobStatusCounts).reduce((a, b) => a + b, 0), 1)) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Negotiating</span>
                      <span className="font-medium">{jobStatusCounts.negotiating}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(jobStatusCounts.negotiating / Math.max(Object.values(jobStatusCounts).reduce((a, b) => a + b, 0), 1)) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Accepted</span>
                      <span className="font-medium">{jobStatusCounts.accepted}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(jobStatusCounts.accepted / Math.max(Object.values(jobStatusCounts).reduce((a, b) => a + b, 0), 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Overview */}
            <div className="mb-8">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Activity Overview</CardTitle>
                  <CardDescription>
                    Your job search activity summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-2">{profile?.total_job_searches || 0}</div>
                      <div className="text-sm font-medium text-center">No of Job Searches</div>
                      <div className="text-xs text-muted-foreground text-center">Times you searched for jobs</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-2">{totalJobResultsCount}</div>
                      <div className="text-sm font-medium text-center">No of jobs in history</div>
                      <div className="text-xs text-muted-foreground text-center">Total jobs found from searches</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-2">{recentJobs.length}</div>
                      <div className="text-sm font-medium text-center">Recent Applications</div>
                      <div className="text-xs text-muted-foreground text-center">Latest 5 applications</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart */}
            <div className="mb-8">
              <ActivityChart analytics={analytics} />
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