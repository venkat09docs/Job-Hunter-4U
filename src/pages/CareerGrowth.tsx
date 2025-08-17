import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight, Calendar, TrendingUp, CheckCircle, AlertCircle, Target, Download, Github } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ApplicationMetricsCard from '@/components/ApplicationMetricsCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { format, startOfWeek, subWeeks, addDays, addWeeks, endOfWeek } from 'date-fns';
import { Button as PaginationButton } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { DAILY_ACTIVITIES, DATABASE_FIELD_MAPPING } from '@/constants/dailyActivities';

interface WeeklyMetrics {
  week: string;
  resumeProgress: number;
  linkedinProgress: number;
  githubProgress: number;
  networkProgress: number;
  jobApplications: number;
  blogPosts: number;
}

interface Suggestion {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export default function CareerGrowth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const { progress: resumeProgress } = useResumeProgress();
  const { completionPercentage: linkedinProgress } = useLinkedInProgress();
  const { getCompletionPercentage, tasks: githubTasks } = useGitHubProgress();
  const { getTodayMetrics, loading: networkLoading } = useLinkedInNetworkProgress();
  const { metrics: networkMetrics } = useNetworkGrowthMetrics();
  const { formatWeeklyMetrics, formatDailyMetrics, getDailyTrends, loading: dailyLoading, createTodaySnapshot, refreshProgress } = useDailyProgress();
  const { isIT } = useUserIndustry();
  
  // Network activities state
  const [networkDailyMetrics, setNetworkDailyMetrics] = useState<{[key: string]: number}>({});
  const [networkWeeklyMetrics, setNetworkWeeklyMetrics] = useState<{[key: string]: number}>({});
  const [networkWeekOffset, setNetworkWeekOffset] = useState(0);

  // Daily activities structure is now imported from constants
  
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobApplications, setTotalJobApplications] = useState(0);
  const [publishedBlogsCount, setPublishedBlogsCount] = useState(0);
  const [savedReadmeFilesCount, setSavedReadmeFilesCount] = useState(0);
  const [weeklyDailyBreakdown, setWeeklyDailyBreakdown] = useState<{[date: string]: {[activity: string]: number}}>({});

  const weeklyChartData = Array.from({ length: 7 }, (_, index) => {
    // Reverse the index to show latest date first, matching the table order
    const reversedIndex = 6 - index;
    const date = addDays(startOfWeek(addWeeks(new Date(), networkWeekOffset), { weekStartsOn: 1 }), reversedIndex);
    const key = format(date, 'yyyy-MM-dd');
    const dayData = (weeklyDailyBreakdown[key] || {}) as Record<string, number>;
    const total = DAILY_ACTIVITIES.reduce((sum, a) => sum + (dayData[a.id] || 0), 0);
    return { label: format(date, 'EEE'), total };
  });

  const githubProgress = getCompletionPercentage();

  // GitHub Activities tracker metrics
  const REPO_TASK_IDS = ['pinned_repos','repo_descriptions','readme_files','topics_tags','license'];
  const [repoMetrics, setRepoMetrics] = useState({ completed: 0, total: REPO_TASK_IDS.length });
  const [weeklyFlowCompleted, setWeeklyFlowCompleted] = useState(0);

  useEffect(() => {
    if (!githubTasks) return;
    const completed = githubTasks.filter(t => REPO_TASK_IDS.includes(t.task_id) && t.completed).length;
    setRepoMetrics({ completed, total: REPO_TASK_IDS.length });
  }, [githubTasks]);

  const refreshWeeklyFlow = async () => {
    if (!user) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const { data, error } = await supabase
      .from('github_daily_flow_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('session_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('session_date', format(weekEnd, 'yyyy-MM-dd'));
    if (!error) setWeeklyFlowCompleted(data?.length || 0);
  };

  useEffect(() => {
    refreshWeeklyFlow();
  }, [user]);

  // Calculate GitHub metrics using useMemo to prevent undefined errors
  const WEEKLY_TARGET = 3;
  
  const { repoCompleted, repoPending, flowCompleted, flowRemaining } = useMemo(() => {
    const completed = repoMetrics.completed;
    const pending = Math.max(0, repoMetrics.total - completed);
    const flow = weeklyFlowCompleted;
    const remaining = Math.max(0, WEEKLY_TARGET - flow);
    
    return {
      repoCompleted: completed,
      repoPending: pending,
      flowCompleted: flow,
      flowRemaining: remaining
    };
  }, [repoMetrics, weeklyFlowCompleted]);

  useEffect(() => {
    if (user) {
      fetchJobAndBlogData();
      fetchNetworkData();
      fetchWeeklyDailyBreakdown();
    }
  }, [user, networkWeekOffset]);

  // Fetch weekly daily breakdown data
  const fetchWeeklyDailyBreakdown = async () => {
    if (!user) return;
    
    try {
      const baseStart = startOfWeek(addWeeks(new Date(), networkWeekOffset), { weekStartsOn: 1 });
      const startDate = format(baseStart, 'yyyy-MM-dd');
      const endDate = format(addDays(baseStart, 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('date, activity_id, value')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Group by date and activity
      const breakdown: {[date: string]: {[activity: string]: number}} = {};
      
      data?.forEach(metric => {
        if (!breakdown[metric.date]) {
          breakdown[metric.date] = {};
        }
        
        // Use the activity_id directly since we're now using consistent naming
        const activityKey = metric.activity_id;
        
        breakdown[metric.date][activityKey] = (breakdown[metric.date][activityKey] || 0) + metric.value;
      });

      setWeeklyDailyBreakdown(breakdown);

      // Aggregate weekly totals for selected week (for circle indicators)
      const totals: { [key: string]: number } = {};
      DAILY_ACTIVITIES.forEach((a) => { totals[a.id] = 0; });
      Object.values(breakdown).forEach((day) => {
        DAILY_ACTIVITIES.forEach((a) => {
          totals[a.id] += (day[a.id] || 0);
        });
      });
      setNetworkWeeklyMetrics(totals);
    } catch (error) {
      console.error('Error fetching weekly daily breakdown:', error);
    }
  };

  // Network data fetching
  const fetchNetworkData = async () => {
    if (!user) return;
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const dailyData = await getTodayMetrics(today);
      setNetworkDailyMetrics(dailyData);
    } catch (error) {
      console.error('Error fetching network data:', error);
    }
  };

  useEffect(() => {
    if (user && totalJobApplications !== undefined && publishedBlogsCount !== undefined) {
      generateSuggestions();
      setLoading(false);
    }
  }, [user, resumeProgress, linkedinProgress, githubProgress, 0, totalJobApplications, publishedBlogsCount]); // networkProgress removed

  const fetchJobAndBlogData = async () => {
    if (!user) return;
    
    try {
      // Fetch total job applications (excluding wishlist)
      const { count, error: countError } = await supabase
        .from('job_tracker')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .neq('status', 'wishlist');

      if (countError) throw countError;
      setTotalJobApplications(count || 0);

      // Fetch published blogs count
      const { count: blogsCount, error: blogsError } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_public', true);

      if (blogsError) throw blogsError;
      setPublishedBlogsCount(blogsCount || 0);

      // Fetch saved README files count
      const { count: readmeFilesCount, error: readmeFilesError } = await supabase
        .from('saved_readme_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (readmeFilesError) throw readmeFilesError;
      setSavedReadmeFilesCount(readmeFilesCount || 0);
    } catch (error) {
      console.error('Error fetching job and blog data:', error);
    }
  };

  const getOverallScore = () => {
    // For IT users, include GitHub progress; for Non-IT users, exclude it
    const scores = isIT() 
      ? [resumeProgress, linkedinProgress, githubProgress]
      : [resumeProgress, linkedinProgress];
    
    return scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const weeklyMetrics = formatWeeklyMetrics();
  const dailyMetrics = formatDailyMetrics();
  const trends = getDailyTrends();

  const generateSuggestions = () => {
    const newSuggestions: Suggestion[] = [];

    // Resume suggestions
    if (resumeProgress < 80) {
      newSuggestions.push({
        id: 'resume-complete',
        category: 'Resume',
        title: 'Complete your resume',
        description: 'Your resume is only ' + resumeProgress + '% complete. Add missing sections to improve your profile.',
        priority: 'high',
        completed: false
      });
    }

    // LinkedIn suggestions
    if (linkedinProgress < 90) {
      newSuggestions.push({
        id: 'linkedin-optimize',
        category: 'LinkedIn',
        title: 'Optimize LinkedIn profile',
        description: 'Complete remaining LinkedIn optimization tasks to improve visibility.',
        priority: 'high',
        completed: false
      });
    }

    // GitHub suggestions
    if (githubProgress < 60) {
      newSuggestions.push({
        id: 'github-setup',
        category: 'GitHub',
        title: 'Set up GitHub profile',
        description: 'Create a professional GitHub profile with README and showcase your projects.',
        priority: 'medium',
        completed: false
      });
    }

    // Network suggestions
    if (false) { // networkProgress removed, condition disabled
      newSuggestions.push({
        id: 'network-grow',
        category: 'Network',
        title: 'Grow your network',
        description: 'Connect with industry professionals and engage with their content.',
        priority: 'medium',
        completed: false
      });
    }

    // Job application suggestions
    if (totalJobApplications < 5) {
      newSuggestions.push({
        id: 'job-apply',
        category: 'Jobs',
        title: 'Apply to more positions',
        description: 'Increase your job application activity to improve your chances.',
        priority: 'high',
        completed: false
      });
    }

    // Blog suggestions
    if (publishedBlogsCount < 3) {
      newSuggestions.push({
        id: 'blog-create',
        category: 'Content',
        title: 'Create blog content',
        description: 'Share your expertise through blog posts to establish thought leadership.',
        priority: 'low',
        completed: false
      });
    }

    setSuggestions(newSuggestions);
  };


  const handleUpdateProgress = async () => {
    setIsUpdatingProgress(true);
    try {
      await createTodaySnapshot();
      // Manually refresh the daily snapshots after creating a new one
      await refreshProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (loading || dailyLoading || premiumLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading career growth data...</p>
        </div>
      </div>
    );
  }

  // Check premium access
  if (!canAccessFeature('career_growth')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Career Growth Report</h1>
                <p className="text-muted-foreground">Track your professional development progress</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <SubscriptionUpgrade featureName="career_growth">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Premium Feature</CardTitle>
                  <CardDescription>
                    Career Growth is a premium feature. Upgrade your plan to access detailed analytics and tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Upgrade Now</Button>
                </CardContent>
              </Card>
            </SubscriptionUpgrade>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Career Growth Report</h1>
              <p className="text-muted-foreground">Track your professional development progress</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Calendar className="h-4 w-4" />
            Updated {format(new Date(), 'MMM dd, yyyy')}
          </Badge>
        </div>

        {/* Overall Score */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8 items-stretch min-h-[200px]">
              {/* Profile Picture Section - Full Height */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile?.profile_image_url} alt={profile?.full_name || profile?.username || 'User'} />
                  <AvatarFallback className="text-3xl">
                    {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center mt-4">
                  <p className="font-semibold text-lg">{profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-sm text-muted-foreground">Career Professional</p>
                </div>
              </div>
              
              {/* Right Side - Header + Statistics */}
              <div className="flex flex-col">
                {/* Header Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Overall Career Score</h2>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {getOverallScore()}%
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Your comprehensive career development progress across all key areas
                  </p>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{resumeProgress}%</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Resume Complete</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{linkedinProgress}%</div>
                    <div className="text-sm text-green-600 dark:text-green-400">LinkedIn Optimized</div>
                  </div>
                  {isIT() && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{githubProgress}%</div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">GitHub Setup</div>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{totalJobApplications}</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">Job Applications</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="resume" className="space-y-6">
          <TabsList className={`grid w-full ${isIT() ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="network">LinkedIn Activities Status</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            {isIT() && <TabsTrigger value="github">GitHub</TabsTrigger>}
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Resume Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">{resumeProgress}%</div>
                  <Progress value={resumeProgress} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Complete your resume to improve your job search success rate
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  LinkedIn Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">{linkedinProgress}%</div>
                  <Progress value={linkedinProgress} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Optimize your LinkedIn profile to increase visibility to recruiters
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Weekly Network Activities (Monday to Sunday)</CardTitle>
                    <CardDescription>Aggregated activities for the selected week</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNetworkWeekOffset((v) => v - 1)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Badge variant="secondary">
                      {`${format(startOfWeek(addWeeks(new Date(), networkWeekOffset), { weekStartsOn: 1 }), 'MMM d')} – ${format(addDays(startOfWeek(addWeeks(new Date(), networkWeekOffset), { weekStartsOn: 1 }), 6), 'MMM d')}`}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setNetworkWeekOffset((v) => Math.min(0, v + 1))} disabled={networkWeekOffset === 0}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 overflow-x-auto pb-2">
                    {DAILY_ACTIVITIES.map((activity) => {
                      const weeklyCount = networkWeeklyMetrics[activity.id] || 0;
                      const target = activity.weeklyTarget;
                      const colorClass = networkWeekOffset === 0
                        ? (weeklyCount >= target ? 'border-green-500' : 'border-amber-500')
                        : (weeklyCount >= target ? 'border-green-500' : 'border-red-500');
                      return (
                        <div key={activity.id} className="flex flex-col items-center min-w-[88px]">
                          <div className={`relative h-20 w-20 rounded-full border-2 flex items-center justify-center ${colorClass} bg-primary/10`}>
                            <span className="text-xl font-bold">{weeklyCount}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{weeklyCount}/{target}</div>
                          <div className="mt-1 text-xs text-center">
                            {activity.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                   <Table>
                      <TableHeader>
                        <TableRow className="bg-primary/10">
                          <TableHead>Day</TableHead>
                          {DAILY_ACTIVITIES.map((activity) => (
                            <TableHead key={activity.id} className="text-center">
                              {activity.title}
                            </TableHead>
                          ))}
                          <TableHead className="text-center">Total Activities</TableHead>
                        </TableRow>
                      </TableHeader>
                     <TableBody>
                       {Array.from({ length: 7 }, (_, index) => {
                         // Reverse the index to show latest date first (Sunday to Monday)
                         const reversedIndex = 6 - index;
                         const date = addDays(startOfWeek(addWeeks(new Date(), networkWeekOffset), { weekStartsOn: 1 }), reversedIndex);
                         const dayName = format(date, 'EEE');
                         const dateKey = format(date, 'yyyy-MM-dd');
                         const dayData = weeklyDailyBreakdown[dateKey] || {};
                         
                         // Calculate total for this day
                         const dayTotal = DAILY_ACTIVITIES.reduce((sum, activity) => {
                           return sum + (dayData[activity.id] || 0);
                         }, 0);
                         
                         return (
                           <TableRow key={dateKey}>
                             <TableCell className="font-medium">
                               <div>
                                 <div>{dayName}</div>
                                 <div className="text-xs text-muted-foreground">
                                   {format(date, 'MMM d')}
                                 </div>
                               </div>
                             </TableCell>
                             {DAILY_ACTIVITIES.map((activity) => (
                               <TableCell key={activity.id} className="text-center">
                                 <span className="text-sm">
                                   {dayData[activity.id] || 0}
                                 </span>
                               </TableCell>
                             ))}
                             <TableCell className="text-center font-medium">
                               {dayTotal}
                             </TableCell>
                           </TableRow>
                         );
                       })}
                      </TableBody>
                  </Table>
                    <div className="mt-6">
                      <div className="text-sm font-medium mb-2">Day-wise Total Activities</div>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={weeklyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip />
                            <Bar dataKey="total" name="Total Activities" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Job Applications
                  {trends.jobApplications && <span className="text-lg">{trends.jobApplications}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">{totalJobApplications}</div>
                  <div className="text-sm text-muted-foreground">Total Applications</div>
                </div>
              </CardContent>
            </Card>


            <ApplicationMetricsCard />
          </TabsContent>

          {isIT() && (
            <TabsContent value="github" className="space-y-6">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Github className="h-5 w-5 text-primary" />
                    GitHub Activities Tracker
                  </CardTitle>
                  <CardDescription>
                    Combined status from GitHub Activity Tracker and Activity & Engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium mb-2">Repository Setup Progress</div>
                      <div className="w-full" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { name: 'Repo Completed', value: repoCompleted, color: 'hsl(var(--chart-accepted))' },
                              { name: 'Repo Pending', value: repoPending, color: 'hsl(var(--chart-not-selected))' },
                            ]}
                            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" interval={0} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickMargin={8} />
                            <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                              {[
                                { name: 'Repo Completed', color: 'hsl(var(--chart-accepted))' },
                                { name: 'Repo Pending', color: 'hsl(var(--chart-not-selected))' },
                              ].map((entry, index) => (
                                <Cell
                                  key={`repo-cell-${index}`}
                                  fill={entry.color}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate('/dashboard/career-growth-activities?tab=skill&gitTab=repo')}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Weekly Flow (Mon–Sun)</div>
                      <div className="w-full" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={[
                              { name: 'Flow Completed', value: flowCompleted, color: 'hsl(var(--chart-applied))' },
                              { name: 'Flow Remaining', value: flowRemaining, color: 'hsl(var(--chart-no-response))' },
                            ]}
                            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" interval={0} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickMargin={8} />
                            <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                              {[
                                { name: 'Flow Completed', color: 'hsl(var(--chart-applied))' },
                                { name: 'Flow Remaining', color: 'hsl(var(--chart-no-response))' },
                              ].map((entry, index) => (
                                <Cell
                                  key={`flow-cell-${index}`}
                                  fill={entry.color}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate('/dashboard/career-growth-activities?tab=skill&gitTab=engagement')}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="weekly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  4-Week Progress Trend
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={createTodaySnapshot}
                  >
                    Update Today's Progress
                  </Button>
                </CardTitle>
                <CardDescription>Track your weekly improvements across all areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {weeklyMetrics.map((week, index) => (
                    <div key={week.week} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Week of {week.week}</h3>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Current" : `${index + 1} week${index > 0 ? 's' : ''} ago`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Resume</div>
                          <div className="text-lg font-semibold">{week.resumeProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">LinkedIn</div>
                          <div className="text-lg font-semibold">{week.linkedinProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">GitHub</div>
                          <div className="text-lg font-semibold">{week.githubProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Network</div>
                          <div className="text-lg font-semibold">{week.networkProgress}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Jobs</div>
                          <div className="text-lg font-semibold">{week.jobApplications}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Blogs</div>
                          <div className="text-lg font-semibold">{week.blogPosts}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}