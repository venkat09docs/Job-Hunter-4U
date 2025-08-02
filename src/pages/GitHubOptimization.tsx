import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github, Star, GitFork, Code, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface GitHubTask {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
}

const GITHUB_TASKS: GitHubTask[] = [
  // Profile Setup
  {
    id: 'profile_picture',
    title: 'Add a professional profile picture',
    description: 'Upload a clear, professional headshot or avatar',
    category: 'Profile Setup',
    completed: false
  },
  {
    id: 'bio',
    title: 'Write a compelling bio',
    description: 'Add a brief description about yourself and your expertise',
    category: 'Profile Setup',
    completed: false
  },
  {
    id: 'location',
    title: 'Add your location',
    description: 'Include your current city or region',
    category: 'Profile Setup',
    completed: false
  },
  {
    id: 'company',
    title: 'Add your current company/organization',
    description: 'Show where you currently work or study',
    category: 'Profile Setup',
    completed: false
  },
  {
    id: 'website',
    title: 'Add your personal website or portfolio',
    description: 'Link to your portfolio, blog, or personal website',
    category: 'Profile Setup',
    completed: false
  },

  // Repository Management
  {
    id: 'pinned_repos',
    title: 'Pin your best repositories',
    description: 'Pin 6 repositories that showcase your best work',
    category: 'Repository Management',
    completed: false
  },
  {
    id: 'repo_descriptions',
    title: 'Add descriptions to your repositories',
    description: 'Write clear descriptions for all your public repositories',
    category: 'Repository Management',
    completed: false
  },
  {
    id: 'readme_files',
    title: 'Create README files for major projects',
    description: 'Add comprehensive README files with setup instructions and project details',
    category: 'Repository Management',
    completed: false
  },
  {
    id: 'topics_tags',
    title: 'Add topics/tags to repositories',
    description: 'Use relevant topics to make your repositories discoverable',
    category: 'Repository Management',
    completed: false
  },
  {
    id: 'license',
    title: 'Add licenses to your repositories',
    description: 'Include appropriate licenses for your open-source projects',
    category: 'Repository Management',
    completed: false
  },

  // Activity & Engagement
  {
    id: 'regular_commits',
    title: 'Maintain regular commit activity',
    description: 'Keep your GitHub activity consistent with regular commits',
    category: 'Activity & Engagement',
    completed: false
  },
  {
    id: 'contribute_opensource',
    title: 'Contribute to open-source projects',
    description: 'Make contributions to other repositories and open-source projects',
    category: 'Activity & Engagement',
    completed: false
  },
  {
    id: 'github_pages',
    title: 'Set up GitHub Pages',
    description: 'Use GitHub Pages to host your portfolio or project demos',
    category: 'Activity & Engagement',
    completed: false
  },
  {
    id: 'follow_developers',
    title: 'Follow other developers',
    description: 'Build your network by following interesting developers and organizations',
    category: 'Activity & Engagement',
    completed: false
  }
];

const GitHubOptimization = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tasks, loading, updateTaskStatus } = useGitHubProgress();
  const [localTasks, setLocalTasks] = useState<GitHubTask[]>(GITHUB_TASKS);

  useEffect(() => {
    if (!loading && tasks.length > 0) {
      setLocalTasks(prev => 
        prev.map(task => ({
          ...task,
          completed: tasks.some(t => t.task_id === task.id && t.completed)
        }))
      );
    }
  }, [tasks, loading]);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTaskStatus(taskId, completed);
      setLocalTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed } : task
        )
      );
      toast.success(completed ? 'Task completed!' : 'Task marked as incomplete');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleGoToGitHub = () => {
    const githubUrl = profile?.github_url;
    if (githubUrl) {
      window.open(githubUrl, '_blank');
    } else {
      window.open('https://github.com', '_blank');
    }
  };

  const completedTasks = localTasks.filter(task => task.completed).length;
  const totalTasks = localTasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  const groupedTasks = localTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, GitHubTask[]>);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between p-6 border-b">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex items-center gap-4">
                <SubscriptionUpgrade />
                <UserProfileDropdown />
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between p-6 border-b">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Github className="h-8 w-8" />
                GitHub Profile Optimization
              </h1>
              <p className="text-muted-foreground">
                Optimize your GitHub profile to showcase your coding skills and attract opportunities
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleGoToGitHub} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View My GitHub
              </Button>
              <SubscriptionUpgrade />
              <UserProfileDropdown />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Your GitHub Optimization Progress</CardTitle>
                <CardDescription>
                  Complete these tasks to optimize your GitHub profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{completionPercentage}% Complete</span>
                    <Badge variant="secondary">
                      {completedTasks} of {totalTasks} tasks completed
                    </Badge>
                  </div>
                  <Progress value={completionPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Task Categories */}
            {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
              const categoryCompleted = categoryTasks.filter(task => task.completed).length;
              const categoryTotal = categoryTasks.length;
              const categoryProgress = Math.round((categoryCompleted / categoryTotal) * 100);

              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {category === 'Profile Setup' && <Users className="h-5 w-5" />}
                        {category === 'Repository Management' && <Code className="h-5 w-5" />}
                        {category === 'Activity & Engagement' && <Star className="h-5 w-5" />}
                        {category}
                      </CardTitle>
                      <Badge variant="outline">
                        {categoryCompleted}/{categoryTotal}
                      </Badge>
                    </div>
                    <Progress value={categoryProgress} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryTasks.map((task) => (
                        <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <Checkbox
                            id={task.id}
                            checked={task.completed}
                            onCheckedChange={(checked) => 
                              handleTaskToggle(task.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <label
                              htmlFor={task.id}
                              className={`text-sm font-medium cursor-pointer ${
                                task.completed ? 'line-through text-muted-foreground' : ''
                              }`}
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

            {/* Pro Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Pro Tips for GitHub Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <GitFork className="h-4 w-4" />
                      Showcase Your Best Work
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Pin repositories that demonstrate your skills and include live demos when possible.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Write Quality Code
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use consistent coding standards, meaningful commit messages, and proper documentation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Engage with Community
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Contribute to open source, participate in discussions, and help others.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Stay Consistent
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Maintain regular activity and keep your profile updated with recent projects.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default GitHubOptimization;