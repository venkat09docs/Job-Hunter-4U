import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Search, ClipboardList, Zap, History } from "lucide-react";

const JobHunterLevelUp = () => {
  const navigate = useNavigate();

  const boards = [
    {
      id: 1,
      title: "Find Your Next Role",
      description: "Discover opportunities that match your skills",
      icon: Search,
      route: "/dashboard/find-your-next-role",
      color: "text-primary",
    },
    {
      id: 2,
      title: "Job Tracker",
      description: "Track your applications and interviews",
      icon: ClipboardList,
      route: "/dashboard/job-tracker",
      color: "text-secondary",
    },
    {
      id: 3,
      title: "Automate Job Hunting",
      description: "Streamline your job search process",
      icon: Zap,
      route: "/dashboard/job-hunting-assignments",
      color: "text-accent",
    },
    {
      id: 4,
      title: "Job Search History",
      description: "Review your past applications",
      icon: History,
      route: "/dashboard/job-search",
      color: "text-muted-foreground",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl md:text-2xl font-bold">Job Hunter Level Up</h1>
              </div>
              <UserProfileDropdown />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Your Job Hunting Dashboard</h2>
                <p className="text-muted-foreground">
                  Navigate through different tools to accelerate your job search
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {boards.map((board) => {
                  const Icon = board.icon;
                  return (
                    <Card
                      key={board.id}
                      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary"
                      onClick={() => navigate(board.route)}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                          <div className="p-5 rounded-full bg-primary/10 border-2 border-primary/20">
                            <Icon className={`h-10 w-10 ${board.color} stroke-[2.5]`} />
                          </div>
                        </div>
                        <CardTitle className="text-lg font-bold">{board.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <CardDescription className="text-sm">{board.description}</CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default JobHunterLevelUp;
