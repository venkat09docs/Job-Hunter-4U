import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Search, ClipboardList, Zap, History, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const JobHunterLevelUp = () => {
  const navigate = useNavigate();

  const boards = [
    {
      id: 1,
      title: "Find Your Next Role",
      description: "Discover opportunities that match your skills and experience",
      icon: Search,
      route: "/dashboard/find-your-next-role",
      gradient: "from-[hsl(var(--info))] to-[hsl(var(--cyan))]",
      iconBg: "bg-[hsl(var(--info))]/10",
      iconColor: "text-[hsl(var(--info))]",
      badge: "Smart Search",
    },
    {
      id: 2,
      title: "Job Tracker",
      description: "Track applications, interviews, and follow-ups seamlessly",
      icon: ClipboardList,
      route: "/dashboard/job-tracker",
      gradient: "from-[hsl(var(--emerald))] to-[hsl(var(--success))]",
      iconBg: "bg-[hsl(var(--emerald))]/10",
      iconColor: "text-[hsl(var(--emerald))]",
      badge: "Organize",
    },
    {
      id: 3,
      title: "Automate Job Hunting",
      description: "Let AI streamline your entire job search process",
      icon: Zap,
      route: "/dashboard/automate-job-hunting",
      gradient: "from-[hsl(var(--warning))] to-[hsl(var(--amber))]",
      iconBg: "bg-[hsl(var(--warning))]/10",
      iconColor: "text-[hsl(var(--warning))]",
      badge: "AI Powered",
    },
    {
      id: 4,
      title: "Job Search History",
      description: "Review past applications and learn from your journey",
      icon: History,
      route: "/dashboard/job-search",
      gradient: "from-[hsl(var(--violet))] to-[hsl(var(--purple))]",
      iconBg: "bg-[hsl(var(--violet))]/10",
      iconColor: "text-[hsl(var(--violet))]",
      badge: "Insights",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[hsl(var(--info))] to-[hsl(var(--cyan))] flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Job Hunter Level Up
                  </h1>
                </div>
              </div>
              <UserProfileDropdown />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 bg-gradient-to-br from-background via-[hsl(var(--primary))]/5 to-background">
            <div className="max-w-7xl mx-auto">
              {/* Hero Section */}
              <div className="mb-12 text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <span className="text-sm font-medium text-[hsl(var(--primary))]">Accelerate Your Career</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Your Job Hunting Dashboard
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Navigate through powerful tools designed to accelerate your job search and land your dream role
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {boards.map((board, index) => {
                  const Icon = board.icon;
                  return (
                    <Card
                      key={board.id}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-2 hover:border-transparent animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => navigate(board.route)}
                    >
                      {/* Gradient Background on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${board.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                      
                      <CardHeader className="relative pb-4">
                        {/* Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <Badge 
                            variant="secondary" 
                            className={`${board.iconBg} border-0 ${board.iconColor} font-medium`}
                          >
                            {board.badge}
                          </Badge>
                          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                        </div>
                        
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                          <div className={`relative p-6 rounded-2xl ${board.iconBg} border-2 border-transparent group-hover:border-current transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${board.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                            <Icon className={`relative h-12 w-12 ${board.iconColor} stroke-[2]`} />
                          </div>
                        </div>
                        
                        {/* Title */}
                        <CardTitle className="text-xl font-bold text-center mb-2 group-hover:text-[hsl(var(--primary))] transition-colors duration-300">
                          {board.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="relative text-center pt-0">
                        <CardDescription className="text-sm leading-relaxed">
                          {board.description}
                        </CardDescription>
                      </CardContent>

                      {/* Bottom Gradient Line */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${board.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                    </Card>
                  );
                })}
              </div>

              {/* Bottom CTA Section */}
              <div className="mt-16 text-center animate-fade-in p-8 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))]/5 to-[hsl(var(--secondary))]/5 border border-[hsl(var(--primary))]/10">
                <h3 className="text-2xl font-bold mb-3">Ready to Level Up Your Job Hunt?</h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Choose any tool above to get started. Each feature is designed to give you a competitive edge in your job search.
                </p>
                <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--info))]" />
                    <span>Real-time Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" />
                    <span>Smart Automation</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default JobHunterLevelUp;
