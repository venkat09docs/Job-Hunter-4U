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
  Bot,
  Briefcase,
  ChevronDown,
  ChevronRight,
  TrendingUp
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Build My Profile", url: "/dashboard/build-my-profile", icon: User },
  { title: "Career Growth Activities", url: "/dashboard/career-growth-activities", icon: TrendingUp },
  { title: "Career Growth Report", url: "/dashboard/career-growth", icon: BarChart3 },
  
  { title: "Super AI", url: "/dashboard/super-ai", icon: Bot },
  { title: "Digital Portfolio", url: "/dashboard/digital-portfolio", icon: Briefcase },
  { title: "Library", url: "/dashboard/library", icon: Archive },
  { title: "Knowledge Base", url: "/dashboard/knowledge-base", icon: BookOpen },
];

const jobHunterItems = [
  { title: "Status View", url: "/dashboard/status-view", icon: BarChart3 },
  { title: "Find Your Next Role", url: "/dashboard/find-your-next-role", icon: Search },
  { title: "Job Tracker", url: "/dashboard/job-tracker", icon: FileText },
  { title: "Job Search History", url: "/dashboard/job-search", icon: Search },
];


const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Students Report", url: "/admin/students-report", icon: BarChart3 },
  { title: "Institute Management", url: "/admin/institute-management", icon: Building },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Institute Membership Plans", url: "/dashboard/institute-membership-plans", icon: CreditCard },
  { title: "Manage Career Hub", url: "/dashboard/manage-career-hub", icon: Wrench },
  { title: "Manage Subscriptions", url: "/dashboard/manage-subscriptions", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin } = useRole();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [jobHunterOpen, setJobHunterOpen] = useState(true);

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
  const isExpanded = mainItems.some((i) => isActive(i.url));
  const isJobHunterActive = jobHunterItems.some((i) => isActive(i.url));
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? "text-primary shadow-sm" 
        : "text-secondary-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm"
    }`;

  return (
    <Sidebar>
      <SidebarContent>

        {(isAdmin || isInstituteAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  // For institute admins, show Admin Dashboard, Students Report and Institute Membership Plans
                  if (isInstituteAdmin && !isAdmin && 
                      item.title !== "Admin Dashboard" && 
                      item.title !== "Students Report" && 
                      item.title !== "Institute Membership Plans") return null;
                  // Hide Students Report for super admin (show only for institute admin)
                  if (item.title === "Students Report" && isAdmin && !isInstituteAdmin) return null;
                  // Show Institute Management only for super admins
                  if (item.title === "Institute Management" && !isAdmin) return null;
                  // Show User Management only for super admins
                  if (item.title === "User Management" && !isAdmin) return null;
                  // Show Manage Career Hub and Subscriptions only for super admins
                  if ((item.title === "Manage Career Hub" || item.title === "Manage Subscriptions") && !isAdmin) return null;
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Hide other main items for institute admins */}
        {!isInstituteAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Job Hunter Pro</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {/* Job Hunter Section */}
                  <SidebarMenuItem>
                    <Collapsible open={jobHunterOpen} onOpenChange={setJobHunterOpen}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={`${isJobHunterActive ? 'text-primary' : 'text-secondary-foreground'} hover:bg-primary/10 hover:text-primary`}>
                          <Target className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm">Job Hunter</span>
                          {jobHunterOpen ? (
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {jobHunterItems.map((item) => (
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
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

      </SidebarContent>
    </Sidebar>
  );
}