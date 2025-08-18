import { useLinkedInProgressPoints } from '@/hooks/useLinkedInProgressPoints';
import { useGitHubProgressPoints } from '@/hooks/useGitHubProgressPoints';
import { useResumeProgressPoints } from '@/hooks/useResumeProgressPoints';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { User, Briefcase, Target, TrendingUp, Calendar, CreditCard, Eye, Search, Bot, Github, ExternalLink, CheckCircle, Circle } from 'lucide-react';
import { SubscriptionStatus, SubscriptionUpgrade, useSubscription } from '@/components/SubscriptionUpgrade';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  application_date: string;
  created_at: string;
}

const BuildMyProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, analytics, loading, incrementAnalytics, hasActiveSubscription } = useProfile();
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const { progress: resumeProgress, loading: resumeLoading } = useResumeProgress();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading, refreshProgress: refreshLinkedInProgress } = useLinkedInProgress();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { getCompletionPercentage: getGitHubProgress, loading: githubLoading, refreshProgress: refreshGitHubProgress } = useGitHubProgress();
  const { isIT } = useUserIndustry();
  
  // Integrate profile building points hooks for automatic point awarding
  const { linkedInProgress: linkedInProgressPoints } = useLinkedInProgressPoints(profile);
  const { gitHubProgress: gitHubProgressPoints } = useGitHubProgressPoints({
    github_url: profile?.github_url,
    full_name: profile?.full_name,
    bio: profile?.bio_link_url, // Use bio_link_url instead of bio
    profile_image_url: profile?.profile_image_url,
    hasRepositories: true // This can be enhanced to check actual GitHub data
  });
  const { resumeProgress: resumeProgressPoints } = useResumeProgressPoints(null); // Will need resume data here
  
  const { metrics: networkMetrics, loading: networkGrowthLoading } = useNetworkGrowthMetrics();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [publishedBlogsCount, setPublishedBlogsCount] = useState(0);
  const [savedCoverLettersCount, setSavedCoverLettersCount] = useState(0);

  // Fetch published blogs and cover letters count
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      try {
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
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, [user]);


  // Calculate overall career development score based on the three core tasks
  const getOverallCareerScore = () => {
    const scores = [resumeProgress, linkedinProgress, getGitHubProgress()];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Profile building tasks with progress tracking
  const allProfileTasks = [
    {
      id: 'digital-portfolio',
      title: 'Digital Portfolio',
      description: 'Build a professional online presence with a custom digital portfolio and bio link page. Essential for showcasing your skills, projects, and achievements to potential employers and clients.',
      progress: 0, // No progress calculation needed
      isCompleted: false, // Always shows as action item
      action: () => navigate('/dashboard/digital-portfolio'),
      category: 'Digital Profile',
      isEducational: true,
      sampleLinks: [
        { label: 'Digital Profile Example', url: 'https://venkatgollamudi.com/' },
        { label: 'Bio Link Example', url: 'https://venkatgollamudi.com/bio' }
      ]
    },
    {
      id: 'resume',
      title: 'Complete Resume',
      description: 'Build your professional resume with all sections',
      progress: resumeProgress,
      isCompleted: resumeProgress === 100,
      action: () => navigate('/dashboard/resume-builder?tab=resume'),
      category: 'Documents'
    },
    {
      id: 'cover-letter',
      title: 'Create Cover Letters',
      description: 'Save multiple cover letter templates',
      progress: savedCoverLettersCount,
      isCompleted: savedCoverLettersCount > 0,
      action: () => navigate('/dashboard/resume-builder?tab=cover-letter'),
      category: 'Documents'
    },
    {
      id: 'linkedin',
      title: 'Optimize LinkedIn Profile',
      description: 'Complete all LinkedIn optimization tasks',
      progress: linkedinProgress,
      isCompleted: linkedinProgress === 100,
      action: () => navigate('/dashboard/linkedin-optimization'),
      category: 'Social Presence'
    },
    {
      id: 'github',
      title: 'Setup GitHub Portfolio',
      description: 'Showcase your repositories and projects',
      progress: getGitHubProgress(),
      isCompleted: getGitHubProgress() === 100,
      action: () => navigate('/dashboard/github-optimization?tab=setup'),
      category: 'Social Presence'
    },
  ];

  // Filter tasks based on user industry - hide GitHub for Non-IT users
  const profileTasks = allProfileTasks.filter(task => {
    if (task.id === 'github' && !isIT()) {
      return false;
    }
    return true;
  });

  // Group tasks by category
  const tasksByCategory = profileTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, typeof profileTasks>);

  if (loading || resumeLoading || linkedinLoading || networkLoading || githubLoading || premiumLoading) {
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

  // Check premium access
  if (!canAccessFeature('build_my_profile')) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-hero">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <header className="border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
                  <SidebarTrigger />
                  <h1 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                    Build My Profile
                  </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                  <div className="hidden sm:flex">
                    <SubscriptionStatus />
                  </div>
                  <UserProfileDropdown />
                </div>
              </div>
            </header>
            <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto flex items-center justify-center">
              <SubscriptionUpgrade featureName="build_my_profile">
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Premium Feature</CardTitle>
                    <CardDescription>
                      Build My Profile is a premium feature. Upgrade your plan to access this functionality.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Upgrade Now</Button>
                  </CardContent>
                </Card>
              </SubscriptionUpgrade>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
                <SidebarTrigger />
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                  Build My Profile
                </h1>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                <div className="hidden sm:flex">
                  <SubscriptionStatus />
                </div>
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
            {/* Overall Progress */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Overall Profile Progress
                  </CardTitle>
                  <CardDescription>
                    Your complete career profile development score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
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
                        <span className="text-xl font-bold text-primary">{getOverallCareerScore()}%</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">My Profile Strength</h3>
                      <p className="text-muted-foreground">
                        Complete all tasks below to achieve 100% profile completion and maximize your job search success.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Building Tasks by Category */}
            {Object.entries(tasksByCategory).map(([category, tasks]) => (
              <div key={category} className="mb-8">
                <Card className="shadow-elegant border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      Complete these tasks to strengthen your {category.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={task.action}
                        >
                          <div className="flex-shrink-0">
                            {task.isCompleted ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                              {!task.isEducational && (
                                <Badge variant={task.isCompleted ? "default" : "secondary"}>
                                  {task.id === 'cover-letter' ? task.progress : `${task.progress}%`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            
                            {/* Sample Links for Educational Cards */}
                            {task.sampleLinks && (
                              <div className="flex gap-2 mb-2">
                                {task.sampleLinks.map((link, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(link.url, '_blank');
                                    }}
                                  >
                                    {link.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                            
                            {/* Progress Bar - only for non-educational cards */}
                            {!task.isEducational && (
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-500"
                                  style={{ width: task.id === 'cover-letter' ? `${Math.min(task.progress * 10, 100)}%` : `${task.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Quick Actions */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Fast track your profile building process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex-col gap-2"
                      onClick={() => navigate('/dashboard/career-growth')}
                    >
                      <TrendingUp className="h-6 w-6" />
                      <span>View Career Growth</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex-col gap-2"
                      onClick={() => navigate('/dashboard/job-tracker')}
                    >
                      <Search className="h-6 w-6" />
                      <span>Track Applications</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex-col gap-2"
                      onClick={() => navigate('/dashboard')}
                    >
                      <Eye className="h-6 w-6" />
                      <span>View Dashboard</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default BuildMyProfile;