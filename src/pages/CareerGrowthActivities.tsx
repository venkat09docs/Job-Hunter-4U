import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, CheckCircle, Clock, BookOpen, Users, Star, TrendingUp, Calendar, MessageSquare, Share2, Heart, UserPlus, Activity, User, AlertCircle, Award } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'networking' | 'learning' | 'application';
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  progress: number;
  estimatedTime: string;
}

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

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Complete React.js Certification',
    description: 'Enhance your frontend development skills with React.js certification',
    category: 'skill',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-01-15',
    progress: 65,
    estimatedTime: '2 weeks'
  },
  {
    id: '3',
    title: 'Update LinkedIn Profile',
    description: 'Optimize LinkedIn profile with recent achievements and skills',
    category: 'application',
    status: 'completed',
    priority: 'high',
    progress: 100,
    estimatedTime: '2 hours'
  },
  {
    id: '4',
    title: 'Read "Clean Code" Book',
    description: 'Improve coding practices by reading Robert Martin\'s Clean Code',
    category: 'learning',
    status: 'in-progress',
    priority: 'medium',
    progress: 40,
    estimatedTime: '3 weeks'
  },
  {
    id: '5',
    title: 'Apply to 5 New Positions',
    description: 'Submit applications to target companies in your field',
    category: 'application',
    status: 'pending',
    priority: 'high',
    dueDate: '2024-01-12',
    progress: 0,
    estimatedTime: '1 week'
  }
];

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

export default function CareerGrowthActivities() {
  const [activities] = useState<Activity[]>(mockActivities);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('activities');
  
  // LinkedIn Network functionality
  const { updateMetrics, getTodayMetrics, getWeeklyMetrics, getLastWeekMetrics } = useLinkedInNetworkProgress();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics>({});
  const [weeklyMetrics, setWeeklyMetrics] = useState<ActivityMetrics>({});
  const [lastWeekMetrics, setLastWeekMetrics] = useState<ActivityMetrics>({});
  const [inputValues, setInputValues] = useState<InputValues>({});

  // LinkedIn Network data loading
  const loadData = useCallback(async (dateKey: string) => {
    if (!user) return;
    
    console.log('Loading data for date:', dateKey);
    
    try {
      const [metrics, currentWeekMetrics, lastWeekMetricsData] = await Promise.all([
        getTodayMetrics(dateKey),
        getWeeklyMetrics(), 
        getLastWeekMetrics()
      ]);
      
      console.log('Loaded metrics for', dateKey, ':', metrics);
      
      setTodayMetrics(metrics);
      setWeeklyMetrics(currentWeekMetrics);
      setLastWeekMetrics(lastWeekMetricsData);
      
      // Only update input values if they're currently empty (not being edited)
      setInputValues(prev => {
        const hasUserInput = Object.keys(prev).some(key => prev[key] !== '');
        return hasUserInput ? prev : metrics;
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user, getTodayMetrics, getWeeklyMetrics, getLastWeekMetrics]);

  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    loadData(dateKey);
  }, [selectedDate, user, loadData]);

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

  const getCategoryIcon = (category: Activity['category'] | string) => {
    switch (category) {
      case 'skill': return <Target className="h-4 w-4" />;
      case 'networking': return <Users className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      case 'application': return <TrendingUp className="h-4 w-4" />;
      case 'engagement': return <Heart className="h-4 w-4" />;
      case 'content': return <MessageSquare className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getNetworkingCategoryColor = (category: string) => {
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
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
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

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const completedCount = activities.filter(a => a.status === 'completed').length;
  const inProgressCount = activities.filter(a => a.status === 'in-progress').length;
  const pendingCount = activities.filter(a => a.status === 'pending').length;
  
  const weekDates = generateWeekDates();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </NavLink>
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Career Growth Activities</h1>
            <p className="text-muted-foreground">Track and manage your professional development activities</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">{activities.length}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-gray-600">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="activities">Career Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-6">
            {/* Filter Tabs for Activities */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Activities</TabsTrigger>
                <TabsTrigger value="skill">Skills</TabsTrigger>
                <TabsTrigger value="networking">Networking</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
                <TabsTrigger value="application">Applications</TabsTrigger>
              </TabsList>
            </Tabs>

            {selectedCategory === 'networking' ? (
              // LinkedIn Network Management Content
              <div className="space-y-6">
                {/* Last Week Performance */}
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

                {/* Week Calendar */}
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

                {/* Daily Activities */}
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
                                <Badge variant="outline" className={getNetworkingCategoryColor(activity.category)}>
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

            {/* Metrics Summary */}
            <Card className="shadow-elegant border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Today's Metrics Summary
                </CardTitle>
                <CardDescription>
                  Key metrics for {format(selectedDate, 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold text-blue-500">
                      {todayMetrics['connection_requests'] || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Connection Requests</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold text-green-500">
                      {todayMetrics['post_likes'] || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Post Likes</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold text-purple-500">
                      {todayMetrics['comments'] || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold text-orange-500">
                      {todayMetrics['create_post'] || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Original Posts</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <div className="text-2xl font-bold text-primary">
                      {Object.values(todayMetrics).reduce((sum, value) => sum + (value || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Activities</div>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            ) : (
              // Regular Activities List
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          {getCategoryIcon(activity.category)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{activity.title}</h3>
                              <Badge className={getPriorityColor(activity.priority)}>
                                {activity.priority}
                              </Badge>
                              {getStatusIcon(activity.status)}
                            </div>
                            <p className="text-muted-foreground mb-3">{activity.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Category: {activity.category}</span>
                              <span>Time: {activity.estimatedTime}</span>
                              {activity.dueDate && (
                                <span>Due: {new Date(activity.dueDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.progress}%</span>
                        </div>
                      </div>
                      
                      {activity.status !== 'completed' && (
                        <div className="space-y-2">
                          <Progress value={activity.progress} className="h-2" />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Update Progress
                            </Button>
                            {activity.status === 'pending' && (
                              <Button size="sm">
                                Start Activity
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {filteredActivities.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                    <p className="text-muted-foreground">No activities match your current filter criteria.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}