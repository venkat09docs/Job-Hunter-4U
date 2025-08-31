import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import { ArrowLeft, Target, CheckCircle, Clock, BookOpen, Users, Star, TrendingUp, Calendar, MessageSquare, Share2, Heart, UserPlus, Activity, User, AlertCircle } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';

import { useAuth } from '@/hooks/useAuth';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import PricingDialog from '@/components/PricingDialog';
import { format, addDays, startOfWeek, isSameDay, subDays } from 'date-fns';
import GitHubActivityTrackerEmbed from '@/components/GitHubActivityTrackerEmbed';
import GitHubDailyFlow from '@/components/GitHubDailyFlow';
import { useJobApplicationActivities, JobApplicationTaskId } from '@/hooks/useJobApplicationActivities';
import { supabase } from '@/integrations/supabase/client';
import { LearningGoalsSection } from '@/components/LearningGoalsSection';
import { DAILY_ACTIVITIES, type DailyActivity } from '@/constants/dailyActivities';

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

// DailyActivity interface is now imported from constants

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

// DAILY_ACTIVITIES is now imported from constants

const JOB_APP_TASKS: { id: JobApplicationTaskId; title: string; description: string }[] = [
  { id: 'review_new_postings', title: 'Search New Job Postings', description: 'Check 5–10 fresh job listings filtered by keywords, skills, location, and salary.' },
  { id: 'save_potential_opportunities', title: 'Add Jobs to the Wishlist', description: 'Mark jobs for Immediate Apply or Follow-Up Later for easy tracking.' },
  { id: 'ats_resume_optimization', title: 'ATS Resume Optimization', description: 'Tailor resume for each job using suggestions to pass ATS filters.' },
  { id: 'ai_generated_cover_letter', title: 'AI-Generated Cover Letter', description: 'Create a personalized cover letter for each application from templates.' },
  { id: 'apply_quality_jobs', title: 'Apply to matched Jobs', description: 'Submit 2–3 high-match applications daily for better success rates.' },
  { id: 'verify_application_completeness', title: 'Verify Application Completeness', description: 'Ensure resume, cover letter, portfolio links, and references are included before sending.' },
  { id: 'log_applications_in_tracker', title: 'Update status of Application in Tracker', description: 'Record each application’s status (Applied, Interview, Rejected, Offer).' },
  { id: 'send_follow_up_message', title: 'Send Follow-Up Message', description: 'Reach out to recruiters 3–5 days after applying.' },
];

export default function CareerGrowthActivities() {
  const [activities] = useState<Activity[]>(mockActivities);
  const location = useLocation();
  const navigate = useNavigate();
  
// Get tab from URL params, default to 'application'
const urlParams = new URLSearchParams(location.search);
const rawTab = urlParams.get('tab') || 'application';
const initialTab = rawTab === 'all' ? 'application' : rawTab;
const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  
  
  // LinkedIn Network functionality
  const { updateMetrics, getTodayMetrics, getWeeklyMetrics } = useLinkedInNetworkProgress();
  const { user } = useAuth();
  const { isIT } = useUserIndustry();
  const { toast } = useToast();
  const { hasActiveSubscription } = useProfile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics>({});
  const [weeklyMetrics, setWeeklyMetrics] = useState<ActivityMetrics>({});
  const [previousTodayMetrics, setPreviousTodayMetrics] = useState<ActivityMetrics>({});
const [inputValues, setInputValues] = useState<InputValues>({});

  // Initialize weekly points tracking
  const [previousWeeklyMetrics, setPreviousWeeklyMetrics] = useState<ActivityMetrics>({});

  // Job Applications - weekly tracker
  const { fetchWeek, upsertActivity, getWeekDatesMonToFri } = useJobApplicationActivities();
const [jobWeekData, setJobWeekData] = useState<Record<string, Partial<Record<JobApplicationTaskId, number>>>>({});
const [statusWeekData, setStatusWeekData] = useState<Record<string, Partial<Record<string, number>>>>({});
const jobWeekDates = getWeekDatesMonToFri(new Date());
const initialGitTab = (urlParams.get('gitTab') === 'engagement') ? 'engagement' : 'repo';
const [gitTab, setGitTab] = useState<'repo' | 'engagement'>(initialGitTab);
const [showPricingDialog, setShowPricingDialog] = useState(false);


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
      
      // Store previous metrics before updating
      setPreviousTodayMetrics(todayMetrics);
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
  const refreshApplicationMetrics = useCallback(async () => {
    if (selectedCategory !== 'application') return;
    // Fetch week activities (wishlist/applied counts)
    const data = await fetchWeek(new Date());
    setJobWeekData(data);

    if (!user) return;

    // Aggregate job_tracker statuses for requested week
    try {
      const dates = jobWeekDates;
      const startDate = format(dates[0], 'yyyy-MM-dd');
      const lastWeekday = dates[dates.length - 1];
      const today = new Date();
      const end = today > lastWeekday ? today : lastWeekday;
      const endDate = format(end, 'yyyy-MM-dd');
      const { data: statusRows, error } = await supabase
        .from('job_tracker')
        .select('status, updated_at, user_id')
        .eq('user_id', user.id)
        .gte('updated_at', `${startDate}T00:00:00Z`)
        .lte('updated_at', `${endDate}T23:59:59Z`);
      if (error) {
        console.error('Error fetching status metrics:', error);
        setStatusWeekData({});
        return;
      }
      const TARGET_STATUSES = ['interviewing','negotiating','accepted','not_selected','no_response'];
      const map: Record<string, Partial<Record<string, number>>> = {};
      (statusRows || []).forEach((row: any) => {
        const key = format(new Date(row.updated_at), 'yyyy-MM-dd');
        if (!map[key]) map[key] = {};
        const st = row.status as string;
        if (TARGET_STATUSES.includes(st)) {
          map[key]![st] = ((map[key]![st] as number) || 0) + 1;
        }
      });
      setStatusWeekData(map);
    } catch (e) {
      console.error('Failed to compute status metrics', e);
    }
  }, [selectedCategory, fetchWeek, user, jobWeekDates]);

  // Initial/whenever tab active refresh
  useEffect(() => {
    refreshApplicationMetrics();
  }, [refreshApplicationMetrics]);

  // Realtime sync: refresh metrics when job activities or tracker change
  useEffect(() => {
    if (selectedCategory !== 'application' || !user) return;
    const channel = supabase
      .channel('job-app-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_application_activities' }, (payload) => {
        const row: any = (payload as any).new || (payload as any).old;
        if (!row || row.user_id !== user.id) return;
        refreshApplicationMetrics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_tracker' }, (payload) => {
        const row: any = (payload as any).new || (payload as any).old;
        if (!row || row.user_id !== user.id) return;
        refreshApplicationMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, user, refreshApplicationMetrics]);

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

  const handleJobToggle = async (dateKey: string, taskId: JobApplicationTaskId, checked: boolean) => {
    const value = checked ? 1 : 0;
    setJobWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [taskId]: value,
      }
    }));
    try {
      await upsertActivity(dateKey, taskId, value);
      toast({ title: checked ? 'Marked done' : 'Marked undone', description: `${taskId} for ${format(new Date(dateKey), 'EEE, MMM d')}` });
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
      
      // Store previous metrics before updating for points comparison
      setPreviousTodayMetrics(todayMetrics);
      
      // Update today's metrics immediately
      setTodayMetrics(prev => ({ ...prev, [activityId]: value }));
      
      // Refresh weekly metrics to reflect the change
      const [updatedWeeklyMetrics] = await Promise.all([
        getWeeklyMetrics()
      ]);
      
      // Store previous weekly metrics before updating for points comparison
      setPreviousWeeklyMetrics(weeklyMetrics);
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
    
    const dailyCount = todayMetrics[activityId] || 0;
    if (dailyCount >= activity.dailyTarget) return 'success';
    if (dailyCount >= activity.dailyTarget * 0.7) return 'warning';
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

  const handleLinkedInPostsClick = () => {
    console.log('handleLinkedInPostsClick called', { hasActiveSubscription: hasActiveSubscription() });
    if (hasActiveSubscription()) {
      window.open('https://mysuperaiapp.com/login', '_blank');
    } else {
      setShowPricingDialog(true);
    }
  };

  const handlePortfolioVideoClick = () => {
    console.log('handlePortfolioVideoClick called', { hasActiveSubscription: hasActiveSubscription() });
    if (hasActiveSubscription()) {
      window.open('https://mysuperaiapp.com/login', '_blank');
    } else {
      setShowPricingDialog(true);
    }
  };

  // Debug log to ensure function is defined
  console.log('handleLinkedInPostsClick function defined:', typeof handleLinkedInPostsClick);

  const filteredActivities = selectedCategory === 'all'
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  
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


        {/* Main Tabs - Promoted from sub tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
<TabsList className={`grid w-full ${isIT() ? 'grid-cols-3' : 'grid-cols-2'}`}>
  <TabsTrigger value="application">Job Applications</TabsTrigger>
  <TabsTrigger value="networking">LinkedIn Growth</TabsTrigger>
  {isIT() && <TabsTrigger value="skill">GitHub Activities</TabsTrigger>}
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
                      Use checkboxes to mark completion. Only Today and Yesterday are editable; other days are read-only.
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
                              const val = jobWeekData[dateKey]?.[task.id as JobApplicationTaskId] ?? 0;
                              const isEditable = isSameDay(date, new Date()) || isSameDay(date, subDays(new Date(), 1));
                              return (
                                <TableCell key={`${dateKey}-${task.id}`} className="w-28 text-center">
                                  <div className="flex items-center justify-center">
                                    <Checkbox
                                      checked={val > 0}
                                      onCheckedChange={(checked) => isEditable && handleJobToggle(dateKey, task.id as JobApplicationTaskId, checked === true)}
                                      disabled={!isEditable}
                                    />
                                  </div>
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
                                 {(() => {
                                   const today = new Date();
                                   const yesterday = subDays(today, 1);
                                   const isEditableDate = isSameDay(selectedDate, today) || isSameDay(selectedDate, yesterday);
                                   
                                   return (
                                     <Input
                                       type="number"
                                       placeholder="0"
                                       value={inputValues[activity.id] ?? ''}
                                       onChange={(e) => handleInputChange(activity.id, e.target.value)}
                                       onBlur={() => handleInputBlur(activity.id)}
                                       className="w-20 h-8 text-sm"
                                       min="0"
                                       max={activity.dailyTarget * 3}
                                       disabled={!isEditableDate}
                                       readOnly={!isEditableDate}
                                     />
                                   );
                                 })()}
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
            ) : selectedCategory === 'skill' ? (
              <div className="space-y-6">
                <Tabs value={gitTab} onValueChange={(v) => setGitTab(v as 'repo' | 'engagement')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="repo">GitHub Activity Tracker</TabsTrigger>
                    <TabsTrigger value="engagement">Activity & Engagement</TabsTrigger>
                  </TabsList>
                  <TabsContent value="repo">
                    <GitHubActivityTrackerEmbed
                      categories={["Repository Management"]}
                      title="GitHub Activity Tracker"
                      subtitle="Improve your repositories and profile quality"
                      hideHeader
                      buttonInsideProgress
                    />
                  </TabsContent>
                  <TabsContent value="engagement">
                    <GitHubDailyFlow />
                  </TabsContent>
                </Tabs>
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

      {showPricingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PricingDialog />
            <button
              onClick={() => setShowPricingDialog(false)}
              className="mt-4 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}