import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyProfileJourney = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  My Profile Journey
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <SubscriptionStatus />
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            {/* 6-Step Process */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Job Search Journey
                  </CardTitle>
                  <CardDescription>
                    Follow these 6 essential steps to maximize your career opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/resume-builder')}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Resume & Cover Letter</h4>
                        <p className="text-sm text-muted-foreground">Craft compelling documents</p>
                      </div>
                    </div>
                    
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/linkedin-optimization')}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">LinkedIn Profile</h4>
                        <p className="text-sm text-muted-foreground">Optimize your professional presence</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">GitHub & Blog Management</h4>
                        <p className="text-sm text-muted-foreground">Showcase your technical skills</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Job Search</h4>
                        <p className="text-sm text-muted-foreground">Find and apply to opportunities</p>
                      </div>
                    </div>
                    
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/career-growth-activities?tab=networking')}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        5
                      </div>
                      <div>
                        <h4 className="font-medium">LinkedIn Network</h4>
                        <p className="text-sm text-muted-foreground">Build meaningful connections</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        6
                      </div>
                      <div>
                        <h4 className="font-medium">Enhancements</h4>
                        <p className="text-sm text-muted-foreground">Continuous improvement</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MyProfileJourney;