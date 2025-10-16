import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Plus,
  MessageSquare
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
import { useOptimizedLeaderboard } from "@/hooks/useOptimizedLeaderboard";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import PricingDialog from "./PricingDialog";

const getMainItems = (isAdmin: boolean, isInstituteAdmin: boolean, isRecruiter: boolean) => [
  { title: "Dashboard", url: "/dashboard", icon: Home, featureKey: null },
  { title: "Skill Level Up", url: "/dashboard/skill-level", icon: Award, featureKey: null },
  { title: "Profile Level Up", url: "/dashboard/level-up", icon: Trophy, featureKey: null },
  { title: "Interview Level Up", url: "/dashboard/interview-preparation", icon: MessageSquare, featureKey: null },
  { title: "AI-Powered Career Tools", url: "/dashboard/digital-career-hub", icon: Zap, featureKey: "digital-career-hub" },
  { title: "Resource Library", url: "/dashboard/library", icon: Archive, featureKey: "page_resources_library" },
  { title: "Knowledge Base", url: "/dashboard/knowledge-base", icon: BookOpen, featureKey: null },
  { title: "Affiliate Income Level Up", url: "/affiliate", icon: Share2, featureKey: null },
];

const jobHunterItems = [
  // Removed submenu items - JobHunter LevelUp is now a single menu item
];

const githubItems = [
  { title: "GitHub Optimization", url: "/dashboard/github-optimization", icon: Github, featureKey: "page_github_optimization" },
  { title: "GitHub Activity Tracker", url: "/dashboard/github-activity-tracker", icon: BarChart3, featureKey: "page_github_activity_tracker" },
  { title: "GitHub Weekly", url: "/github-weekly", icon: Target, featureKey: "github_weekly" },
];

const clpAdminItems = [
  { title: "CLP Dashboard", url: "/dashboard/career-level/dashboard", icon: BarChart3, featureKey: null },
  
];

const recruiterItems = [
  { title: "Dashboard", url: "/recruiter", icon: Home },
  { title: "Affiliate Management", url: "/admin/affiliate-management", icon: Share2 },
  { title: "Notification Analytics", url: "/admin/notification-analytics", icon: Bell },
  { title: "Notification Management", url: "/admin/notification-management", icon: Settings },
  { title: "Post Job", url: "/recruiter/post-job", icon: PenTool },
  ...clpAdminItems,
];

const instituteAdminItems = [
  { title: "Institute Dashboard", url: "/admin", icon: Building },
  { title: "Verify Assignments", url: "/admin/verify-assignments", icon: Shield },
  { title: "Batch Management", url: "/admin/batch-management", icon: GraduationCap },
  { title: "Students Management", url: "/admin/students-management", icon: Users },
  { title: "Students Report", url: "/admin/students-report", icon: BarChart3 },
  { title: "Skill Assignments", url: "/admin/skill-assignments", icon: BookOpen },
  // CLP Dashboard removed for institute admins
];

const adminItems = [
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
  { title: "Institutes Subscription Plan", url: "/admin/institutes-subscription-plan", icon: CreditCard },
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
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { profile, hasActiveSubscription } = useProfile();
  const { isAdmin, isInstituteAdmin, isRecruiter, loading: roleLoading } = useRole();
  
  // Debug logging for role detection
  console.log('🔍 AppSidebar Role Debug:', {
    isAdmin,
    isInstituteAdmin, 
    isRecruiter,
    roleLoading,
    userEmail: user?.email,
    userId: user?.id
  });
  const { canAccessFeature } = usePremiumFeatures();
  const { isIT } = useUserIndustry();
  const { totalPoints } = useUserPoints();
  const { leaderboard } = useOptimizedLeaderboard();
  const { theme, setTheme } = useTheme();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [jobHunterOpen, setJobHunterOpen] = useState(false);
  const [githubOpen, setGitHubOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [careerGrowthDialogOpen, setCareerGrowthDialogOpen] = useState(false);
  const [githubToolsDialogOpen, setGithubToolsDialogOpen] = useState(false);
  const [interviewLevelUpDialogOpen, setInterviewLevelUpDialogOpen] = useState(false);

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
    // Get icon-specific colors using semantic tokens from design system
    const getIconColor = (title: string) => {
      switch (title) {
        case 'Dashboard':
          return 'text-[hsl(var(--primary))]';
        case 'Skill Level Up':
          return 'text-[hsl(var(--violet))]';
        case 'Profile Level Up':
          return 'text-[hsl(var(--amber))]';
        case 'Interview Level Up':
          return 'text-[hsl(var(--rose))]';
        case 'AI-Powered Career Tools':
          return 'text-[hsl(var(--cyan))]';
        case 'Resource Library':
          return 'text-[hsl(var(--emerald))]';
        case 'Knowledge Base':
          return 'text-[hsl(var(--indigo))]';
        case 'Affiliate Income Level Up':
          return 'text-[hsl(var(--teal))]';
        case 'GitHub Optimization':
        case 'GitHub Activity Tracker':
        case 'GitHub Weekly':
          return 'text-[hsl(var(--success))]';
        case 'JobHunter LevelUp':
        case 'Find Your Next Role':
        case 'Job Tracker':
        case 'Job Search History':
          return 'text-[hsl(var(--info))]';
        case 'Career Growth Activities':
        case 'Career Growth Report':
          return 'text-[hsl(var(--purple))]';
        case 'CLP Dashboard':
        case 'Manage Questions':
        case 'Create Assignment':
        case 'My Assignments':
          return 'text-[hsl(var(--purple))]';
        case 'Institute Dashboard':
        case 'Institute Management':
        case 'Batch Management':
          return 'text-[hsl(var(--orange))]';
        case 'Admin Dashboard':
        case 'Verify Assignments':
        case 'User Management':
          return 'text-[hsl(var(--error))]';
        case 'Students Management':
        case 'Students Report':
          return 'text-[hsl(var(--sky))]';
        case 'Affiliate Management':
          return 'text-[hsl(var(--teal))]';
        case 'Social Proof Management':
          return 'text-[hsl(var(--pink))]';
        case 'Notification Analytics':
        case 'Notification Management':
          return 'text-[hsl(var(--indigo))]';
        case 'Skill Assignments':
          return 'text-[hsl(var(--violet))]';
        case 'Manage Assignments':
          return 'text-[hsl(var(--amber))]';
        case 'Institute Membership Plans':
        case 'Institutes Subscription Plan':
          return 'text-[hsl(var(--warning))]';
        case 'Manage Career Hub':
        case 'Manage Subscriptions':
          return 'text-[hsl(var(--slate))]';
        case 'Recruiter Dashboard':
        case 'Post Job':
          return 'text-[hsl(var(--cyan))]';
        case 'Leader Board Points':
          return 'text-[hsl(var(--amber))]';
        default:
          return 'text-[hsl(var(--primary))]';
      }
    };

    // Get section-specific colors for active/hover states
    const getSectionColors = (section: string) => {
      switch (section) {
        case 'admin':
          return {
            activeColor: 'text-[hsl(var(--error))]',
            activeBg: 'bg-[hsl(var(--error))]/10',
            hoverBg: 'hover:bg-[hsl(var(--error))]/5',
          };
        case 'main':
          return {
            activeColor: 'text-[hsl(var(--primary))]',
            activeBg: 'bg-[hsl(var(--primary))]/10',
            hoverBg: 'hover:bg-[hsl(var(--primary))]/5',
          };
        case 'jobhunter':
          return {
            activeColor: 'text-[hsl(var(--info))]',
            activeBg: 'bg-[hsl(var(--info))]/10',
            hoverBg: 'hover:bg-[hsl(var(--info))]/5',
          };
        case 'github':
          return {
            activeColor: 'text-[hsl(var(--success))]',
            activeBg: 'bg-[hsl(var(--success))]/10',
            hoverBg: 'hover:bg-[hsl(var(--success))]/5',
          };
        case 'clp':
          return {
            activeColor: 'text-[hsl(var(--purple))]',
            activeBg: 'bg-[hsl(var(--purple))]/10',
            hoverBg: 'hover:bg-[hsl(var(--purple))]/5',
          };
        default:
          return {
            activeColor: 'text-primary',
            activeBg: 'bg-primary/10',
            hoverBg: 'hover:bg-accent/50',
          };
      }
    };

    const colors = getSectionColors(sectionColor || 'default');
    
    // Special handling for AI-Powered Career Tools to check subscription before opening
    const isAICareerTools = item.title === "AI-Powered Career Tools";
    
    // Special handling for Skill Level Up to check subscription
    const isSkillLevelUp = false; // Remove subscription check for Skill Level Up
    
    // Special handling for Interview Level Up to check subscription
    const isInterviewLevelUp = item.title === "Interview Level Up";
    
    // Special handling for GitHub Weekly - show subscription dialog instead of navigating
    const isGitHubWeekly = item.title === "GitHub Weekly" && isPremium;
    
    // Special handling for Job Hunter premium features - show subscription dialog instead of navigating
    const isJobHunterPremium = isPremium && (
      item.title === "Find Your Next Role" || 
      item.title === "Job Tracker" || 
      item.title === "Job Search History"
    );
    
    // Special handling for Career Growth features - ALL subscription plans have access
    const isCareerGrowthPremium = isPremium && (
      item.title === "Career Growth Activities" || 
      item.title === "Career Growth Report"
    );
    
    // Special handling for GitHub Tools - ALL subscription plans have access
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
    
    const handleInterviewLevelUpClick = (e: React.MouseEvent) => {
      e.preventDefault();
      // Check if user has active subscription
      if (!hasActiveSubscription()) {
        setInterviewLevelUpDialogOpen(true);
      } else {
        // User has subscription, proceed to navigate normally
        navigate(item.url);
      }
    };
    
    const handleAICareerToolsClick = (e: React.MouseEvent) => {
      e.preventDefault();
      // Check if user has active subscription
      if (!hasActiveSubscription()) {
        setSubscriptionDialogOpen(true);
      } else {
        // User has subscription, proceed to open in new tab
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    };
    
    const handleSkillLevelUpClick = (e: React.MouseEvent) => {
      e.preventDefault();
      
      // Always navigate to Skill Level Up page - subscription is handled at course level
      navigate(item.url);
    };
    
    const menuItem = isAICareerTools ? (
      <div
        onClick={handleAICareerToolsClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-foreground hover:text-accent-foreground ${colors.hoverBg}`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              {!hasActiveSubscription() && 
                <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              }
            </div>
          </div>
        )}
      </div>
    ) : isInterviewLevelUp ? (
      <div
        onClick={handleInterviewLevelUpClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
          currentPath === item.url 
            ? `${colors.activeColor} ${colors.activeBg}`
            : `text-foreground hover:text-accent-foreground ${colors.hoverBg}`
        }`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            {!hasActiveSubscription() && 
              <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            }
          </div>
        )}
      </div>
    ) : isSkillLevelUp ? (
      <div
        onClick={handleSkillLevelUpClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
          currentPath === item.url 
            ? `${colors.activeColor} ${colors.activeBg}`
            : `text-foreground hover:text-accent-foreground ${colors.hoverBg}`
        }`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm truncate">
              {item.title}
            </span>
            {(!hasActiveSubscription() || !profile?.subscription_plan || 
              !["One Month Plan", "3 Months Plan", "6 Months Plan", "1 Year Plan"].includes(profile.subscription_plan)) && 
              !isAdmin && 
              <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            }
          </div>
        )}
      </div>
    ) : (isGitHubWeekly || isJobHunterPremium) ? (
      <div 
        onClick={handlePremiumFeatureClick}
        className={`flex items-center gap-3 ${isSubItem ? 'pl-8 pr-3' : 'px-3'} py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-foreground hover:text-accent-foreground ${colors.hoverBg}`}
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
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
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
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
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
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
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${getIconColor(item.title)}`} />
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your Leader Board Rank: {
                    leaderboard.top_performer.find(entry => entry.user_id === user?.id)?.rank_position || 'N/A'
                  }
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
                  AI CAREER LEVEL UP
                </h3>
              )}
              <div className="space-y-1">
                {/* First 4 items: Dashboard, Skill Level Up, Profile Level Up, Crack Interview */}
                {getMainItems(isAdmin, isInstituteAdmin, isRecruiter).slice(0, 4).map((item) => {
                  const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                  // Don't pass isPremium for Skill Level Up since it has custom subscription handling
                  const shouldPassPremium = item.title !== "Skill Level Up" ? isPremium : false;
                  return <MenuItem key={item.title} item={item} isPremium={shouldPassPremium} sectionColor="main" />;
                })}

                {/* Job Hunter Level Up - single menu item */}
                <div className="mt-4">
                  {(() => {
                    const jobHunterItem = { title: "JobHunter LevelUp", url: "/job-hunter-level-up", icon: Target, featureKey: null };
                    return <MenuItem key={jobHunterItem.title} item={jobHunterItem} sectionColor="jobhunter" />;
                  })()}
                </div>

                {/* Progress Level Up - moved below JobHunter Level Up */}
                <div className="mt-4">
                  {(() => {
                    const progressItem = { title: "Progress Level Up", url: "/dashboard/progress-level-up", icon: ClipboardList, featureKey: null };
                    return <MenuItem key={progressItem.title} item={progressItem} sectionColor="main" />;
                  })()}
                </div>

                {/* Remaining main menu items */}
                {getMainItems(isAdmin, isInstituteAdmin, isRecruiter).slice(4).map((item) => {
                  const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                  // Don't pass isPremium for Skill Level Up since it has custom subscription handling
                  const shouldPassPremium = item.title !== "Skill Level Up" ? isPremium : false;
                  return <MenuItem key={item.title} item={item} isPremium={shouldPassPremium} sectionColor="main" />;
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
              Career Growth Activities and Reports are available with all our subscription plans.
            </p>
          </DialogHeader>
          <PricingDialog eligiblePlans={["One Month Plan", "3 Months Plan", "6 Months Plan", "1 Year Plan"]} />
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
              GitHub Optimization and GitHub Activity Tracker are available with all our subscription plans.
            </p>
          </DialogHeader>
          <PricingDialog eligiblePlans={["One Month Plan", "3 Months Plan", "6 Months Plan", "1 Year Plan"]} />
        </DialogContent>
      </Dialog>
      
      {/* Interview Level Up Dialog */}
      <Dialog open={interviewLevelUpDialogOpen} onOpenChange={setInterviewLevelUpDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade to Access Interview Level Up
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Get access to comprehensive interview preparation tools and features with our subscription plans.
            </p>
          </DialogHeader>
          <PricingDialog eligiblePlans={["One Month Plan", "3 Months Plan", "6 Months Plan", "1 Year Plan"]} />
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}