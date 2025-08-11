import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Users, MessageSquare, Share2, Heart, UserPlus, CheckCircle, Target, TrendingUp, Activity, ArrowLeft, User, AlertCircle, Award } from 'lucide-react';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface DailyActivity {
  id: string;
  title: string;
  description: string;
  category: 'engagement' | 'networking' | 'content' | 'growth';
  dailyTarget: number;
  weeklyTarget: number;
  unit: string;
}

interface ActivityMetrics {
  [key: string]: number;
}

const DAILY_ACTIVITIES: DailyActivity[] = [
  // Engagement Activities
  { id: 'post_likes', title: 'Like Posts', description: 'Like 10-15 relevant posts in your industry', category: 'engagement', dailyTarget: 15, weeklyTarget: 105, unit: 'likes' },
  { id: 'comments', title: 'Meaningful Comments', description: 'Leave 5-8 thoughtful comments on posts', category: 'engagement', dailyTarget: 8, weeklyTarget: 56, unit: 'comments' },
  { id: 'shares', title: 'Share Content', description: 'Share 2-3 valuable posts with your network', category: 'engagement', dailyTarget: 3, weeklyTarget: 21, unit: 'shares' },
  
  // Networking Activities
  { id: 'connection_requests', title: 'Send Connection Requests', description: 'Send 5-10 personalized connection requests', category: 'networking', dailyTarget: 10, weeklyTarget: 70, unit: 'requests' },
  { id: 'follow_up', title: 'Follow Up Messages', description: 'Send 3-5 follow-up messages to recent connections', category: 'networking', dailyTarget: 5, weeklyTarget: 35, unit: 'messages' },
  { id: 'industry_groups', title: 'Engage in Groups', description: 'Participate in 2-3 industry group discussions', category: 'networking', dailyTarget: 3, weeklyTarget: 21, unit: 'discussions' },
  
  // Content Activities
  { id: 'create_post', title: 'Create Original Post', description: 'Share an original post about your expertise', category: 'content', dailyTarget: 1, weeklyTarget: 7, unit: 'posts' },
  { id: 'article_draft', title: 'Work on Article', description: 'Draft or publish LinkedIn article content', category: 'content', dailyTarget: 1, weeklyTarget: 7, unit: 'sessions' },
  
  // Growth Activities
  { id: 'profile_views', title: 'Profile Optimization', description: 'Review and update profile sections', category: 'growth', dailyTarget: 1, weeklyTarget: 7, unit: 'sessions' },
  { id: 'industry_research', title: 'Industry Research', description: 'Research and follow industry leaders', category: 'growth', dailyTarget: 5, weeklyTarget: 35, unit: 'profiles' },
];

const LinkedInNetwork = () => {
  const { updateTaskCompletion, updateMetrics, getTodayMetrics, getCompletedTasks, getWeeklyMetrics, getLastWeekMetrics } = useLinkedInNetworkProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics>({});
  const [weeklyMetrics, setWeeklyMetrics] = useState<ActivityMetrics>({});
  const [lastWeekMetrics, setLastWeekMetrics] = useState<ActivityMetrics>({});
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const loadData = useCallback(async (dateKey: string) => {
    const [metrics, tasks, currentWeekMetrics, lastWeekMetricsData] = await Promise.all([
      getTodayMetrics(dateKey),
      getCompletedTasks(dateKey),
      getWeeklyMetrics(),
      getLastWeekMetrics()
    ]);
    
    // Calculate completion percentage for selected date
    const completedCount = tasks.length;
    const percentage = Math.round((completedCount / DAILY_ACTIVITIES.length) * 100);
    
    // Single state update to prevent flickering
    setTodayMetrics(metrics);
    setCompletedTasks(new Set(tasks));
    setCompletionPercentage(percentage);
    setWeeklyMetrics(currentWeekMetrics);
    setLastWeekMetrics(lastWeekMetricsData);
  }, [getTodayMetrics, getCompletedTasks, getWeeklyMetrics, getLastWeekMetrics]);

  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    loadData(dateKey);
  }, [selectedDate, loadData]);

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      // Find the activity to get target value
      const activity = DAILY_ACTIVITIES.find(a => a.id === taskId);
      if (activity?.dailyTarget) {
        const currentMetric = todayMetrics[taskId] || 0;
        if (currentMetric < activity.dailyTarget) {
          toast({
            title: 'Cannot Complete Task',
            description: `Please enter at least ${activity.dailyTarget} ${activity.unit} to mark this task as completed`,
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
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday as start
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getActivityStatus = (activityId: string) => {
    const activity = DAILY_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return 'neutral';
    
    const weeklyTotal = weeklyMetrics[activityId] || 0;
    if (weeklyTotal >= activity.weeklyTarget) return 'success';
    if (weeklyTotal >= activity.weeklyTarget * 0.7) return 'warning';
    return 'danger';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'danger':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const weekDates = generateWeekDates();

  return (
    <div className="min-h-screen flex w-full bg-gradient-hero">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/my-profile-journey')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Go to My Profile Journey
              </Button>
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
            {/* Last Week Performance */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Last Week Performance
                  </CardTitle>
                  <CardDescription>
                    Review your previous week's LinkedIn networking achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    {DAILY_ACTIVITIES.slice(0, 4).map((activity) => {
                      const lastWeekValue = lastWeekMetrics[activity.id] || 0;
                      const targetMet = lastWeekValue >= activity.weeklyTarget;
                      return (
                        <div key={activity.id} className="text-center p-4 rounded-lg border bg-card">
                          <div className={`text-2xl font-bold ${targetMet ? 'text-green-500' : 'text-red-500'}`}>
                            {lastWeekValue}
                          </div>
                          <div className="text-sm text-muted-foreground">{activity.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Target: {activity.weeklyTarget} {activity.unit}
                          </div>
                          {targetMet ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 mx-auto mt-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Week Progress Overview */}
            <div className="mb-8">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Current Week Progress
                  </CardTitle>
                  <CardDescription>
                    Track your daily LinkedIn networking activities and weekly targets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Today's Progress</span>
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
                    {DAILY_ACTIVITIES.map((activity) => {
                      const weeklyTotal = weeklyMetrics[activity.id] || 0;
                      const status = getActivityStatus(activity.id);
                      
                      return (
                        <div key={activity.id} className={`border rounded-lg p-4 space-y-3 ${getStatusColor(status)}`}>
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
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder={`Daily: ${activity.dailyTarget} ${activity.unit}`}
                                value={todayMetrics[activity.id] || ''}
                                onChange={(e) => handleMetricUpdate(activity.id, parseInt(e.target.value) || 0)}
                                className="flex-1 h-8 text-sm"
                                min="0"
                                max={activity.dailyTarget * 2}
                              />
                              <span className="text-xs text-muted-foreground">
                                / {activity.dailyTarget}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Weekly: {weeklyTotal} / {activity.weeklyTarget} {activity.unit}
                              </span>
                              <div className="flex items-center gap-1">
                                {status === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                                {status === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-600" />}
                                {status === 'danger' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                <span className={
                                  status === 'success' ? 'text-green-600' :
                                  status === 'warning' ? 'text-yellow-600' :
                                  status === 'danger' ? 'text-red-600' : 'text-gray-600'
                                }>
                                  {Math.round((weeklyTotal / activity.weeklyTarget) * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {completedTasks.has(activity.id) && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Completed Today</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
  );
};

export default LinkedInNetwork;