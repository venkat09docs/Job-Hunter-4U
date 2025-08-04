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
  Archive
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Find Your Next Role", url: "/dashboard/find-your-next-role", icon: Search },
  { title: "Job Tracker", url: "/dashboard/job-tracker", icon: FileText },
  { title: "Job Search", url: "/dashboard/job-search", icon: Search },
  // Hidden items (keep for future): LinkedIn Automation, Talent Screener
  // { title: "LinkedIn Automation", url: "/dashboard/linkedin-automation", icon: Linkedin },
  // { title: "Talent Screener", url: "/dashboard/talent-screener", icon: Target },
  { title: "AI-Powered Career Tools", url: "/dashboard/digital-career-hub", icon: Zap },
  { title: "Blog Dashboard", url: "/dashboard/blog", icon: PenTool },
  { title: "Edit Bio Tree", url: "/dashboard/profile", icon: User },
  { title: "Library", url: "/dashboard/library", icon: Archive },
];


const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "User Management", url: "/admin/users", icon: Users },
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
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
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
                  // For institute admins, only show Admin Dashboard
                  if (isInstituteAdmin && !isAdmin && item.title !== "Admin Dashboard") return null;
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
          <SidebarGroup>
            <SidebarGroupLabel>Digital Career Hub</SidebarGroupLabel>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Show Public URLs only for regular users, not admins */}
        {!isAdmin && !isInstituteAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Public URLs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {userSlug ? (
                      <a 
                        href={`/profile/${userSlug}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
                      >
                        <ExternalLink className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium text-sm">Bio Link</span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg text-sm font-medium text-muted-foreground cursor-not-allowed">
                        <ExternalLink className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium text-sm">No Bio Link Yet</span>
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a 
                      href="/blogs"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg text-sm font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
                    >
                      <ExternalLink className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm">Blogs</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}