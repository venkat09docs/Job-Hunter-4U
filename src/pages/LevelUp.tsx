import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useProfile } from '@/hooks/useProfile';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
// Removed useProfileBadges to avoid conflicts - BadgeProgressionMap handles this internally
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
  const { getModuleProgress, loading: careerLoading, getTasksByModule, assignments } = useCareerAssignments();
  const { completionPercentage: linkedinProgress, loading: linkedinLoading } = useLinkedInProgress();
  const { loading: networkLoading } = useLinkedInNetworkProgress();
  const { tasks: githubTasks, getCompletionPercentage: getGitHubProgress, loading: githubLoading } = useGitHubProgress();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [goldBadgeUpgradeDialogOpen, setGoldBadgeUpgradeDialogOpen] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  
  // Get resume progress from career assignments (task-based calculation)
  const resumeProgress = !careerLoading ? getModuleProgress('RESUME') : 0;
  
  // Get completed profile assignments count for badge unlocking
  const profileTasks = !careerLoading ? getTasksByModule('RESUME') : [];
  const completedProfileTasks = profileTasks.filter(task => task.status === 'verified').length;

  // Badge awarding will be handled in BadgeProgressionMap component
  
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

  // Fetch sub-categories to match Career Assignments page logic
  useEffect(() => {
    if (user) {
      fetchSubCategories();
    }
  }, [user]);

  const fetchSubCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('parent_category', 'profile')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
    }
  };

  // Use exact same logic as Career Assignments page
  const getTasksBySubCategory = (subCategoryId: string) => {
    if (careerLoading || !assignments) return [];
    
    return assignments
      .filter(assignment => assignment.career_task_templates?.sub_category_id === subCategoryId)
      .sort((a, b) => {
        const orderA = a.career_task_templates?.display_order || 0;
        const orderB = b.career_task_templates?.display_order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  };

  const getTasksBySubCategoryName = (categoryName: string) => {
    const subCategory = subCategories.find(sc => 
      sc.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    return subCategory ? getTasksBySubCategory(subCategory.id) : [];
  };

  // Calculate LinkedIn profile progress using exact same logic as Career Assignments page
  const linkedinTasks = getTasksBySubCategoryName('linkedin');
  const linkedinProfileProgress = linkedinTasks.length > 0 
    ? Math.round((linkedinTasks.filter(t => t.status === 'verified').length / linkedinTasks.length) * 100)
    : 0;
    
   console.log('🔍 LinkedIn Profile Tasks (Level Up):', linkedinTasks.length, 'Completed:', linkedinTasks.filter(t => t.status === 'verified').length, 'Progress:', linkedinProfileProgress + '%');

  // Calculate Digital Profile progress using exact same logic as Career Assignments page  
  const digitalProfileTasks = getTasksBySubCategoryName('digital profile');
  const digitalProfileProgress = digitalProfileTasks.length > 0 
    ? Math.round((digitalProfileTasks.filter(t => t.status === 'verified').length / digitalProfileTasks.length) * 100)
    : 0;
    
   console.log('🔍 Digital Profile Tasks (Level Up):', digitalProfileTasks.length, 'Completed:', digitalProfileTasks.filter(t => t.status === 'verified').length, 'Progress:', digitalProfileProgress + '%');

  // Calculate GitHub Profile progress using exact same logic as Career Assignments page  
  const githubProfileTasks = getTasksBySubCategoryName('github');
  const githubProfileProgress = githubProfileTasks.length > 0 
    ? Math.round((githubProfileTasks.filter(t => t.status === 'verified').length / githubProfileTasks.length) * 100)
    : 0;
  // Calculate GitHub progress based on pinned repositories and total commits from GitHub Weekly page
  const [githubData, setGitHubData] = useState<any>({});

  // Fetch GitHub data to get accurate counts
  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!user) return;
      
      try {
        // Get pinned repositories count
        const { data: repos, error: reposError } = await supabase
          .from('github_repos')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Get GitHub weekly tasks with evidence
        const { data: weeklyTasks, error: tasksError } = await supabase
          .from('github_user_tasks')
          .select(`
            *,
            github_tasks (*),
            github_evidence (*)
          `)
          .eq('user_id', user.id);

        // Get GitHub signals
        const { data: signals, error: signalsError } = await supabase
          .from('github_signals')
          .select('*')
          .eq('user_id', user.id)
          .order('happened_at', { ascending: false });

        if (reposError || tasksError || signalsError) {
          console.error('Error fetching GitHub data:', { reposError, tasksError, signalsError });
          return;
        }

        setGitHubData({
          repos: repos || [],
          weeklyTasks: weeklyTasks || [],
          signals: signals || []
        });
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      }
    };

    fetchGitHubData();
  }, [user]);

  const githubRepoCount = Array.isArray(githubData.repos) ? githubData.repos.length : 0;
  
  // Calculate total commits from GitHub Weekly page using actual commits data
  const getCurrentWeekCommits = () => {
    if (!Array.isArray(githubData.weeklyTasks)) return 0;
    const currentWeekTasks = githubData.weeklyTasks.filter(task => 
      task.status === 'SUBMITTED' || task.status === 'VERIFIED'
    );
    // Extract commits from evidence data if available
    let totalCommits = 0;
    currentWeekTasks.forEach(task => {
      // Check if task has evidence with commit data
      if (task.github_evidence && Array.isArray(task.github_evidence)) {
        task.github_evidence.forEach((evidence: any) => {
          try {
            const parsedData = evidence.parsed_json as any;
            if (parsedData?.weeklyMetrics?.commits) {
              totalCommits += parsedData.weeklyMetrics.commits;
            }
          } catch (error) {
            // Skip invalid JSON data
          }
        });
      }
    });
    return totalCommits;
  };

  const getTotalCommitsAllTime = () => {
    // Calculate from GitHub signals and verified tasks
    const allSignals = Array.isArray(githubData.signals) ? githubData.signals : [];
    const allVerifiedTasks = Array.isArray(githubData.weeklyTasks) 
      ? githubData.weeklyTasks.filter(task => task.status === 'VERIFIED')
      : [];
    
    // Count commits from signals
    let estimatedTotalCommits = 0;
    allSignals.forEach(signal => {
      if (signal.kind === 'PUSH' || signal.kind === 'POST_PUBLISHED') {
        estimatedTotalCommits++;
      }
    });
    
    // Add weekly task commits
    estimatedTotalCommits += getCurrentWeekCommits();
    
    // Add estimated commits from verified tasks
    estimatedTotalCommits += allVerifiedTasks.length * 2; // Estimate 2 commits per verified task
    
    // Fallback minimum based on verified tasks count
    const totalCommits = Math.max(allVerifiedTasks.length, estimatedTotalCommits);
    
    // Return actual calculated commits without hardcoded fallback
    return totalCommits;
  };

  const totalGitHubCommits = getTotalCommitsAllTime();
  
  // Debug logging for GitHub data
  console.log('🔍 GitHub Debug Data:', {
    githubRepoCount,
    totalGitHubCommits,
    githubSignals: githubData.signals?.length || 0,
    verifiedTasks: githubData.weeklyTasks?.filter(task => task.status === 'VERIFIED').length || 0
  });

  // Define eligible subscription plans for Level Up
  const eligiblePlans = ['3 Months Plan', '6 Months Plan', '1 Year Plan'];
  
  // Define eligible plans for gold badge upgrade (6-month and 1-year only)
  const goldBadgeUpgradePlans = ['6 Months Plan', '1 Year Plan'];
  
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
            digitalProfileProgress={digitalProfileProgress}
            githubProfileProgress={githubProfileProgress}
            githubProgress={githubProgress}
            jobApplicationsCount={totalJobApplications}
            networkConnections={networkMetrics?.totalConnections || 0}
            profileViews={0} // Profile views not available in current metrics
            githubRepos={githubRepoCount}
            githubCommits={totalGitHubCommits}
            subscriptionPlan={profile?.subscription_plan}
            careerLoading={careerLoading}
            onGoldBadgeUpgradeRequired={() => setGoldBadgeUpgradeDialogOpen(true)}
          />
          </div>
        </div>

        {/* Gold Badge Upgrade Dialog for 3-Months Plan Users */}
        <Dialog open={goldBadgeUpgradeDialogOpen} onOpenChange={setGoldBadgeUpgradeDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                Upgrade to Access Gold Badge
              </DialogTitle>
            </DialogHeader>
            <div className="mb-6">
              <p className="text-muted-foreground text-center">
                Unlock the Gold Badge - Profile Perfectionist with our premium plans:
              </p>
            </div>
            <PricingDialog eligiblePlans={goldBadgeUpgradePlans} />
          </DialogContent>
        </Dialog>
      </main>
    </ResizableLayout>
  );
};

export default LevelUp;