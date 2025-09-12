import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  User, 
  Settings, 
  ExternalLink,
  Home,
  PenTool,
  Target,
  Search,
  Linkedin,
  Wrench,
  Zap,
  FileText,
  Shield,
  Users,
  Archive,
  CreditCard,
  BookOpen,
  BarChart3,
  Building,
  Briefcase,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Lock,
  GraduationCap,
  Trophy,
  Bell,
  Github,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Share2,
  ClipboardList,
  Award,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { useUserIndustry } from "@/hooks/useUserIndustry";
import { useProfile } from "@/hooks/useProfile";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import PricingDialog from "./PricingDialog";

const getMainItems = (isAdmin: boolean, isInstituteAdmin: boolean, isRecruiter: boolean) => [
  { title: "Dashboard", url: "/dashboard", icon: Home, featureKey: null },
  { 
    title: "Skill Level Up", 
    url: "/dashboard/skill-level", 
    icon: Award, 
    featureKey: null 
  },
  { title: "Profile Level Up", url: "/dashboard/level-up", icon: Trophy, featureKey: null },
  { title: "Career Growth Activities", url: "/dashboard/career-growth-activities", icon: TrendingUp, featureKey: "career_growth_activities" },
  { title: "Career Growth Report", url: "/dashboard/career-growth", icon: BarChart3, featureKey: "career_growth_report" },
  { title: "Check Level Up", url: "/dashboard/career-growth", icon: TrendingUp, featureKey: null },
  { title: "AI-Powered Career Tools", url: "/dashboard/digital-career-hub", icon: Zap, featureKey: "digital-career-hub" },
  { title: "Resource Library", url: "/dashboard/library", icon: Archive, featureKey: "page_resources_library" },
  { title: "Knowledge Base", url: "/dashboard/knowledge-base", icon: BookOpen, featureKey: null },
  { title: "Affiliate Income Level Up", url: "/affiliate", icon: Share2, featureKey: null },
];

const jobHunterItems = [
  { title: "Find Your Next Role", url: "/dashboard/find-your-next-role", icon: Search, featureKey: "page_find_your_next_role" },
  { title: "Job Tracker", url: "/dashboard/job-tracker", icon: FileText, featureKey: "page_job_tracker" },
  { title: "Job Search History", url: "/dashboard/job-search", icon: Search, featureKey: "page_job_search" },
];

const githubItems = [
  { title: "GitHub Optimization", url: "/dashboard/github-optimization", icon: Github, featureKey: "page_github_optimization" },
  { title: "GitHub Activity Tracker", url: "/dashboard/github-activity-tracker", icon: BarChart3, featureKey: "page_github_activity_tracker" },
  { title: "GitHub Weekly", url: "/github-weekly", icon: Target, featureKey: "github_weekly" },
];

const clpAdminItems = [
  { title: "CLP Dashboard", url: "/dashboard/career-level/dashboard", icon: BarChart3, featureKey: null },
  { title: "Career Level Up Program", url: "/dashboard/career-level", icon: GraduationCap, featureKey: null },
];

const recruiterItems = [
  { title: "Dashboard", url: "/recruiter", icon: Home },
  { title: "Verify Assignments", url: "/admin/verify-assignments", icon: Shield },
  { title: "Affiliate Management", url: "/admin/affiliate-management", icon: Share2 },
  { title: "Notification Analytics", url: "/admin/notification-analytics", icon: Bell },
  { title: "Notification Management", url: "/admin/notification-management", icon: Settings },
  { title: "Post Job", url: "/recruiter/post-job", icon: PenTool },
  ...clpAdminItems,
];

const instituteAdminItems = [
  { title: "Institute Dashboard", url: "/admin/institute-dashboard", icon: Building },
  { title: "Verify Assignments", url: "/admin/verify-assignments", icon: Shield },
  { title: "Batch Management", url: "/admin/batch-management", icon: GraduationCap },
  { title: "Students Management", url: "/admin/students-management", icon: Users },
  { title: "Students Report", url: "/admin/students-report", icon: BarChart3 },
  ...clpAdminItems,
];

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Verify Assignments", url: "/admin/verify-assignments", icon: Shield },
  { title: "Affiliate Management", url: "/admin/affiliate-management", icon: Share2 },
  { title: "Manage Assignments", url: "/admin/manage-assignments", icon: ClipboardList },
  { title: "Social Proof Management", url: "/admin/social-proof-management", icon: TrendingUp },
  { title: "Notification Analytics", url: "/admin/notification-analytics", icon: Bell },
  { title: "Notification Management", url: "/admin/notification-management", icon: Settings },
  { title: "Batch Management", url: "/admin/batch-management", icon: GraduationCap },
  { title: "Students Management", url: "/admin/students-management", icon: Users },
  { title: "Students Report", url: "/admin/students-report", icon: BarChart3 },
  { title: "Institute Membership Plans", url: "/dashboard/institute-membership-plans", icon: CreditCard },
  { title: "Institute Management", url: "/admin/institute-management", icon: Building },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Leader Board Points", url: "/leaderboard-points", icon: Target },
  { title: "Manage Career Hub", url: "/dashboard/manage-career-hub", icon: Wrench },
  { title: "Manage Subscriptions", url: "/dashboard/manage-subscriptions", icon: Settings },
  { title: "Recruiter Dashboard", url: "/recruiter", icon: Home },
  { title: "Post Job", url: "/recruiter/post-job", icon: PenTool },
  ...clpAdminItems,
];

export function AppSidebar() {
  console.log('🔍 AppSidebar: Starting render');
  
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin, isInstituteAdmin, isRecruiter, loading: roleLoading } = useRole();
  const { canAccessFeature } = usePremiumFeatures();
  const { isIT } = useUserIndustry();
  const { totalPoints } = useUserPoints();
  const { theme, setTheme } = useTheme();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [jobHunterOpen, setJobHunterOpen] = useState(false);
  const [githubOpen, setGitHubOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [careerGrowthDialogOpen, setCareerGrowthDialogOpen] = useState(false);
  const [githubToolsDialogOpen, setGithubToolsDialogOpen] = useState(false);

  console.log('🔍 AppSidebar: All hooks called, continuing render');

  const isCollapsed = !isOpen;

  useEffect(() => {
    if (user) {
      fetchUserSlug();
    }
  }, [user]);

  const fetchUserSlug = async () => {
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('slug')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setUserSlug(data.slug);
      }
    } catch (error) {
      console.log('No public profile found yet');
    }
  };

  const isActive = (path: string) => currentPath === path;
  const isJobHunterActive = jobHunterItems.some((i) => isActive(i.url));
  const isGitHubActive = githubItems.some((i) => isActive(i.url));

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const MenuItem = ({ item, isPremium = false, isSubItem = false, sectionColor }: { 
    item: any, 
    isPremium?: boolean, 
    isSubItem?: boolean,
    sectionColor?: string
  }) => {
    // Get section-specific colors
    const getSectionColors = (section: string) => {
      switch (section) {
        case 'admin':
          return {
            activeColor: 'text-red-600 dark:text-red-400',
            activeBg: 'bg-red-50 dark:bg-red-950/20',
            hoverBg: 'hover:bg-red-50/50 dark:hover:bg-red-950/10',
            icon: 'text-red-500'
          };
        case 'main':
          return {
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50 dark:bg-blue-950/20',
            hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
            icon: 'text-blue-500'
          };
        case 'jobhunter':
          return {
            activeColor: 'text-green-600 dark:text-green-400',
            activeBg: 'bg-green-50 dark:bg-green-950/20',
            hoverBg: 'hover:bg-green-50/50 dark:hover:bg-green-950/10',
            icon: 'text-green-500'
          };
        case 'github':
          return {
            activeColor: 'text-orange-600 dark:text-orange-400',
            activeBg: 'bg-orange-50 dark:bg-orange-950/20',
            hoverBg: 'hover:bg-orange-50/50 dark:hover:bg-orange-950/10',
            icon: 'text-orange-500'
          };
        case 'clp':
          return {
            activeColor: 'text-purple-600 dark:text-purple-400',
            activeBg: 'bg-purple-50 dark:bg-purple-950/20',
            hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/10',
            icon: 'text-purple-500'
          };
        default:
          return {
            activeColor: 'text-primary',
            activeBg: 'bg-primary/10',
            hoverBg: 'hover:bg-accent/50',
            icon: 'text-primary'
          };
      }
    };

    const colors = getSectionColors(sectionColor || 'default');
    
    // Special handling for AI-Powered Career Tools to check subscription before opening
    const isAICareerTools = item.title === "AI-Powered Career Tools";
    
    // Special handling for GitHub Weekly - show subscription dialog instead of navigating
    const isGitHubWeekly = item.title === "GitHub Weekly" && isPremium;
    
    // Special handling for Job Hunter premium features - show subscription dialog instead of navigating
    const isJobHunterPremium = isPremium && (
      item.title === "Find Your Next Role" || 
      item.title === "Job Tracker" || 
      item.title === "Job Search History"
    );
    
    // Special handling for Career Growth features - show dialog with 1-week and 1-month plans only
    const isCareerGrowthPremium = isPremium && (
      item.title === "Career Growth Activities" || 
      item.title === "Career Growth Report"
    );
    
    // Special handling for GitHub Tools - show dialog with 1-week and 1-month plans only
    const isGitHubToolsPremium = isPremium && (
      item.title === "GitHub Optimization" || 
      item.title === "GitHub Activity Tracker"
    );
    
    const handlePremiumFeatureClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setSubscriptionDialogOpen(true);
    };
    
    const handleCareerGrowthClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setCareerGrowthDialogOpen(true);
    };
    
    const handleGitHubToolsClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setGithubToolsDialogOpen(true);
    };
    
    const handleAICareerToolsClick = (e: React.MouseEvent) => {
      e.preventDefault();
      // Check if user has active subscription
      if (!profile?.subscription_plan || profile.subscription_plan === "Free Plan") {
        setSubscriptionDialogOpen(true);
      } else {
        // User has subscription, proceed to open in new tab
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    };
    
    const menuItem = isAICareerTools ? (
      <div
        onClick={handleAICareerToolsClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-foreground hover:text-accent-foreground ${colors.hoverBg}`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${colors.icon}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              {(!profile?.subscription_plan || profile.subscription_plan === "Free Plan") && 
                <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              }
            </div>
          </div>
        )}
      </div>
    ) : (isGitHubWeekly || isJobHunterPremium) ? (
      <div 
        onClick={handlePremiumFeatureClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-foreground hover:text-accent-foreground ${colors.hoverBg}`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${colors.icon}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            {isPremium && <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground ml-2" />}
          </div>
        )}
      </div>
    ) : isCareerGrowthPremium ? (
      <div 
        onClick={handleCareerGrowthClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-foreground hover:text-accent-foreground ${colors.hoverBg}`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${colors.icon}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            {isPremium && <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground ml-2" />}
          </div>
        )}
      </div>
    ) : isGitHubToolsPremium ? (
      <div 
        onClick={handleGitHubToolsClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-foreground hover:text-accent-foreground ${colors.hoverBg}`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${colors.icon}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            {isPremium && <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground ml-2" />}
          </div>
        )}
      </div>
    ) : (
      <NavLink 
        to={item.url} 
        end 
        className={({ isActive }) => 
          `flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            isActive 
              ? `${colors.activeColor} ${colors.activeBg}`
              : `text-foreground hover:text-accent-foreground ${colors.hoverBg}`
          }`
        }
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${colors.icon}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            {isPremium && <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground ml-2" />}
          </div>
        )}
      </NavLink>
    );

    // Add tooltip for sub-items or when collapsed
    if (isSubItem || isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {menuItem}
          </TooltipTrigger>
          <TooltipContent side="right" className="z-50">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return menuItem;
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "h-screen border-r bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col relative overflow-hidden",
        isCollapsed ? "w-16" : "w-[280px]"
      )}>
      <div className="flex flex-col h-full">
        {/* User Profile at Top */}
        <div className="flex items-center p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarImage src={profile?.profile_image_url || ""} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <p className="font-semibold text-lg truncate">
                  {profile?.username || user?.email?.split('@')[0] || 'User'} 
                  <span className="font-normal text-muted-foreground ml-1">
                    ({profile?.industry || 'Professional'})
                  </span>
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  🏆 {totalPoints} Points
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Content - Scrollable */}
        <div className="flex-1 overflow-auto px-2 py-4 space-y-6 min-w-0">
          {/* Admin Section */}
          {(isAdmin || isInstituteAdmin || isRecruiter) && (
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Administration
                </h3>
              )}
              <div className="space-y-1">
                 {(isRecruiter && !isAdmin && !isInstituteAdmin ? recruiterItems : 
                  isInstituteAdmin && !isAdmin ? instituteAdminItems : adminItems).map((item) => {
                  // Filter logic for different admin types
                  if (isRecruiter && !isAdmin && !isInstituteAdmin) {
                    return <MenuItem key={item.title} item={item} sectionColor="admin" />;
                  }
                  
                  if (isInstituteAdmin && !isAdmin) {
                    // For institute admins, all items in instituteAdminItems are allowed
                    return <MenuItem key={item.title} item={item} sectionColor="admin" />;
                  }
                  
                  // For super admins, apply existing filtering logic
                  if (item.title === "Institute Membership Plans" && isAdmin && !isInstituteAdmin) return null;
                  if (item.title === "Admin Dashboard" && isInstituteAdmin && !isAdmin) return null;
                  if (item.title === "Dashboard" && !isInstituteAdmin && !isRecruiter) return null;
                  if (item.title === "Students Report" && isAdmin && !isInstituteAdmin) return null;
                  if (item.title === "Institute Management" && !isAdmin) return null;
                  if (item.title === "Batch Management" && !isInstituteAdmin && !isAdmin) return null;
                  if (item.title === "Students Management" && !isInstituteAdmin && !isAdmin) return null;
                  if (item.title === "User Management" && !isAdmin) return null;
                  if (item.title === "Leader Board Points" && !isAdmin) return null;
                  if ((item.title === "Manage Career Hub" || item.title === "Manage Subscriptions") && !isAdmin) return null;
                  if ((item.title === "Recruiter Dashboard" || item.title === "Post Job") && !isAdmin) return null;
                  if (item.title === "Verify Assignments" && !isAdmin && !isRecruiter && !isInstituteAdmin) return null;
                
                  return <MenuItem key={item.title} item={item} />;
                })}
              </div>
            </div>
          )}

          {/* Main User Section */}
          {!isInstituteAdmin && !isRecruiter && (
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  CAREER LEVEL UP
                </h3>
              )}
              <div className="space-y-1">
                {/* Main Menu Items - Part 1: Up to Profile Level Up */}
                {getMainItems(isAdmin, isInstituteAdmin, isRecruiter).slice(0, 3).map((item) => {
                  // Special condition for Level Up - only show for premium plan subscribers
                  if (item.title === "Level Up") {
                    const subscriberPlan = profile?.subscription_plan;
                    const eligiblePlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
                    
                    // Hide Level Up for users without eligible plans
                    if (!subscriberPlan || !eligiblePlans.includes(subscriberPlan)) {
                      return null;
                    }
                  }
                  
                  // Remove Progress Level Up condition since it's moved
                  
                  // Hide specific items for subscription users
                  const subscriberPlan = profile?.subscription_plan;
                  const highTierPlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
                  const lowTierPlans = ["One Week Plan", "One Month Plan"];
                  
                  // Hide Career Growth Report for all subscription users (low and high tier)
                  if (item.title === "Career Growth Report" && subscriberPlan && 
                      (lowTierPlans.includes(subscriberPlan) || highTierPlans.includes(subscriberPlan))) {
                    return null;
                  }
                  
                  // Hide Career Growth Activities only for high tier subscription users
                  if (item.title === "Career Growth Activities" && subscriberPlan && 
                      highTierPlans.includes(subscriberPlan)) {
                    return null;
                  }
                  
                  const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                  return <MenuItem key={item.title} item={item} isPremium={isPremium} />;
                })}

                {/* Job Hunter Section */}
                <div className="mt-4">
                    <button
                      onClick={() => setJobHunterOpen(!jobHunterOpen)}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 w-full ${
                        isJobHunterActive ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20' : 'text-foreground hover:text-accent-foreground hover:bg-green-50/50 dark:hover:bg-green-950/10'
                      }`}
                    >
                      <Target className="h-5 w-5 flex-shrink-0 text-green-500" />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-sm">Job Hunter Level Up</span>
                          {jobHunterOpen ? (
                            <ChevronDown className="h-4 w-4 ml-auto text-green-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-auto text-green-500" />
                          )}
                        </>
                      )}
                    </button>
                    {jobHunterOpen && !isCollapsed && (
                      <div className="space-y-1 mt-1">
                        {jobHunterItems.map((item) => {
                          const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                          return <MenuItem key={item.title} item={item} isPremium={isPremium} isSubItem={true} sectionColor="jobhunter" />;
                        })}
                      </div>
                    )}
                    {isCollapsed && (
                      <div className="space-y-1">
                        {jobHunterItems.map((item) => (
                          <MenuItem key={item.title} item={item} sectionColor="jobhunter" />
                        ))}
                      </div>
                    )}
                </div>

                {/* Progress Level Up - Right after Job Hunter */}
                {(() => {
                  const subscriberPlan = profile?.subscription_plan;
                  const premiumPlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
                  
                  // Only show Progress Level Up for users with premium plans
                  if (!subscriberPlan || !premiumPlans.includes(subscriberPlan)) {
                    return null;
                  }
                  
                  const progressItem = { title: "Progress Level Up", url: "/dashboard/progress-level-up", icon: ClipboardList, featureKey: null };
                  return (
                    <div className="mt-4">
                      <MenuItem key={progressItem.title} item={progressItem} />
                    </div>
                  );
                })()}

                {/* Main Menu Items - Part 2: After Job Hunter and Progress Level Up */}
                {getMainItems(isAdmin, isInstituteAdmin, isRecruiter).slice(3).map((item) => {
                  // Special condition for Level Up - only show for premium plan subscribers
                  if (item.title === "Level Up") {
                    const subscriberPlan = profile?.subscription_plan;
                    const eligiblePlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
                    
                    // Hide Level Up for users without eligible plans
                    if (!subscriberPlan || !eligiblePlans.includes(subscriberPlan)) {
                      return null;
                    }
                  }
                  
                  // Special condition for Check Level Up - only show for basic/no subscription users
                  if (item.title === "Check Level Up") {
                    const subscriberPlan = profile?.subscription_plan;
                    const premiumPlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
                    
                    // Only show Check Level Up for users without premium plans
                    if (subscriberPlan && premiumPlans.includes(subscriberPlan)) {
                      return null;
                    }
                  }
                  
                  // Hide specific items for subscription users
                  const subscriberPlan = profile?.subscription_plan;
                  const highTierPlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
                  const lowTierPlans = ["One Week Plan", "One Month Plan"];
                  
                  // Hide Career Growth Report for all subscription users (low and high tier)
                  if (item.title === "Career Growth Report" && subscriberPlan && 
                      (lowTierPlans.includes(subscriberPlan) || highTierPlans.includes(subscriberPlan))) {
                    return null;
                  }
                  
                  // Hide Career Growth Activities only for high tier subscription users
                  if (item.title === "Career Growth Activities" && subscriberPlan && 
                      highTierPlans.includes(subscriberPlan)) {
                    return null;
                  }
                  
                  const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                  return <MenuItem key={item.title} item={item} isPremium={isPremium} />;
                })}


              </div>
            </div>
          )}
        </div>

        {/* Footer with Dark Mode Toggle */}
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex items-center gap-2">
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
            {!isCollapsed && <span className="text-sm text-muted-foreground">Dark Mode</span>}
          </div>
        </div>
      </div>

      {/* Bottom Toggle Button - Always visible outside sidebar */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-accent"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Subscription Dialog for Premium Features */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade to Access Premium Features
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Get access to all premium job hunting tools and career growth features.
            </p>
          </DialogHeader>
          <PricingDialog />
        </DialogContent>
      </Dialog>
      
      {/* Career Growth Dialog for 1-week and 1-month plans only */}
      <Dialog open={careerGrowthDialogOpen} onOpenChange={setCareerGrowthDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade for Career Growth Features
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Career Growth Activities and Reports are available with our starter plans.
            </p>
          </DialogHeader>
          <PricingDialog eligiblePlans={["One Week Plan", "One Month Plan"]} />
        </DialogContent>
      </Dialog>
      
      {/* GitHub Tools Dialog for 1-week and 1-month plans only */}
      <Dialog open={githubToolsDialogOpen} onOpenChange={setGithubToolsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade for GitHub Tools
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              GitHub Optimization and GitHub Activity Tracker are available with our starter plans.
            </p>
          </DialogHeader>
          <PricingDialog eligiblePlans={["One Week Plan", "One Month Plan"]} />
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}