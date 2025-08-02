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
import { ExternalLink, Github, Star, GitFork, Code, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface GitHubTask {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
}

const GITHUB_ACTIVITY_TASKS: GitHubTask[] = [
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

const GitHubActivityTracker = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { tasks, loading, updateTaskStatus } = useGitHubProgress();
  const [localTasks, setLocalTasks] = useState<GitHubTask[]>(GITHUB_ACTIVITY_TASKS);

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
                <Activity className="h-8 w-8" />
                GitHub Activity Tracker
              </h1>
              <p className="text-muted-foreground">
                Track your repository management and engagement activities
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
                <CardTitle>Your GitHub Activity Progress</CardTitle>
                <CardDescription>
                  Track your repository management and engagement activities
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

            {/* Activity Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity & Repository Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <GitFork className="h-4 w-4" />
                      Repository Quality
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure all repositories have clear descriptions, proper README files, and relevant topics.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Consistent Commits
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Maintain a steady commit history to show consistent development activity.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Open Source
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Contribute to open source projects to demonstrate collaboration skills.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      Community Engagement
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Follow other developers, star interesting projects, and engage with the community.
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

export default GitHubActivityTracker;