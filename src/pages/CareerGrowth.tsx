import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, CheckCircle, AlertCircle, Target, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useResumeProgress } from '@/hooks/useResumeProgress';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { useDailyNetworkActivities } from '@/hooks/useDailyNetworkActivities';
import { format, startOfWeek, subWeeks, addDays } from 'date-fns';
import { Button as PaginationButton } from '@/components/ui/button';

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
  const { progress: resumeProgress } = useResumeProgress();
  const { completionPercentage: linkedinProgress } = useLinkedInProgress();
  const { getCompletionPercentage } = useGitHubProgress();
  const { getTodayMetrics, getWeeklyMetrics, loading: networkLoading } = useLinkedInNetworkProgress();
  const { metrics: networkMetrics } = useNetworkGrowthMetrics();
  const { formatWeeklyMetrics, formatDailyMetrics, getDailyTrends, loading: dailyLoading, createTodaySnapshot, refreshProgress } = useDailyProgress();
  const { activities: dailyNetworkActivities, loading: dailyNetworkLoading, totalCount, fetchDailyActivities } = useDailyNetworkActivities();
  
  // Network activities state
  const [networkDailyMetrics, setNetworkDailyMetrics] = useState<{[key: string]: number}>({});
  const [networkWeeklyMetrics, setNetworkWeeklyMetrics] = useState<{[key: string]: number}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

  // Daily activities structure
  const DAILY_ACTIVITIES = [
    { id: 'post_likes', title: 'Like Posts', description: 'Like relevant posts in your industry', category: 'engagement', dailyTarget: 3, weeklyTarget: 15, unit: 'likes' },
    { id: 'comments', title: 'Comments', description: 'Leave thoughtful comments on posts', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'comments' },
    { id: 'content', title: 'Content', description: 'Share valuable content with your network', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'shares' },
    { id: 'connection_requests', title: 'Connection', description: 'Send personalized connection requests', category: 'networking', dailyTarget: 2, weeklyTarget: 10, unit: 'requests' },
  ];
  
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobApplications, setTotalJobApplications] = useState(0);
  const [publishedBlogsCount, setPublishedBlogsCount] = useState(0);
  const [savedReadmeFilesCount, setSavedReadmeFilesCount] = useState(0);

  const githubProgress = getCompletionPercentage();

  useEffect(() => {
    if (user) {
      fetchJobAndBlogData();
      fetchNetworkData();
    }
  }, [user]);

  // Network data fetching
  const fetchNetworkData = async () => {
    if (!user) return;
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [dailyData, weeklyData] = await Promise.all([
        getTodayMetrics(today),
        getWeeklyMetrics()
      ]);
      
      setNetworkDailyMetrics(dailyData);
      setNetworkWeeklyMetrics(weeklyData);
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
    const scores = [resumeProgress, linkedinProgress, githubProgress];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
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

  if (loading || dailyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading career growth data...</p>
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
              <div className="flex flex-col justify-center space-y-6">
                {/* Header Section */}
                <div className="text-left">
                  <h3 className="text-2xl font-bold mb-2">Overall Career Development Score</h3>
                  <p className="text-muted-foreground">Your comprehensive career readiness assessment</p>
                </div>
                
                {/* Statistics Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl font-bold text-primary">{getOverallScore()}%</div>
                    <TrendingUp className="h-12 w-12 text-green-500" />
                  </div>
                  <Progress value={getOverallScore()} className="w-full max-w-sm h-3" />
                   <p className="text-sm text-muted-foreground">
                    Based on Resume, LinkedIn & GitHub progress
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile Status</TabsTrigger>
            <TabsTrigger value="network">Network Status</TabsTrigger>
            <TabsTrigger value="jobs">Job Application Status</TabsTrigger>
            <TabsTrigger value="github">GitHub Status</TabsTrigger>
            <TabsTrigger value="suggestions">Action Items</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resume Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Resume
                    {trends.resume && <span className="text-lg">{trends.resume}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={resumeProgress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>{resumeProgress}% Complete</span>
                      <span className="text-muted-foreground">Target: 90%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    LinkedIn Profile
                    {trends.linkedin && <span className="text-lg">{trends.linkedin}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={linkedinProgress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>{linkedinProgress}% Complete</span>
                      <span className="text-muted-foreground">Target: 95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GitHub Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-800" />
                    GitHub Profile
                    {trends.github && <span className="text-lg">{trends.github}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={githubProgress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>{githubProgress}% Complete</span>
                      <span className="text-muted-foreground">Target: 80%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Network Growth
                  {trends.network && <span className="text-lg">{trends.network}</span>}
                </CardTitle>
                <CardDescription>Track your LinkedIn networking activities and progress</CardDescription>
              </CardHeader>
               <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">{networkMetrics?.weeklyProgress || 0}</div>
                    <div className="text-sm text-muted-foreground">Weekly Activities Completed</div>
                  </div>
               </CardContent>
            </Card>

            <Tabs defaultValue="daily" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Daily Activities</TabsTrigger>
                <TabsTrigger value="weekly">Weekly Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Network Activities Report</CardTitle>
                    <CardDescription>View your daily LinkedIn networking activities with latest records at top</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dailyNetworkLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-center">Like Posts</TableHead>
                              <TableHead className="text-center">Comments</TableHead>
                              <TableHead className="text-center">Content</TableHead>
                              <TableHead className="text-center">Connections</TableHead>
                              <TableHead className="text-center">Posts</TableHead>
                              <TableHead className="text-center">Profile Optimization</TableHead>
                             <TableHead className="text-center">Research</TableHead>
                               <TableHead className="text-center">Follow Up Messages</TableHead>
                               <TableHead className="text-center">Engage in Groups</TableHead>
                               <TableHead className="text-center">Work on Article</TableHead>
                               <TableHead className="text-center">Total Activities</TableHead>
                               <TableHead className="text-center">
                                 <Checkbox
                                   checked={selectedRecords.size === dailyNetworkActivities.length}
                                   onCheckedChange={(checked) => {
                                     if (checked) {
                                       setSelectedRecords(new Set(dailyNetworkActivities.map((_, index) => index.toString())));
                                     } else {
                                       setSelectedRecords(new Set());
                                     }
                                   }}
                                 />
                               </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dailyNetworkActivities.length > 0 ? (
                              dailyNetworkActivities.map((activity, index) => (
                                <TableRow key={`${activity.date}-${index}`}>
                                  <TableCell className="font-medium">{activity.date}</TableCell>
                                  <TableCell className="text-center">{activity.post_likes}</TableCell>
                                  <TableCell className="text-center">{activity.comments}</TableCell>
                                  <TableCell className="text-center">{activity.content}</TableCell>
                                  <TableCell className="text-center">{activity.connection_requests}</TableCell>
                                  <TableCell className="text-center">{activity.create_post}</TableCell>
                                  <TableCell className="text-center">{activity.profile_optimization}</TableCell>
                                  <TableCell className="text-center">{activity.research}</TableCell>
                                  <TableCell className="text-center">{activity.follow_up_messages}</TableCell>
                                  <TableCell className="text-center">{activity.engage_in_groups}</TableCell>
                                  <TableCell className="text-center">{activity.work_on_article}</TableCell>
                                  <TableCell className="text-center font-medium">{activity.total_activities}</TableCell>
                                   <TableCell className="text-center">
                                     <Checkbox
                                       checked={selectedRecords.has(index.toString())}
                                       onCheckedChange={(checked) => {
                                         const newSelected = new Set(selectedRecords);
                                         if (checked) {
                                           newSelected.add(index.toString());
                                         } else {
                                           newSelected.delete(index.toString());
                                         }
                                         setSelectedRecords(newSelected);
                                       }}
                                     />
                                   </TableCell>
                                 </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                                  No network activities recorded yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>

                        {/* Download and Pagination */}
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const selectedActivities = dailyNetworkActivities.filter((_, index) => 
                                selectedRecords.has(index.toString())
                              );
                              
                              if (selectedActivities.length === 0) {
                                alert('Please select at least one record to download');
                                return;
                              }

                              const excelData = selectedActivities.map(activity => ({
                                'Date': activity.date,
                                'Like Posts': activity.post_likes,
                                'Comments': activity.comments,
                                'Content': activity.content,
                                'Connections': activity.connection_requests,
                                'Posts': activity.create_post,
                                'Profile Optimization': activity.profile_optimization,
                                'Research': activity.research,
                                'Follow Up Messages': activity.follow_up_messages,
                                'Engage in Groups': activity.engage_in_groups,
                                'Work on Article': activity.work_on_article,
                                'Total Activities': activity.total_activities,
                              }));

                              const worksheet = XLSX.utils.json_to_sheet(excelData);
                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Activities');
                              
                              const fileName = `daily_network_activities_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
                              XLSX.writeFile(workbook, fileName);
                            }}
                            disabled={selectedRecords.size === 0}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Excel ({selectedRecords.size} selected)
                          </Button>
                        </div>

                        {totalCount > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                            </div>
                            <div className="flex items-center space-x-2">
                               <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newPage = Math.max(1, currentPage - 1);
                                  setCurrentPage(newPage);
                                  fetchDailyActivities(newPage, pageSize);
                                  setSelectedRecords(new Set());
                                }}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </Button>
                              <span className="text-sm">
                                Page {currentPage} of {Math.max(1, Math.ceil(totalCount / pageSize))}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                                  const newPage = Math.min(totalPages, currentPage + 1);
                                  setCurrentPage(newPage);
                                  fetchDailyActivities(newPage, pageSize);
                                  setSelectedRecords(new Set());
                                }}
                                disabled={currentPage >= Math.max(1, Math.ceil(totalCount / pageSize))}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="weekly" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Network Activities (Monday to Sunday)</CardTitle>
                    <CardDescription>Aggregated activities for the current week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {DAILY_ACTIVITIES.map((activity) => {
                          const weeklyCount = networkWeeklyMetrics[activity.id] || 0;
                          const progress = (weeklyCount / activity.weeklyTarget) * 100;
                          const isCompleted = weeklyCount >= activity.weeklyTarget;
                          
                          return (
                            <Card key={activity.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm">{activity.title}</h4>
                                  {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </div>
                                <div className="space-y-2">
                                  <div className="text-2xl font-bold">{weeklyCount}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Target: {activity.weeklyTarget} {activity.unit}
                                  </div>
                                  <Progress value={Math.min(progress, 100)} className="h-2" />
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round(progress)}% complete
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Day</TableHead>
                            {DAILY_ACTIVITIES.map((activity) => (
                              <TableHead key={activity.id} className="text-center">
                                {activity.title}
                              </TableHead>
                            ))}
                            <TableHead className="text-center">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 7 }, (_, index) => {
                            const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index);
                            const dayName = format(date, 'EEE');
                            const dateKey = format(date, 'yyyy-MM-dd');
                            
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
                                      {/* Daily breakdown would need additional data from backend */}
                                      -
                                    </span>
                                  </TableCell>
                                ))}
                                <TableCell className="text-center font-medium">
                                  {/* Daily total would need additional data from backend */}
                                  -
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

            <Card>
              <CardHeader>
                <CardTitle>Daily Job Application Progress</CardTitle>
                <CardDescription>Your recent application activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyMetrics.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{day.date}</p>
                         <p className="text-sm text-muted-foreground">
                           {day.jobApplications} applications
                         </p>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Today" : `${index} day${index > 1 ? 's' : ''} ago`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="github" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-800" />
                  GitHub Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Profile Completion</p>
                      <div className="space-y-2">
                        <Progress value={githubProgress} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span>{githubProgress}% Complete</span>
                          <span className="text-muted-foreground">Target: 80%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">README Files</p>
                      <div className="text-2xl font-bold">{savedReadmeFilesCount}</div>
                      <p className="text-sm text-muted-foreground">Saved in Library</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="daily" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daily Progress (Last 7 Days)</CardTitle>
                    <CardDescription>See your day-to-day progress patterns</CardDescription>
                  </div>
                  <Button 
                    onClick={handleUpdateProgress}
                    disabled={isUpdatingProgress}
                    size="sm"
                    className="gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {isUpdatingProgress ? 'Updating...' : 'Update Today\'s Progress'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dailyMetrics.map((day, index) => (
                    <div key={day.date} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{day.date}</h3>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          {index === 0 ? "Today" : `${index + 1} day${index > 0 ? 's' : ''} ago`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Resume</div>
                          <div className="text-lg font-semibold">{day.resumeProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">LinkedIn</div>
                          <div className="text-lg font-semibold">{day.linkedinProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">GitHub</div>
                          <div className="text-lg font-semibold">{day.githubProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Network</div>
                          <div className="text-lg font-semibold">{day.networkProgress}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Jobs</div>
                          <div className="text-lg font-semibold">{day.jobApplications}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Blogs</div>
                          <div className="text-lg font-semibold">{day.blogPosts}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority} priority
                          </Badge>
                          <Badge variant="outline">{suggestion.category}</Badge>
                        </div>
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      </div>
                      {suggestion.priority === 'high' && (
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Career Development Checklist
                  </CardTitle>
                  <CardDescription>Complete these items to maximize your career potential</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {resumeProgress >= 90 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={resumeProgress >= 90 ? "line-through text-muted-foreground" : ""}>
                        Complete resume with all sections (90%+)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {linkedinProgress >= 95 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={linkedinProgress >= 95 ? "line-through text-muted-foreground" : ""}>
                        Optimize LinkedIn profile (95%+)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {githubProgress >= 80 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={githubProgress >= 80 ? "line-through text-muted-foreground" : ""}>
                        Set up professional GitHub profile (80%+)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {totalJobApplications >= 10 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={totalJobApplications >= 10 ? "line-through text-muted-foreground" : ""}>
                        Apply to at least 10 positions
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {false ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={false ? "line-through text-muted-foreground" : ""}>
                        Maintain active LinkedIn networking (70%+)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {publishedBlogsCount >= 5 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={publishedBlogsCount >= 5 ? "line-through text-muted-foreground" : ""}>
                        Publish at least 5 blog posts
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}