import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Users, MessageSquare, Share2, Heart, UserPlus, CheckCircle, Target, TrendingUp, Activity } from 'lucide-react';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek } from 'date-fns';

interface DailyActivity {
  id: string;
  title: string;
  description: string;
  category: 'engagement' | 'networking' | 'content' | 'growth';
  targetValue?: number;
  unit?: string;
}

interface ActivityMetrics {
  [key: string]: number;
}

const DAILY_ACTIVITIES: DailyActivity[] = [
  // Engagement Activities
  { id: 'post_likes', title: 'Like Posts', description: 'Like 10-15 relevant posts in your industry', category: 'engagement', targetValue: 15, unit: 'likes' },
  { id: 'comments', title: 'Meaningful Comments', description: 'Leave 5-8 thoughtful comments on posts', category: 'engagement', targetValue: 8, unit: 'comments' },
  { id: 'shares', title: 'Share Content', description: 'Share 2-3 valuable posts with your network', category: 'engagement', targetValue: 3, unit: 'shares' },
  
  // Networking Activities
  { id: 'connection_requests', title: 'Send Connection Requests', description: 'Send 5-10 personalized connection requests', category: 'networking', targetValue: 10, unit: 'requests' },
  { id: 'follow_up', title: 'Follow Up Messages', description: 'Send 3-5 follow-up messages to recent connections', category: 'networking', targetValue: 5, unit: 'messages' },
  { id: 'industry_groups', title: 'Engage in Groups', description: 'Participate in 2-3 industry group discussions', category: 'networking', targetValue: 3, unit: 'discussions' },
  
  // Content Activities
  { id: 'create_post', title: 'Create Original Post', description: 'Share an original post about your expertise', category: 'content', targetValue: 1, unit: 'post' },
  { id: 'article_draft', title: 'Work on Article', description: 'Draft or publish LinkedIn article content', category: 'content', targetValue: 1, unit: 'session' },
  
  // Growth Activities
  { id: 'profile_views', title: 'Profile Optimization', description: 'Review and update profile sections', category: 'growth', targetValue: 1, unit: 'session' },
  { id: 'industry_research', title: 'Industry Research', description: 'Research and follow industry leaders', category: 'growth', targetValue: 5, unit: 'profiles' },
];

const LinkedInNetwork = () => {
  const { updateTaskCompletion, updateMetrics, getTodayMetrics, getCompletedTasks } = useLinkedInNetworkProgress();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics>({});
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const [metrics, tasks] = await Promise.all([
        getTodayMetrics(dateKey),
        getCompletedTasks(dateKey)
      ]);
      
      // Calculate completion percentage for selected date
      const completedCount = tasks.length;
      const percentage = Math.round((completedCount / DAILY_ACTIVITIES.length) * 100);
      
      // Batch state updates to prevent flickering
      setTodayMetrics(metrics);
      setCompletedTasks(new Set(tasks));
      setCompletionPercentage(percentage);
    };

    loadData();
  }, [selectedDate, getTodayMetrics, getCompletedTasks]);

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      // Find the activity to get target value
      const activity = DAILY_ACTIVITIES.find(a => a.id === taskId);
      if (activity?.targetValue) {
        const currentMetric = todayMetrics[taskId] || 0;
        if (currentMetric < activity.targetValue) {
          toast({
            title: 'Cannot Complete Task',
            description: `Please enter at least ${activity.targetValue} ${activity.unit} to mark this task as completed`,
            variant: 'destructive',
          });
          return;
        }
      }
    }
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    updateTaskCompletion(taskId, checked, dateKey);
    
    const newCompleted = new Set(completedTasks);
    if (checked) {
      newCompleted.add(taskId);
    } else {
      newCompleted.delete(taskId);
    }
    setCompletedTasks(newCompleted);
    
    // Update completion percentage immediately
    const newCompletedCount = newCompleted.size;
    const newPercentage = Math.round((newCompletedCount / DAILY_ACTIVITIES.length) * 100);
    setCompletionPercentage(newPercentage);
    
    toast({
      title: checked ? 'Task Completed!' : 'Task Unchecked',
      description: `${DAILY_ACTIVITIES.find(a => a.id === taskId)?.title} ${checked ? 'marked as completed' : 'unmarked'}`,
    });
  };

  const handleMetricUpdate = (activityId: string, value: number) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    updateMetrics(activityId, value, dateKey);
    setTodayMetrics(prev => ({ ...prev, [activityId]: value }));
    
    toast({
      title: 'Metrics Updated',
      description: 'Your daily metrics have been recorded!',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement':
        return <Heart className="h-4 w-4" />;
      case 'networking':
        return <Users className="h-4 w-4" />;
      case 'content':
        return <MessageSquare className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engagement':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'networking':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'content':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'growth':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const generateWeekDates = () => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDates = generateWeekDates();

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
                  LinkedIn Network Management
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
                    <Target className="h-5 w-5 text-primary" />
                    Network Growth Progress
                  </CardTitle>
                  <CardDescription>
                    Track your daily LinkedIn networking activities and overall growth
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{completedTasks.size}</div>
                      <div className="text-xs text-muted-foreground">Tasks Completed Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Week Calendar */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Weekly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date) => (
                      <Button
                        key={date.toISOString()}
                        variant={format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'default' : 'outline'}
                        className="flex flex-col h-16 p-2"
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="text-xs">{format(date, 'EEE')}</span>
                        <span className="text-lg">{format(date, 'd')}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Activities */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Daily Activities - {format(selectedDate, 'MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    Complete these networking activities to grow your LinkedIn presence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {DAILY_ACTIVITIES.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={activity.id}
                              checked={completedTasks.has(activity.id)}
                              onCheckedChange={(checked) => handleTaskToggle(activity.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <label 
                                htmlFor={activity.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {activity.title}
                              </label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={getCategoryColor(activity.category)}>
                            {getCategoryIcon(activity.category)}
                            <span className="ml-1 capitalize">{activity.category}</span>
                          </Badge>
                        </div>
                        
                        {activity.targetValue && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={`Target: ${activity.targetValue} ${activity.unit}`}
                              value={todayMetrics[activity.id] || ''}
                              onChange={(e) => handleMetricUpdate(activity.id, parseInt(e.target.value) || 0)}
                              className="flex-1 h-8 text-sm"
                              min="0"
                              max={activity.targetValue * 2}
                            />
                            <span className="text-xs text-muted-foreground">
                              / {activity.targetValue} {activity.unit}
                            </span>
                          </div>
                        )}
                        
                        {completedTasks.has(activity.id) && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">Completed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Summary */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Today's Metrics Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-blue-500">
                        {todayMetrics.connection_requests || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Connection Requests</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-rose-500">
                        {todayMetrics.post_likes || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Posts Liked</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-purple-500">
                        {todayMetrics.comments || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Comments Made</div>
                    </div>
                    <div className="text-center p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-green-500">
                        {Object.values(todayMetrics).reduce((sum, val) => sum + val, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Actions</div>
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

export default LinkedInNetwork;