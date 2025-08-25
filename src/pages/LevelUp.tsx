import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useProfile } from '@/hooks/useProfile';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
import { useProfileBadges } from '@/hooks/useProfileBadges';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { ResizableLayout } from '@/components/ResizableLayout';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import BadgeProgressionMap from '@/components/BadgeProgressionMap';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PricingDialog from '@/components/PricingDialog';
import { Crown, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LevelUp = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { profile, loading, hasActiveSubscription } = useProfile();
  const { getModuleProgress, loading: careerLoading, getTasksByModule } = useCareerAssignments();
  const { checkAndAwardBadges } = useProfileBadges();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading } = useLinkedInProgress();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading } = useGitHubProgress();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  // Get resume progress from career assignments (task-based calculation)
  const resumeProgress = !careerLoading ? getModuleProgress('RESUME') : 0;
  
  // Get LinkedIn profile progress from career assignments (same pattern as resume)
  const linkedinProfileProgress = !careerLoading ? getModuleProgress('LINKEDIN') : 0;
  
  // Get completed profile assignments count for badge unlocking
  const profileTasks = !careerLoading ? getTasksByModule('RESUME') : [];
  const completedProfileTasks = profileTasks.filter(task => task.status === 'verified').length;

  // Check for badge awards when profile progress milestones are reached
  useEffect(() => {
    if (!careerLoading && resumeProgress >= 100) {
      // Award badges when bronze reaches 100%
      checkAndAwardBadges();
    }
  }, [resumeProgress, careerLoading, checkAndAwardBadges]);

  // Also check when LinkedIn profile progress changes (for silver/gold progression)
  useEffect(() => {
    if (!careerLoading && linkedinProfileProgress >= 100) {
      checkAndAwardBadges();
    }
  }, [linkedinProfileProgress, careerLoading, checkAndAwardBadges]);
  
  // Get the GitHub progress percentage
  const githubProgress = getGitHubProgress();
  const { metrics: networkMetrics, loading: networkGrowthLoading } = useNetworkGrowthMetrics();
  const [totalJobApplications, setTotalJobApplications] = useState(0);

  // GitHub Activities tracker metrics
  const REPO_TASK_IDS = ['pinned_repos','repo_descriptions','readme_files','topics_tags','license'];
  const [repoMetrics, setRepoMetrics] = useState({ completed: 0, total: REPO_TASK_IDS.length });

  // Move this after the job data effect
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

  // Define eligible subscription plans for Level Up
  const eligiblePlans = ['3 Months Plan', '6 Months Plan', '1 Year Plan'];
  
  // Check if user has eligible subscription
  const hasEligibleSubscription = () => {
    return hasActiveSubscription() && 
           profile?.subscription_plan && 
           eligiblePlans.includes(profile.subscription_plan);
  };

  // Check if user can access Level Up (admin or eligible subscription)
  const canAccessLevelUp = () => {
    return isAdmin || hasEligibleSubscription();
  };

  // Show upgrade page for users without eligible subscription (excluding admins)
  if (!loading && !canAccessLevelUp()) {
    return (
      <ResizableLayout>
        <main className="h-full flex flex-col">
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

          {/* Upgrade Required Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-2xl">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Upgrade Required
              </h2>
              <p className="text-muted-foreground text-lg">
                The Level Up program is available exclusively for users with our premium subscription plans.
              </p>
              <p className="text-muted-foreground">
                Unlock advanced career growth tools, personalized coaching, and exclusive resources.
              </p>
              
              <Button 
                onClick={() => setUpgradeDialogOpen(true)}
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-white px-8 py-3 text-lg"
                size="lg"
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>

          {/* Upgrade Dialog */}
          <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Upgrade to Access Level Up
                </DialogTitle>
              </DialogHeader>
              <div className="mb-6">
                <p className="text-muted-foreground text-center">
                  Choose from our premium plans to unlock the Level Up program and advanced career growth features:
                </p>
              </div>
              <PricingDialog eligiblePlans={eligiblePlans} />
            </DialogContent>
          </Dialog>
        </main>
      </ResizableLayout>
    );
  }

  if (loading || careerLoading || linkedinLoading || networkLoading || githubLoading) {
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
      <main className="h-full flex flex-col">
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
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto min-h-0">
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
              completedProfileTasks={completedProfileTasks}
              linkedinProgress={linkedinProgress}
              linkedinProfileProgress={linkedinProfileProgress}
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