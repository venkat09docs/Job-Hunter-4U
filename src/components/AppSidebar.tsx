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
  ClipboardList,
  Moon,
  Sun,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { useUserIndustry } from "@/hooks/useUserIndustry";
import { useProfile } from "@/hooks/useProfile";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, featureKey: null },
  { title: "Level Up", url: "/dashboard/level-up", icon: Trophy, featureKey: null },
  { title: "Build My Profile", url: "/dashboard/build-my-profile", icon: User, featureKey: null },
  { title: "Career Growth Activities", url: "/dashboard/career-growth-activities", icon: TrendingUp, featureKey: "career_growth_activities" },
  { title: "Career Growth Report", url: "/dashboard/career-growth", icon: BarChart3, featureKey: "career_growth_report" },
  { title: "AI-Powered Career Tools", url: "/dashboard/digital-career-hub", icon: Zap, featureKey: "digital-career-hub" },
  { title: "Resource Library", url: "/dashboard/library", icon: Archive, featureKey: "page_resources_library" },
  { title: "Knowledge Base", url: "/dashboard/knowledge-base", icon: BookOpen, featureKey: null },
];

const jobHunterItems = [
  { title: "Find Your Next Role", url: "/dashboard/find-your-next-role", icon: Search, featureKey: "page_find_your_next_role" },
  { title: "Job Tracker", url: "/dashboard/job-tracker", icon: FileText, featureKey: "page_job_tracker" },
  { title: "Job Search History", url: "/dashboard/job-search", icon: Search, featureKey: "page_job_search" },
];

const githubItems = [
  { title: "GitHub Optimization", url: "/dashboard/github-optimization", icon: Github, featureKey: "page_github_optimization" },
  { title: "GitHub Activity Tracker", url: "/dashboard/github-activity-tracker", icon: BarChart3, featureKey: "page_github_activity_tracker" },
  { title: "GitHub Weekly", url: "/github-weekly", icon: Target, featureKey: null },
];

const careerAssignmentItems = [
  { title: "Profile Assignments", url: "/dashboard/career-assignments", icon: ClipboardList, featureKey: null },
  { title: "LinkedIn Growth Assignments", url: "/career-activities", icon: Linkedin, featureKey: null },
  { title: "Job Hunter – Assignments & Tracking", url: "/dashboard/job-hunting-assignments", icon: Target, featureKey: "job_hunting_assignments" },
  { title: "GitHub Weekly", url: "/github-weekly", icon: Github, featureKey: null },
];

const recruiterItems = [
  { title: "Dashboard", url: "/recruiter", icon: Home },
  { title: "Post Job", url: "/recruiter/post-job", icon: PenTool },
];

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
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
];

export function AppSidebar() {
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
  const [careerAssignmentsOpen, setCareerAssignmentsOpen] = useState(false);

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
  const isCareerAssignmentsActive = careerAssignmentItems.some((i) => isActive(i.url));

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const MenuItem = ({ item, isPremium = false, isSubItem = false }: { 
    item: any, 
    isPremium?: boolean, 
    isSubItem?: boolean 
  }) => {
    const menuItem = (
      <NavLink 
        to={item.url} 
        end 
        className={({ isActive }) => 
          isSubItem 
            ? `flex items-center gap-3 pl-12 pr-4 py-2 mx-2 my-0.5 rounded-xl text-sm transition-all duration-300 ${
                isActive 
                  ? "text-primary bg-primary/5 border-l-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`
            : `flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-foreground hover:text-accent-foreground hover:bg-accent/50"
              }`
        }
      >
        <item.icon className={`${isSubItem ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0`} />
        {!isCollapsed && (
          <>
            <span className="truncate flex-1">
              {item.title}
            </span>
            {isPremium && <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
          </>
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
        isCollapsed ? "w-16" : "w-[350px]"
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
                {(isRecruiter && !isAdmin && !isInstituteAdmin ? recruiterItems : adminItems).map((item) => {
                  // Filter logic for different admin types
                  if (isRecruiter && !isAdmin && !isInstituteAdmin) {
                    return <MenuItem key={item.title} item={item} />;
                  }
                  
                  if (isInstituteAdmin && !isAdmin && 
                      item.title !== "Dashboard" &&
                      item.title !== "Batch Management" &&
                      item.title !== "Students Management" && 
                      item.title !== "Students Report" && 
                      item.title !== "Institute Membership Plans") return null;
                  if (item.title === "Institute Membership Plans" && isAdmin && !isInstituteAdmin) return null;
                  if (item.title === "Admin Dashboard" && isInstituteAdmin && !isAdmin) return null;
                  if (item.title === "Dashboard" && !isInstituteAdmin && !isRecruiter) return null;
                  if (item.title === "Students Report" && isAdmin && !isInstituteAdmin) return null;
                  if (item.title === "Institute Management" && !isAdmin) return null;
                  if (item.title === "Batch Management" && !isInstituteAdmin) return null;
                  if (item.title === "Students Management" && !isInstituteAdmin) return null;
                  if (item.title === "User Management" && !isAdmin) return null;
                  if (item.title === "Leader Board Points" && !isAdmin) return null;
                  if ((item.title === "Manage Career Hub" || item.title === "Manage Subscriptions") && !isAdmin) return null;
                  if ((item.title === "Recruiter Dashboard" || item.title === "Post Job") && !isAdmin) return null;
                
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
                  JOB HUNTER 4U
                </h3>
              )}
              <div className="space-y-1">
                {/* Main Menu Items */}
                {mainItems.map((item) => {
                  const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                  return <MenuItem key={item.title} item={item} isPremium={isPremium} />;
                })}

                {/* Career Assignments Section */}
                <div className="mt-4">
                  <button
                    onClick={() => setCareerAssignmentsOpen(!careerAssignmentsOpen)}
                    className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 w-full ${
                      isCareerAssignmentsActive ? 'text-primary' : 'text-foreground hover:text-accent-foreground'
                    }`}
                  >
                    <ClipboardList className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium text-sm">Career Assignments</span>
                        {careerAssignmentsOpen ? (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </>
                    )}
                  </button>
                  {careerAssignmentsOpen && !isCollapsed && (
                    <div className="space-y-1 mt-1">
                      {careerAssignmentItems.map((item) => {
                        const isPremium = item.featureKey ? !canAccessFeature(item.featureKey) : !canAccessFeature("career_assignments");
                        return <MenuItem key={item.title} item={item} isPremium={isPremium} isSubItem={true} />;
                      })}
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="space-y-1">
                      {careerAssignmentItems.map((item) => (
                        <MenuItem key={item.title} item={item} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Hunter Section */}
                <div className="mt-4">
                  <button
                    onClick={() => setJobHunterOpen(!jobHunterOpen)}
                    className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 w-full ${
                      isJobHunterActive ? 'text-primary' : 'text-foreground hover:text-accent-foreground'
                    }`}
                  >
                    <Target className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium text-sm">Job Hunter</span>
                        {jobHunterOpen ? (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </>
                    )}
                  </button>
                  {jobHunterOpen && !isCollapsed && (
                    <div className="space-y-1 mt-1">
                      {jobHunterItems.map((item) => {
                        const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                        return <MenuItem key={item.title} item={item} isPremium={isPremium} isSubItem={true} />;
                      })}
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="space-y-1">
                      {jobHunterItems.map((item) => (
                        <MenuItem key={item.title} item={item} />
                      ))}
                    </div>
                  )}
                </div>

                {/* GitHub Section - Only for IT users */}
                {isIT() && (
                  <div className="mt-4">
                    <button
                      onClick={() => setGitHubOpen(!githubOpen)}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 w-full ${
                        isGitHubActive ? 'text-primary' : 'text-foreground hover:text-accent-foreground'
                      }`}
                    >
                      <Github className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-sm">GitHub Tools</span>
                          {githubOpen ? (
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </>
                      )}
                    </button>
                    {githubOpen && !isCollapsed && (
                      <div className="space-y-1 mt-1">
                        {githubItems.map((item) => {
                          const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                          return <MenuItem key={item.title} item={item} isPremium={isPremium} isSubItem={true} />;
                        })}
                      </div>
                    )}
                    {isCollapsed && (
                      <div className="space-y-1">
                        {githubItems.map((item) => (
                          <MenuItem key={item.title} item={item} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
    </div>
    </TooltipProvider>
  );
}