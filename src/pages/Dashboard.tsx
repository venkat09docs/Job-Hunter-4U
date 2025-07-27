import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { User, Briefcase, Target, TrendingUp, Coins, CreditCard, Eye, Search, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ActivityChart from '@/components/ActivityChart';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { profile, analytics, loading, incrementAnalytics } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of your account.',
      });
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'There was a problem signing you out.',
        variant: 'destructive'
      });
    }
  };

  const handleBuyTokens = () => {
    navigate('/');
    // Scroll to pricing section
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDemoAction = async (actionType: 'resume_open' | 'job_search' | 'ai_query') => {
    await incrementAnalytics(actionType);
    toast({
      title: 'Activity recorded',
      description: `${actionType.replace('_', ' ')} has been logged!`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

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
                  Job Hunter Pro
                </h1>
              </div>
              <UserProfileDropdown />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.username || profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Job Hunter')}!
              </h2>
              <p className="text-muted-foreground">
                Here's your personalized dashboard. Track your progress and manage your job search.
              </p>
            </div>

            {/* Tokens Section */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Remaining Tokens</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {profile?.tokens_remaining || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Use tokens for premium features like AI resume optimization and job matching
                    </p>
                    <Button 
                      onClick={handleBuyTokens}
                      variant="premium" 
                      size="sm"
                      className="gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Buy More Tokens
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Resume Opens
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_resume_opens || 0}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Times your resume was viewed
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDemoAction('resume_open')}
                  >
                    Demo: Track Resume View
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Job Searches
                  </CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_job_searches || 0}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Searches performed
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDemoAction('job_search')}
                  >
                    Demo: Track Job Search
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    AI Queries
                  </CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.total_ai_queries || 0}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI assistance requests
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDemoAction('ai_query')}
                  >
                    Demo: Track AI Query
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart */}
            <div className="mb-8">
              <ActivityChart analytics={analytics} />
            </div>

            {/* Recent Applications */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Your latest job application submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { company: 'TechCorp', position: 'Senior Frontend Developer', status: 'Interview', date: '2 days ago' },
                    { company: 'StartupXYZ', position: 'Full Stack Engineer', status: 'Applied', date: '5 days ago' },
                    { company: 'BigTech Inc', position: 'React Developer', status: 'Rejected', date: '1 week ago' },
                    { company: 'Innovation Labs', position: 'UI/UX Developer', status: 'Applied', date: '1 week ago' },
                  ].map((app, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{app.position}</h4>
                        <p className="text-sm text-muted-foreground">{app.company}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={
                            app.status === 'Interview' ? 'default' : 
                            app.status === 'Applied' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {app.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{app.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;