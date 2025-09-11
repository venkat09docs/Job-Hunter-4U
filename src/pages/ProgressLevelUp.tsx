import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trophy, Target, TrendingUp, Star, Github, Linkedin, Briefcase, Award, Calendar, Clock, CheckCircle2, Users, FileText, GitBranch, BookOpen, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useUserPointsHistory } from '@/hooks/useUserPointsHistory';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useProfileBadges } from '@/hooks/useProfileBadges';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useLinkedInNetworkProgress } from '@/hooks/useLinkedInNetworkProgress';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { format, subDays, startOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ActivityData {
  date: string;
  points: number;
  category: string;
}

interface SkillMetric {
  skill: string;
  current: number;
  target: number;
  progress: number;
}

export default function ProgressLevelUp() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { totalPoints, currentWeekPoints, currentMonthPoints, loading: pointsLoading } = useUserPoints();
  const { pointsHistory, loading: historyLoading } = useUserPointsHistory();
  const { completionPercentage: linkedinProgress } = useLinkedInProgress();
  const { profileBadges, userBadges, loading: badgesLoading } = useProfileBadges();
  const { getModuleProgress, assignments, loading: careerLoading } = useCareerAssignments();
  const { getCompletionPercentage: getGitHubProgress, tasks: githubTasks } = useGitHubProgress();
  const { getTodayMetrics } = useLinkedInNetworkProgress();
  const { formatWeeklyMetrics, formatDailyMetrics, getDailyTrends } = useDailyProgress();

  const [jobHuntingStats, setJobHuntingStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [blogStats, setBlogStats] = useState({ published: 0, thisMonth: 0 });
  const [githubStats, setGithubStats] = useState({ repos: 0, commits: 0, weeklyTasks: 0 });
  const [networkMetrics, setNetworkMetrics] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  // Calculate progress percentages
  const resumeProgress = getModuleProgress('RESUME');
  const githubProgress = getGitHubProgress();

  // Fetch additional statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch network metrics
        const todayMetrics = await getTodayMetrics(format(new Date(), 'yyyy-MM-dd'));
        setNetworkMetrics(todayMetrics);
        // Job hunting statistics
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const { data: jobData } = await supabase
          .from('job_tracker')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('is_archived', false);

        const totalJobs = jobData?.length || 0;
        const weekJobs = jobData?.filter(job => new Date(job.created_at) >= weekStart).length || 0;
        const monthJobs = jobData?.filter(job => new Date(job.created_at) >= monthStart).length || 0;

        setJobHuntingStats({ total: totalJobs, thisWeek: weekJobs, thisMonth: monthJobs });

        // Blog statistics
        const { data: blogData } = await supabase
          .from('blogs')
          .select('created_at, is_public')
          .eq('user_id', user.id);

        const publishedBlogs = blogData?.filter(blog => blog.is_public).length || 0;
        const monthBlogs = blogData?.filter(blog => 
          blog.is_public && new Date(blog.created_at) >= monthStart
        ).length || 0;

        setBlogStats({ published: publishedBlogs, thisMonth: monthBlogs });

        // GitHub statistics
        const { data: repoData } = await supabase
          .from('github_repos')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        const { data: weeklyTaskData } = await supabase
          .from('github_user_tasks')
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['SUBMITTED', 'VERIFIED']);

        // Estimate commits from GitHub signals and tasks
        const { data: signalData } = await supabase
          .from('github_signals')
          .select('*')
          .eq('user_id', user.id);

        const estimatedCommits = (signalData?.length || 0) + (weeklyTaskData?.length || 0) * 3;

        setGithubStats({
          repos: repoData?.length || 0,
          commits: estimatedCommits,
          weeklyTasks: weeklyTaskData?.length || 0
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Process activity data for charts
  const activityChartData = useMemo(() => {
    if (!pointsHistory) return [];

    return pointsHistory
      .slice(-7)
      .map(activity => ({
        date: format(new Date(activity.activity_date), 'MMM dd'),
        points: activity.points_earned,
        category: activity.activity_settings?.category || 'Other'
      }));
  }, [pointsHistory]);

  // Skills metrics
  const skillsData: SkillMetric[] = [
    { skill: 'Resume Building', current: resumeProgress, target: 100, progress: resumeProgress },
    { skill: 'LinkedIn Optimization', current: linkedinProgress, target: 100, progress: linkedinProgress },
    { skill: 'GitHub Profile', current: githubProgress, target: 100, progress: githubProgress },
    { skill: 'Job Applications', current: jobHuntingStats.total, target: 20, progress: Math.min((jobHuntingStats.total / 20) * 100, 100) },
    { skill: 'Content Creation', current: blogStats.published, target: 5, progress: Math.min((blogStats.published / 5) * 100, 100) },
  ];

  // Progress overview data
  const progressData = [
    { name: 'Resume', value: resumeProgress, color: COLORS[0] },
    { name: 'LinkedIn', value: linkedinProgress, color: COLORS[1] },
    { name: 'GitHub', value: githubProgress, color: COLORS[2] },
    { name: 'Networking', value: Math.min((Object.values(networkMetrics).reduce((sum, val) => sum + val, 0) / 50) * 100, 100), color: COLORS[3] },
  ];

  const overallProgress = Math.round(progressData.reduce((sum, item) => sum + item.value, 0) / progressData.length);

  if (loading || profileLoading || pointsLoading || historyLoading || badgesLoading || careerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading progress report...</p>
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
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Progress Level Up Report
              </h1>
              <p className="text-muted-foreground">Comprehensive overview of your career growth journey</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(), 'MMM dd, yyyy')}
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Overall Progress</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{overallProgress}%</p>
                </div>
                <Trophy className="h-8 w-8 text-blue-500" />
              </div>
              <Progress value={overallProgress} className="mt-3" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Points</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{totalPoints}</p>
                </div>
                <Star className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">+{currentWeekPoints} this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Badges Earned</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{userBadges.length}</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                of {profileBadges.length} available
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Job Applications</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{jobHuntingStats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">+{jobHuntingStats.thisWeek} this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {progressData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Weekly Activity Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="points" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.profile_image_url} />
                    <AvatarFallback>
                      {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {profile?.full_name || profile?.username || 'User'}
                    </h3>
                    <p className="text-muted-foreground">{profile?.industry || 'Professional'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{profile?.subscription_plan || 'Free Plan'}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Member since {format(new Date(profile?.created_at || Date.now()), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid gap-6">
              {skillsData.map((skill) => (
                <Card key={skill.skill}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{skill.skill}</h3>
                      <span className="text-sm text-muted-foreground">
                        {skill.current} / {skill.target}
                      </span>
                    </div>
                    <Progress value={skill.progress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {Math.round(skill.progress)}% complete
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* LinkedIn Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    LinkedIn Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Profile Optimization</span>
                        <span>{linkedinProgress}%</span>
                      </div>
                      <Progress value={linkedinProgress} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {networkMetrics?.connections || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Connections</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {networkMetrics?.posts || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GitHub Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Profile Setup</span>
                        <span>{githubProgress}%</span>
                      </div>
                      <Progress value={githubProgress} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{githubStats.repos}</p>
                        <p className="text-xs text-muted-foreground">Repositories</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{githubStats.commits}</p>
                        <p className="text-xs text-muted-foreground">Contributions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Hunting Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Job Hunting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{jobHuntingStats.total}</p>
                      <p className="text-sm text-muted-foreground">Total Applications</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl font-semibold">{jobHuntingStats.thisWeek}</p>
                        <p className="text-xs text-muted-foreground">This Week</p>
                      </div>
                      <div>
                        <p className="text-xl font-semibold">{jobHuntingStats.thisMonth}</p>
                        <p className="text-xs text-muted-foreground">This Month</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileBadges.map((badge) => {
                const isEarned = userBadges.some(ub => ub.badge_id === badge.id);
                return (
                  <Card key={badge.id} className={isEarned ? 'border-primary' : 'opacity-60'}>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{badge.icon}</div>
                      <h3 className="font-semibold mb-2">{badge.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                      {isEarned ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Earned
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Earned</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Career Growth Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        🎯 Top Achievements This Month
                      </h4>
                      <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        <li>• Earned {currentMonthPoints} activity points</li>
                        <li>• Applied to {jobHuntingStats.thisMonth} new positions</li>
                        <li>• Published {blogStats.thisMonth} blog posts</li>
                        <li>• LinkedIn profile at {linkedinProgress}% completion</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        📈 Growth Recommendations
                      </h4>
                      <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                        {resumeProgress < 90 && <li>• Complete remaining resume sections for better visibility</li>}
                        {linkedinProgress < 100 && <li>• Finish LinkedIn optimization to boost profile views</li>}
                        {githubProgress < 80 && <li>• Enhance GitHub profile with more repositories</li>}
                        {jobHuntingStats.total < 10 && <li>• Increase job application activity for better opportunities</li>}
                      </ul>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        🏆 Upcoming Milestones
                      </h4>
                      <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                        <li>• {Math.ceil((100 - overallProgress) / 10)} more weeks to reach 100% overall progress</li>
                        <li>• {Math.max(0, profileBadges.length - userBadges.length)} badges remaining to unlock</li>
                        <li>• {Math.max(0, 1000 - totalPoints)} points to reach 1000 point milestone</li>
                      </ul>
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