import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
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
  Lock
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
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PricingDialog from "./PricingDialog";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Job Search", url: "/dashboard/job-search", icon: Search },
  { title: "Job Tracker", url: "/dashboard/job-tracker", icon: FileText },
  { title: "LinkedIn Automation", url: "/dashboard/linkedin-automation", icon: Linkedin },
  { title: "AI-Powered Career Tools", url: "/dashboard/digital-career-hub", icon: Zap },
  { title: "Talent Screener", url: "/dashboard/talent-screener", icon: Target },
  { title: "My Portfolio", url: "/dashboard/portfolio", icon: User },
  { title: "Blog Dashboard", url: "/dashboard/blog", icon: PenTool },
  { title: "Edit Bio Tree", url: "/dashboard/profile", icon: User },
];

const adminItems = [
  { title: "Manage Career Hub", url: "/dashboard/manage-career-hub", icon: Wrench },
  { title: "Manage Subscriptions", url: "/dashboard/manage-subscriptions", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { canAccessFeature } = usePremiumFeatures();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);

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
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Digital Career Hub</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                // Generate feature key from URL (remove /dashboard prefix)
                const featureKey = item.url.replace('/dashboard/', '').replace('/dashboard', 'dashboard');
                const canAccess = canAccessFeature(featureKey);
                const isPremium = !canAccess;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    {isPremium ? (
                      <SidebarMenuButton asChild>
                        <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
                          <DialogTrigger asChild>
                            <button
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 rounded-md relative"
                              onClick={() => setPricingDialogOpen(true)}
                            >
                              <div className="flex items-center">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">{item.title}</span>
                              </div>
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <PricingDialog />
                          </DialogContent>
                        </Dialog>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          <span className="ml-3">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        <span className="ml-3">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
                      className="hover:bg-muted/50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-3">Bio Link</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground cursor-not-allowed">
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-3">No Bio Link Yet</span>
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
                    className="hover:bg-muted/50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="ml-3">Blogs</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}