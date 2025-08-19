import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useProfile } from '@/hooks/useProfile';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { ResizableLayout } from '@/components/ResizableLayout';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import BadgeProgressionMap from '@/components/BadgeProgressionMap';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LevelUp = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { profile, loading } = useProfile();
  const { progress: resumeProgress, loading: resumeLoading } = useResumeProgress();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading } = useLinkedInProgress();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading } = useGitHubProgress();
  
  // Get the GitHub progress percentage
  const githubProgress = getGitHubProgress();
  const { metrics: networkMetrics, loading: networkGrowthLoading } = useNetworkGrowthMetrics();
  const [totalJobApplications, setTotalJobApplications] = useState(0);

  // GitHub Activities tracker metrics
  const REPO_TASK_IDS = ['pinned_repos','repo_descriptions','readme_files','topics_tags','license'];
  const [repoMetrics, setRepoMetrics] = useState({ completed: 0, total: REPO_TASK_IDS.length });

  useEffect(() => {
    if (!githubTasks) return;
    const completed = githubTasks.filter(t => REPO_TASK_IDS.includes(t.task_id) && t.completed).length;
    setRepoMetrics({ completed, total: REPO_TASK_IDS.length });
  }, [githubTasks]);

  // Fetch total job applications in process
  const fetchJobData = async () => {
    if (!user) return;
    
    try {
      const { count, error: countError } = await supabase
        .from('job_tracker')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .not('status', 'in', '("wishlist","not_selected","no_response","archived")');

      if (countError) throw countError;
      setTotalJobApplications(count || 0);
    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [user]);

  // Show coming soon for non-admin users
  if (!isAdmin) {
    return (
      <ResizableLayout>
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Level Up
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

          {/* Coming Soon Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <div className="text-6xl">🚀</div>
              <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Coming Soon...
              </h2>
              <p className="text-muted-foreground text-lg max-w-md">
                We're working hard to bring you an amazing Level Up experience. Stay tuned!
              </p>
            </div>
          </div>
        </main>
      </ResizableLayout>
    );
  }

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
    <ResizableLayout>
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Level Up
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
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Level Up Your Career
            </h2>
            <p className="text-muted-foreground">
              Track your progress and unlock achievements as you advance your career journey.
            </p>
          </div>

          {/* Badge Progression Map */}
          <div className="mb-8">
            <BadgeProgressionMap 
              resumeProgress={resumeProgress}
              linkedinProgress={linkedinProgress}
              githubProgress={githubProgress}
              jobApplicationsCount={totalJobApplications}
              networkConnections={networkMetrics?.totalConnections || 0}
              profileViews={0} // Profile views not available in current metrics
              githubCommits={repoMetrics.completed * 6} // Approximate commits based on completed tasks
              githubRepos={repoMetrics.completed > 0 ? 1 : 0} // Has at least one repo if any tasks completed
            />
          </div>
        </div>
      </main>
    </ResizableLayout>
  );
};

export default LevelUp;