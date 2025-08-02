import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Linkedin, CheckCircle, Target, ExternalLink } from 'lucide-react';

interface LinkedInTask {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
}

const LINKEDIN_TASKS: Omit<LinkedInTask, 'completed'>[] = [
  // Profile Basics
  { id: 'profile-photo', title: 'Professional Profile Photo', description: 'Upload a high-quality, professional headshot', category: 'Profile Basics' },
  { id: 'headline', title: 'Compelling Headline', description: 'Write a compelling headline that showcases your value proposition', category: 'Profile Basics' },
  { id: 'about-section', title: 'About Section', description: 'Craft a compelling about section (summary) with keywords', category: 'Profile Basics' },
  { id: 'location', title: 'Location & Industry', description: 'Add your current location and industry', category: 'Profile Basics' },
  
  // Experience & Education
  { id: 'current-position', title: 'Current Position', description: 'Add your current job with detailed description', category: 'Experience' },
  { id: 'work-experience', title: 'Work Experience', description: 'Add all relevant work experiences with achievements', category: 'Experience' },
  { id: 'education', title: 'Education Details', description: 'Complete your education section with degrees and certifications', category: 'Experience' },
  
  // Skills & Endorsements
  { id: 'skills', title: 'Add Skills', description: 'Add relevant skills (aim for 50+ skills)', category: 'Skills' },
  { id: 'endorsements', title: 'Get Endorsements', description: 'Request endorsements from colleagues and connections', category: 'Skills' },
  
];

const LinkedInOptimization = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<LinkedInTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLinkedInProgress();
    }
  }, [user]);

  const loadLinkedInProgress = async () => {
    try {
      // Use localStorage for now as a temporary solution
      const savedProgress = localStorage.getItem(`linkedin_progress_${user?.id}`);
      const completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
      
      const tasksWithStatus = LINKEDIN_TASKS.map(task => ({
        ...task,
        completed: completedTasks.includes(task.id)
      }));

      setTasks(tasksWithStatus);
    } catch (error) {
      console.error('Error loading LinkedIn progress:', error);
      // Initialize with default tasks if error
      setTasks(LINKEDIN_TASKS.map(task => ({ ...task, completed: false })));
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    try {
      // Use localStorage for now
      const savedProgress = localStorage.getItem(`linkedin_progress_${user?.id}`);
      let completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
      
      if (completed) {
        if (!completedTasks.includes(taskId)) {
          completedTasks.push(taskId);
        }
      } else {
        completedTasks = completedTasks.filter((id: string) => id !== taskId);
      }
      
      localStorage.setItem(`linkedin_progress_${user?.id}`, JSON.stringify(completedTasks));

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));

      toast({
        title: completed ? 'Task completed!' : 'Task unchecked',
        description: completed ? 'Great progress on your LinkedIn optimization!' : 'Task marked as incomplete',
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleGoToLinkedIn = () => {
    if (!profile?.linkedin_url) {
      toast({
        title: 'LinkedIn URL not configured',
        description: 'Please configure your LinkedIn URL in Settings > Professional Details',
        variant: 'destructive'
      });
      return;
    }

    window.open(profile.linkedin_url, '_blank');
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, LinkedInTask[]>);

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
                  LinkedIn Profile Optimization
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
            {/* Progress Overview */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-primary" />
                    LinkedIn Optimization Progress
                  </CardTitle>
                  <CardDescription>
                    Complete these tasks to optimize your LinkedIn profile for maximum visibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">{completedCount} / {totalTasks} completed</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                    </div>
                    <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-lg px-3 py-1">
                      {completionPercentage}%
                    </Badge>
                  </div>
                  
                  {completionPercentage === 100 && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 dark:text-green-200 font-medium">
                        Congratulations! Your LinkedIn profile is fully optimized!
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Task Categories */}
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
                const categoryCompleted = categoryTasks.filter(task => task.completed).length;
                const categoryTotal = categoryTasks.length;
                const categoryPercentage = Math.round((categoryCompleted / categoryTotal) * 100);

                return (
                  <Card key={category} className="shadow-elegant">
                    <CardHeader>
                     <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          {category}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGoToLinkedIn}
                            className="gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Go to LinkedIn
                          </Button>
                          <Badge variant="outline">
                            {categoryCompleted}/{categoryTotal}
                          </Badge>
                        </div>
                      </CardTitle>
                      <Progress value={categoryPercentage} className="h-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryTasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                            <Checkbox
                              id={task.id}
                              checked={task.completed}
                              onCheckedChange={(checked) => updateTaskStatus(task.id, !!checked)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <label
                                htmlFor={task.id}
                                className={`font-medium cursor-pointer ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                              >
                                {task.title}
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pro Tips */}
            <div className="mt-8">
              <Card className="shadow-elegant border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    Pro Tips for LinkedIn Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Use keywords relevant to your industry throughout your profile</li>
                    <li>• Post content consistently (aim for 2-3 times per week)</li>
                    <li>• Engage with others' content before sharing your own</li>
                    <li>• Personalize connection requests with a brief message</li>
                    <li>• Update your profile regularly to stay current</li>
                    <li>• Use LinkedIn's "Open to Work" feature when job searching</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LinkedInOptimization;