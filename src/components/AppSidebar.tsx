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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { useUserIndustry } from "@/hooks/useUserIndustry";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, featureKey: null },
  { title: "Level Up", url: "/dashboard/level-up", icon: Trophy, featureKey: null },
  { title: "Build My Profile", url: "/dashboard/build-my-profile", icon: User, featureKey: null },
  { title: "Career Growth Activities", url: "/dashboard/career-growth-activities", icon: TrendingUp, featureKey: "career_growth_activities" },
  { title: "Career Growth Report", url: "/dashboard/career-growth", icon: BarChart3, featureKey: "career_growth_report" },
  { title: "AI-Powered Career Tools", url: "/dashboard/digital-career-hub", icon: Zap, featureKey: "digital-career-hub" },
  { title: "Library", url: "/dashboard/library", icon: Archive, featureKey: "page_resources_library" },
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
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin, isInstituteAdmin, isRecruiter, loading: roleLoading } = useRole();
  const { canAccessFeature } = usePremiumFeatures();
  const { isIT } = useUserIndustry();
  const { theme, setTheme } = useTheme();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [jobHunterOpen, setJobHunterOpen] = useState(true);
  const [githubOpen, setGitHubOpen] = useState(false);
  const [careerAssignmentsOpen, setCareerAssignmentsOpen] = useState(true);
  const [mainMenuOpen, setMainMenuOpen] = useState(true);

  const isCollapsed = !open;

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
  const isMainMenuActive = mainItems.some((i) => isActive(i.url));
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
      isActive 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar className={cn(
      "border-r bg-card/50 backdrop-blur-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* User Profile at Top */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.profile_image_url || ""} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <p className="font-semibold text-lg truncate">
                  {profile?.username || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {profile?.industry || 'Professional'}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="p-2 hover:bg-accent"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>

        <SidebarContent className="flex-1 overflow-y-auto px-2 py-4">
          {(isAdmin || isInstituteAdmin || isRecruiter) && (
            <SidebarGroup>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Administration
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {(isRecruiter && !isAdmin && !isInstituteAdmin ? recruiterItems : adminItems).map((item) => {
                    // For recruiters, show only their items
                    if (isRecruiter && !isAdmin && !isInstituteAdmin) {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} end className={getNavCls}>
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              {!isCollapsed && <span className="font-medium text-sm">{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }
                  
                    // Filter logic for different admin types
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
                  
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="font-medium text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Hide other main items for institute admins and recruiters */}
          {!isInstituteAdmin && !isRecruiter && (
            <SidebarGroup>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Job Hunter Pro
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Main Menu Section */}
                  {!isCollapsed ? (
                    <SidebarMenuItem>
                      <Collapsible open={mainMenuOpen} onOpenChange={setMainMenuOpen}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${isMainMenuActive ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                            <Home className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-sm">Dashboard & Tools</span>
                            {mainMenuOpen ? (
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            ) : (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-1">
                          <SidebarMenuSub>
                            {mainItems.map((item) => {
                              const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                              return (
                                <SidebarMenuSubItem key={item.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink to={item.url} end className={({ isActive }) => 
                                      `flex items-center gap-2 px-6 py-2 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                          ? "text-primary bg-primary/10 border-l-2 border-primary" 
                                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                      }`
                                    }>
                                      <item.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm truncate">{item.title}</span>
                                      {isPremium && <Lock className="h-4 w-4 ml-auto text-muted-foreground" />}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  ) : (
                    // When collapsed, show individual icons for main items
                    <>
                      {mainItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} end className={({ isActive }) => 
                              `flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                isActive 
                                  ? "bg-primary text-primary-foreground shadow-md" 
                                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
                              }`
                            } title={item.title}>
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </>
                  )}

                  {/* Career Assignments Section */}
                  {!isCollapsed ? (
                    <SidebarMenuItem>
                      <Collapsible open={careerAssignmentsOpen} onOpenChange={setCareerAssignmentsOpen}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${isCareerAssignmentsActive ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                            <ClipboardList className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-sm">Career Assignments</span>
                            {careerAssignmentsOpen ? (
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            ) : (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-1">
                          <SidebarMenuSub>
                            {careerAssignmentItems.map((item) => {
                              const isPremium = item.featureKey ? !canAccessFeature(item.featureKey) : !canAccessFeature("career_assignments");
                              return (
                                <SidebarMenuSubItem key={item.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink to={item.url} end className={({ isActive }) => 
                                      `flex items-center gap-2 px-6 py-2 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                          ? "text-primary bg-primary/10 border-l-2 border-primary" 
                                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                      }`
                                    }>
                                      <item.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm truncate">{item.title}</span>
                                      {isPremium && <Lock className="h-4 w-4 ml-auto text-muted-foreground" />}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  ) : (
                    // When collapsed, show individual icons
                    <>
                      {careerAssignmentItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} end className={getNavCls} title={item.title}>
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </>
                  )}

                  {/* Job Hunter Section */}
                  {!isCollapsed ? (
                    <SidebarMenuItem>
                      <Collapsible open={jobHunterOpen} onOpenChange={setJobHunterOpen}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-300 ${isJobHunterActive ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                            <Target className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-sm">Job Hunter</span>
                            {jobHunterOpen ? (
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            ) : (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pb-1">
                          <SidebarMenuSub>
                            {jobHunterItems.map((item) => {
                              const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                              return (
                                <SidebarMenuSubItem key={item.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink to={item.url} end className={({ isActive }) => 
                                      `flex items-center gap-2 px-6 py-2 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                          ? "text-primary bg-primary/10 border-l-2 border-primary" 
                                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                      }`
                                    }>
                                      <item.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm truncate">{item.title}</span>
                                      {isPremium && <Lock className="h-4 w-4 ml-auto text-muted-foreground" />}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  ) : (
                    // When collapsed, show individual icons
                    <>
                      {jobHunterItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} end className={getNavCls} title={item.title}>
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </>
                  )}

                  {/* GitHub Section - Only for IT industry users */}
                  {isIT() && (
                    !isCollapsed ? (
                      <SidebarMenuItem>
                        <Collapsible open={githubOpen} onOpenChange={setGitHubOpen}>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className={`${isGitHubActive ? 'text-primary' : 'text-secondary-foreground'} hover:bg-primary/10 hover:text-primary`}>
                              <Github className="h-5 w-5 flex-shrink-0" />
                              <span className="font-medium text-sm">GitHub Tools</span>
                              {githubOpen ? (
                                <ChevronDown className="h-4 w-4 ml-auto" />
                              ) : (
                                <ChevronRight className="h-4 w-4 ml-auto" />
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {githubItems.map((item) => {
                                const isPremium = item.featureKey && !canAccessFeature(item.featureKey);
                                return (
                                  <SidebarMenuSubItem key={item.title}>
                                    <SidebarMenuSubButton asChild>
                                      <NavLink to={item.url} end className={({ isActive }) => 
                                        `flex items-center gap-2 px-4 py-2 mx-1 my-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                          isActive 
                                            ? "text-primary bg-primary/10" 
                                            : "text-secondary-foreground hover:bg-primary/10 hover:text-primary"
                                        }`
                                      }>
                                        <item.icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs truncate">{item.title}</span>
                                        {isPremium && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    ) : (
                      // GitHub collapsed mode
                      <>
                        {githubItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink to={item.url} end className={getNavCls} title={item.title}>
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {/* Footer with Dark Mode Toggle and Logout */}
        <div className="p-4 border-t space-y-2">
          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Moon className="h-5 w-5 flex-shrink-0" />
            )}
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium">Dark Mode</span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            )}
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </Sidebar>
  );
}