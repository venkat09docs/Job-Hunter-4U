import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface InputValues {
  [key: string]: string | number;
}

const DAILY_ACTIVITIES: DailyActivity[] = [
  // Engagement Activities
  { id: 'post_likes', title: 'Like Posts', description: 'Like relevant posts in your industry', category: 'engagement', dailyTarget: 3, weeklyTarget: 15, unit: 'likes' },
  { id: 'comments', title: 'Comments', description: 'Leave thoughtful comments on posts', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'comments' },
  { id: 'content', title: 'Content', description: 'Share valuable content with your network', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'shares' },
  
  // Networking Activities
  { id: 'connection_requests', title: 'Connection', description: 'Send personalized connection requests', category: 'networking', dailyTarget: 2, weeklyTarget: 10, unit: 'requests' },
  { id: 'follow_up', title: 'Follow Up Messages', description: 'Send follow-up messages to recent connections', category: 'networking', dailyTarget: 1, weeklyTarget: 5, unit: 'messages' },
  { id: 'industry_groups', title: 'Engage in Groups', description: 'Participate in industry group discussions', category: 'networking', dailyTarget: 1, weeklyTarget: 5, unit: 'discussions' },
  
  // Content Activities
  { id: 'create_post', title: 'Create Original Post', description: 'Share an original post about your expertise', category: 'content', dailyTarget: 1, weeklyTarget: 5, unit: 'posts' },
  { id: 'article_draft', title: 'Work on Article', description: 'Draft or publish LinkedIn article content', category: 'content', dailyTarget: 1, weeklyTarget: 5, unit: 'sessions' },
  
  // Growth Activities
  { id: 'profile_optimization', title: 'Profile Optimization', description: 'Review and update profile sections', category: 'growth', dailyTarget: 0, weeklyTarget: 1, unit: 'sessions' },
  { id: 'industry_research', title: 'Industry Research', description: 'Research and follow industry leaders', category: 'growth', dailyTarget: 1, weeklyTarget: 5, unit: 'profiles' },
];

const LinkedInNetwork = () => {
  const { updateMetrics, getTodayMetrics, getWeeklyMetrics, getLastWeekMetrics } = useLinkedInNetworkProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics>({});
  const [weeklyMetrics, setWeeklyMetrics] = useState<ActivityMetrics>({});
  const [lastWeekMetrics, setLastWeekMetrics] = useState<ActivityMetrics>({});
  const [inputValues, setInputValues] = useState<InputValues>({});

  const loadData = useCallback(async (dateKey: string) => {
    console.log('Loading data for date:', dateKey);
    const [metrics, currentWeekMetrics, lastWeekMetricsData] = await Promise.all([
      getTodayMetrics(dateKey),
      getWeeklyMetrics(),
      getLastWeekMetrics()
    ]);
    
    console.log('Loaded metrics for', dateKey, ':', metrics);
    console.log('Current week metrics:', currentWeekMetrics);
    console.log('Last week metrics:', lastWeekMetricsData);
    
    setTodayMetrics(metrics);
    setWeeklyMetrics(currentWeekMetrics);
    setLastWeekMetrics(lastWeekMetricsData);
    // Always update input values with the loaded metrics for the selected date
    setInputValues(metrics);
  }, [getTodayMetrics, getWeeklyMetrics, getLastWeekMetrics]);

  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    loadData(dateKey);
  }, [selectedDate, loadData]);

  const handleInputChange = (activityId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [activityId]: value }));
  };

  const handleInputBlur = (activityId: string) => {
    const value = parseInt(String(inputValues[activityId])) || 0;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    console.log('Saving metrics - Activity:', activityId, 'Value:', value, 'Date:', dateKey);
    updateMetrics(activityId, value, dateKey);
    setTodayMetrics(prev => ({ ...prev, [activityId]: value }));
    
    toast({
      title: 'Metrics Updated',
      description: `${activityId}: ${value} saved for ${dateKey}`,
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
                    {weekDates.map((date) => {
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      const isFuture = date > new Date();
                      
                      return (
                        <Button
                          key={date.toISOString()}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`flex flex-col h-16 p-2 ${isFuture ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => !isFuture && setSelectedDate(date)}
                          disabled={isFuture}
                        >
                          <span className="text-xs">{format(date, 'EEE')}</span>
                          <span className="text-lg">{format(date, 'd')}</span>
                          {isToday && <span className="text-xs text-primary">Today</span>}
                        </Button>
                      );
                    })}
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
                    Enter your daily LinkedIn networking activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Daily Count</TableHead>
                        <TableHead>Daily Target</TableHead>
                        <TableHead>Weekly Progress</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DAILY_ACTIVITIES.map((activity) => {
                        const weeklyTotal = weeklyMetrics[activity.id] || 0;
                        const status = getActivityStatus(activity.id);
                        
                        return (
                          <TableRow key={activity.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{activity.title}</div>
                                <div className="text-xs text-muted-foreground">{activity.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getCategoryColor(activity.category)}>
                                {getCategoryIcon(activity.category)}
                                <span className="ml-1 capitalize">{activity.category}</span>
                              </Badge>
                            </TableCell>
                             <TableCell>
                               <Input
                                 type="number"
                                 placeholder="0"
                                 value={inputValues[activity.id] ?? ''}
                                 onChange={(e) => handleInputChange(activity.id, e.target.value)}
                                 onBlur={() => handleInputBlur(activity.id)}
                                 className="w-20 h-8 text-sm"
                                 min="0"
                                 max={activity.dailyTarget * 3}
                                 disabled={selectedDate > new Date()}
                               />
                             </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{activity.dailyTarget}</span>
                              <span className="text-xs text-muted-foreground ml-1">{activity.unit}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-medium">{weeklyTotal}</span>
                                <span className="text-muted-foreground"> / {activity.weeklyTarget}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((weeklyTotal / activity.weeklyTarget) * 100)}% complete
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                {status === 'danger' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                <span className={`text-sm font-medium ${
                                  status === 'success' ? 'text-green-600' :
                                  status === 'warning' ? 'text-yellow-600' :
                                  status === 'danger' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {status === 'success' ? 'On Track' :
                                   status === 'warning' ? 'Behind' :
                                   status === 'danger' ? 'Critical' : 'Not Started'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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