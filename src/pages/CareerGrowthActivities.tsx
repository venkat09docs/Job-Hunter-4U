import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, CheckCircle, Clock, BookOpen, Users, Star, TrendingUp, Calendar, MessageSquare, Share2, Heart, UserPlus, Activity, User, AlertCircle } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek } from 'date-fns';
import GitHubActivityTrackerEmbed from '@/components/GitHubActivityTrackerEmbed';
import { useJobApplicationActivities, JobApplicationTaskId } from '@/hooks/useJobApplicationActivities';

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

const JOB_APP_TASKS: { id: JobApplicationTaskId; title: string; description: string }[] = [
  { id: 'review_new_postings', title: 'Review New Job Postings', description: 'Check 5–10 fresh job listings filtered by keywords, skills, location, and salary.' },
  { id: 'save_potential_opportunities', title: 'Save Potential Opportunities', description: 'Mark jobs for Immediate Apply or Follow-Up Later for easy tracking.' },
  { id: 'ats_resume_optimization', title: 'ATS Resume Optimization', description: 'Tailor resume for each job using suggestions to pass ATS filters.' },
  { id: 'ai_generated_cover_letter', title: 'AI-Generated Cover Letter', description: 'Create a personalized cover letter for each application from templates.' },
  { id: 'apply_quality_jobs', title: 'Apply to Quality Jobs', description: 'Submit 2–3 high-match applications daily for better success rates.' },
  { id: 'verify_application_completeness', title: 'Verify Application Completeness', description: 'Ensure resume, cover letter, portfolio links, and references are included before sending.' },
  { id: 'log_applications_in_tracker', title: 'Log Applications in Tracker', description: 'Record each application’s status (Applied, Interview, Rejected, Offer).' },
  { id: 'send_follow_up_message', title: 'Send Follow-Up Message', description: 'Reach out to recruiters 3–5 days after applying.' },
  { id: 'research_target_company', title: 'Research Target Company', description: 'Review company culture, news, and hiring patterns before applying.' },
];

export default function CareerGrowthActivities() {
  const [activities] = useState<Activity[]>(mockActivities);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL params, default to 'all'
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  
  
  // LinkedIn Network functionality
  const { updateMetrics, getTodayMetrics, getWeeklyMetrics } = useLinkedInNetworkProgress();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics>({});
  const [weeklyMetrics, setWeeklyMetrics] = useState<ActivityMetrics>({});
const [inputValues, setInputValues] = useState<InputValues>({});

  // Job Applications - weekly tracker
  const { fetchWeek, upsertActivity, getWeekDatesMonToFri } = useJobApplicationActivities();
const [jobWeekData, setJobWeekData] = useState<Record<string, Partial<Record<JobApplicationTaskId, number>>>>({});
const jobWeekDates = getWeekDatesMonToFri(new Date());

  // LinkedIn Network data loading
  const loadData = useCallback(async (dateKey: string) => {
    if (!user) return;
    
    console.log('Loading data for date:', dateKey);
    
    try {
      const [metrics, currentWeekMetrics] = await Promise.all([
        getTodayMetrics(dateKey),
        getWeeklyMetrics()
      ]);
      
      console.log('Loaded metrics for', dateKey, ':', metrics);
      
      setTodayMetrics(metrics);
      setWeeklyMetrics(currentWeekMetrics);
      setInputValues(metrics);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user]);

  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    loadData(dateKey);
}, [selectedDate, loadData]);

  // Load Job Applications week data when tab is active
  useEffect(() => {
    if (selectedCategory !== 'application') return;
    (async () => {
      const data = await fetchWeek(new Date());
      setJobWeekData(data);
    })();
  }, [selectedCategory, fetchWeek]);

  const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const handleJobValueChange = (dateKey: string, taskId: JobApplicationTaskId, value: string) => {
    setJobWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [taskId]: parseInt(value) || 0,
      }
    }));
  };

  const handleJobBlur = async (dateKey: string, taskId: JobApplicationTaskId) => {
    const value = jobWeekData?.[dateKey]?.[taskId] || 0;
    try {
      await upsertActivity(dateKey, taskId, value);
      toast({ title: 'Saved', description: `${value} saved for ${format(new Date(dateKey), 'EEE, MMM d')}` });
    } catch (error) {
      console.error('Failed to save job application activity', error);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleInputChange = (activityId: string, value: string) => {
    console.log('Input changing:', activityId, 'from', inputValues[activityId], 'to', value);
    setInputValues(prev => ({ ...prev, [activityId]: value }));
  };

  const handleInputBlur = async (activityId: string) => {
    const value = parseInt(String(inputValues[activityId])) || 0;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    console.log('Saving metrics - Activity:', activityId, 'Value:', value, 'Date:', dateKey);
    
    try {
      // Update the database
      await updateMetrics(activityId, value, dateKey);
      
      // Update today's metrics immediately
      setTodayMetrics(prev => ({ ...prev, [activityId]: value }));
      
      // Refresh weekly metrics to reflect the change
      const [updatedWeeklyMetrics] = await Promise.all([
        getWeeklyMetrics()
      ]);
      setWeeklyMetrics(updatedWeeklyMetrics);
      
      console.log('Successfully updated metrics and refreshed weekly data');
      
      toast({
        title: 'Metrics Updated',
        description: `${activityId}: ${value} saved for ${dateKey}`,
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to update metrics',
        variant: 'destructive'
      });
    }
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

        {/* Main Tabs - Promoted from sub tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All Activities</TabsTrigger>
            <TabsTrigger value="application">Job Applications</TabsTrigger>
            <TabsTrigger value="networking">LinkedIn Growth</TabsTrigger>
            <TabsTrigger value="skill">GitHub Activities</TabsTrigger>
            <TabsTrigger value="content">Content Mgmt</TabsTrigger>
            <TabsTrigger value="learning">Skills / Learning</TabsTrigger>
          </TabsList>

            {selectedCategory === 'application' ? (
              <div className="space-y-6">
                <Card className="shadow-elegant border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Weekly Activities Tracker (Mon–Fri)
                    </CardTitle>
                    <CardDescription>
                      Track your daily job application workflow. Enter counts for each activity per day. Changes save automatically on blur.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          {jobWeekDates.map((date) => (
                            <TableHead key={date.toISOString()} className="text-center">
                              {format(date, 'EEE')} <span className="text-xs text-muted-foreground">{format(date, 'd')}</span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {JOB_APP_TASKS.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{task.title}</div>
                              <div className="text-xs text-muted-foreground">{task.description}</div>
                            </TableCell>
                            {jobWeekDates.map((date) => {
                              const dateKey = getDateKey(date);
                              const val = jobWeekData[dateKey]?.[task.id as JobApplicationTaskId];
                              return (
                                <TableCell key={`${dateKey}-${task.id}`} className="w-28">
                                  <Input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={val ?? ''}
                                    onChange={(e) => handleJobValueChange(dateKey, task.id as JobApplicationTaskId, e.target.value)}
                                    onBlur={() => handleJobBlur(dateKey, task.id as JobApplicationTaskId)}
                                    className="h-8 text-sm"
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : selectedCategory === 'networking' ? (
              // LinkedIn Network Management Content
              <div className="space-y-6">
                {/* Current Week Status Bar */}
                <Card className="shadow-elegant border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Current Week Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Activities Completed This Week</span>
                         <span className="text-lg font-bold text-primary">
                           {weeklyMetrics ? Object.values(weeklyMetrics).reduce((sum, val) => sum + val, 0) : 0} / {DAILY_ACTIVITIES.length * 7}
                         </span>
                      </div>
                       <Progress 
                         value={weeklyMetrics ? (Object.values(weeklyMetrics).reduce((sum, val) => sum + val, 0) / (DAILY_ACTIVITIES.length * 7)) * 100 : 0} 
                         className="h-3"
                       />
                      <p className="text-xs text-muted-foreground">
                        Complete daily LinkedIn activities to improve your network growth score
                      </p>
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
                           
                           // Debug logging for Like Posts specifically
                           if (activity.id === 'post_likes') {
                             console.log('Like Posts Debug:', {
                               activityId: activity.id,
                               weeklyTotal,
                               weeklyMetrics,
                               rawWeeklyData: weeklyMetrics
                             });
                           }
                           
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
            ) : selectedCategory === 'content' ? (
              // Content Management Section
              <div className="space-y-6">
                <Card className="shadow-elegant border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Content Management Hub
                    </CardTitle>
                    <CardDescription>
                      Create, manage and publish content to showcase your expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Blog Management */}
                      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Blog Management</h3>
                              <p className="text-sm text-muted-foreground">Write and publish blog posts</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create professional blog posts to demonstrate your expertise and thought leadership in your field.
                          </p>
                          <Button 
                            onClick={() => navigate('/dashboard/digital-portfolio')}
                            className="w-full"
                          >
                            Manage Blogs
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Cover Letters */}
                      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Cover Letters</h3>
                              <p className="text-sm text-muted-foreground">Create tailored cover letters</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Build and save multiple cover letter templates for different job applications and industries.
                          </p>
                          <Button 
                            onClick={() => navigate('/dashboard/library')}
                            className="w-full"
                            variant="outline"
                          >
                            Manage Templates
                          </Button>
                        </CardContent>
                      </Card>

                      {/* LinkedIn Content */}
                      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Share2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">LinkedIn Posts</h3>
                              <p className="text-sm text-muted-foreground">Create engaging posts</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Plan and create engaging LinkedIn posts to build your professional network and establish thought leadership.
                          </p>
                          <Button 
                            onClick={() => navigate('/dashboard/super-ai')}
                            className="w-full"
                            variant="outline"
                          >
                            LinkedIn Activities
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Digital Portfolio */}
                      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Digital Portfolio</h3>
                              <p className="text-sm text-muted-foreground">Showcase your work</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create a comprehensive digital portfolio to showcase your projects, achievements, and professional journey.
                          </p>
                          <Button 
                            onClick={() => navigate('/dashboard/digital-portfolio')}
                            className="w-full"
                            variant="outline"
                          >
                            Build Portfolio
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Creation Tips */}
                <Card className="shadow-elegant border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Content Creation Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Consistency is Key</h4>
                        <p className="text-sm text-muted-foreground">
                          Regular content creation helps establish your voice and builds audience engagement.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Quality over Quantity</h4>
                        <p className="text-sm text-muted-foreground">
                          Focus on creating valuable, well-researched content rather than frequent low-quality posts.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Engage with Your Network</h4>
                        <p className="text-sm text-muted-foreground">
                          Respond to comments and engage with others' content to build meaningful professional relationships.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : selectedCategory === 'skill' ? (
              <div className="space-y-6">
                {/* Embedded GitHub Activity Tracker */}
                <GitHubActivityTrackerEmbed />
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
        </Tabs>
      </div>
    </div>
  );
}