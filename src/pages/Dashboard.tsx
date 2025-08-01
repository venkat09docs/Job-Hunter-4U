import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { User, Briefcase, Target, TrendingUp, Calendar, CreditCard, Eye, Search, Bot } from 'lucide-react';
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
  const { progress: resumeProgress } = useResumeProgress();
  const { completionPercentage: linkedinProgress } = useLinkedInProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<JobEntry[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

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

  // Fetch recent job applications
  useEffect(() => {
    const fetchRecentJobs = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('job_tracker')
          .select('id, company_name, job_title, status, application_date, created_at')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentJobs(data || []);
      } catch (error) {
        console.error('Error fetching recent jobs:', error);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchRecentJobs();
  }, [user]);

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

  if (loading) {
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
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    My Profile Status
                  </CardTitle>
                  <CardDescription>
                    Track your progress across all career development areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Resume & Cover Letter Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
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
                      <h4 className="font-medium text-center">Resume & Cover Letter</h4>
                      <p className="text-sm text-muted-foreground text-center">Documents completed</p>
                    </div>

                    {/* LinkedIn Profile Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
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

                    {/* GitHub & Blog Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
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
                            strokeDasharray={`${40 * 2.827} ${(100 - 40) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">40%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">GitHub & Blog</h4>
                      <p className="text-sm text-muted-foreground text-center">Technical showcase</p>
                    </div>

                    {/* Job Search Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
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
                            strokeDasharray={`${75 * 2.827} ${(100 - 75) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">75%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Job Search</h4>
                      <p className="text-sm text-muted-foreground text-center">Applications submitted</p>
                    </div>

                    {/* LinkedIn Network Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
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
                            strokeDasharray={`${30 * 2.827} ${(100 - 30) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">30%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">LinkedIn Network</h4>
                      <p className="text-sm text-muted-foreground text-center">Professional connections</p>
                    </div>

                    {/* Enhancements Status */}
                    <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
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
                            strokeDasharray={`${50 * 2.827} ${(100 - 50) * 2.827}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">50%</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-center">Enhancements</h4>
                      <p className="text-sm text-muted-foreground text-center">Continuous improvement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Section */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Subscription Status</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        Access all premium features with your active subscription
                      </p>
                      <SubscriptionStatus />
                    </div>
                    <SubscriptionUpgrade featureName="premium features">
                      <Button 
                        variant="premium" 
                        size="sm"
                        className="gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        {hasActiveSubscription() ? 'Manage Plan' : 'View Plans'}
                      </Button>
                    </SubscriptionUpgrade>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Resume Opens
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_resume_opens || 0}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Times your resume was viewed
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDemoAction('resume_open')}
                  >
                    Demo: Track Resume View
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Job Searches
                  </CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_job_searches || 0}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Searches performed
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDemoAction('job_search')}
                  >
                    Demo: Track Job Search
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    AI Queries
                  </CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_ai_queries || 0}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI assistance requests
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDemoAction('ai_query')}
                  >
                    Demo: Track AI Query
                  </Button>
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