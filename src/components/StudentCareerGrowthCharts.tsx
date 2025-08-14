import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  TrendingUp, 
  User, 
  Briefcase, 
  Linkedin, 
  Github, 
  Calendar,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Eye
} from 'lucide-react';

interface StudentStats {
  user_id: string;
  full_name: string;
  email: string;
  username: string;
  batch_id: string;
  batch_name: string;
  profile_completion: number;
  resume_progress: number;
  linkedin_progress: number;
  github_completion: number;
  linkedin_connections: number;
  linkedin_posts: number;
  total_job_applications: number;
  active_job_applications: number;
  last_activity: string;
  daily_activities?: {
    date: string;
    job_applications: number;
    linkedin_activities: number;
    github_commits: number;
    resume_updates: number;
    profile_views: number;
  }[];
  weekly_summary?: {
    week: string;
    total_activities: number;
    job_applications: number;
    networking: number;
    skill_development: number;
  }[];
}

interface StudentCareerGrowthChartsProps {
  student: StudentStats;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export function StudentCareerGrowthCharts({ student }: StudentCareerGrowthChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'overview' | 'weekly' | 'daily' | 'progress'>('overview');

  // Sample data - in real implementation, this would come from the student data
  const progressData = [
    { category: 'Profile', value: student.profile_completion, target: 100 },
    { category: 'Resume', value: student.resume_progress, target: 100 },
    { category: 'LinkedIn', value: student.linkedin_progress, target: 100 },
    { category: 'GitHub', value: student.github_completion, target: 100 }
  ];

  const activitiesData = [
    { name: 'Job Applications', value: student.total_job_applications, color: COLORS[0] },
    { name: 'LinkedIn Posts', value: student.linkedin_posts, color: COLORS[1] },
    { name: 'LinkedIn Connections', value: student.linkedin_connections, color: COLORS[2] },
    { name: 'GitHub Progress', value: student.github_completion, color: COLORS[3] }
  ];

  const weeklyData = student.weekly_summary || [
    { week: 'Week 1', total_activities: 12, job_applications: 3, networking: 5, skill_development: 4 },
    { week: 'Week 2', total_activities: 15, job_applications: 4, networking: 6, skill_development: 5 },
    { week: 'Week 3', total_activities: 18, job_applications: 5, networking: 7, skill_development: 6 },
    { week: 'Week 4', total_activities: 22, job_applications: 6, networking: 8, skill_development: 8 }
  ];

  const dailyData = student.daily_activities || [
    { date: '2024-01-01', job_applications: 2, linkedin_activities: 3, github_commits: 1, resume_updates: 1, profile_views: 5 },
    { date: '2024-01-02', job_applications: 1, linkedin_activities: 2, github_commits: 2, resume_updates: 0, profile_views: 3 },
    { date: '2024-01-03', job_applications: 3, linkedin_activities: 4, github_commits: 1, resume_updates: 1, profile_views: 7 },
    { date: '2024-01-04', job_applications: 2, linkedin_activities: 3, github_commits: 3, resume_updates: 0, profile_views: 4 },
    { date: '2024-01-05', job_applications: 4, linkedin_activities: 5, github_commits: 2, resume_updates: 1, profile_views: 8 }
  ];

  const getStatusColor = (value: number) => {
    if (value >= 80) return 'hsl(var(--success))';
    if (value >= 60) return 'hsl(var(--warning))';
    if (value >= 40) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {student.full_name} - Career Growth Report
          </DialogTitle>
          <DialogDescription>
            Detailed analytics and progress tracking for {student.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Profile</p>
                    <p className="text-2xl font-bold">{student.profile_completion}%</p>
                  </div>
                </div>
                <Progress value={student.profile_completion} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Job Apps</p>
                    <p className="text-2xl font-bold">{student.total_job_applications}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {student.active_job_applications} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">LinkedIn</p>
                    <p className="text-2xl font-bold">{student.linkedin_connections}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {student.linkedin_posts} posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">GitHub</p>
                    <p className="text-2xl font-bold">{student.github_completion}%</p>
                  </div>
                </div>
                <Progress value={student.github_completion} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Chart Selection Tabs */}
          <Tabs value={selectedChart} onValueChange={(value) => setSelectedChart(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Daily
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activities Distribution</CardTitle>
                    <CardDescription>Breakdown of career activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer className="h-[300px]" config={{}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activitiesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {activitiesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion Status</CardTitle>
                    <CardDescription>Progress across all areas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {progressData.map((item, index) => (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{item.category}</span>
                            <span>{item.value}%</span>
                          </div>
                          <Progress 
                            value={item.value} 
                            className="h-2"
                            style={{ 
                              background: `linear-gradient(to right, ${getStatusColor(item.value)} 0%, ${getStatusColor(item.value)} ${item.value}%, hsl(var(--muted)) ${item.value}%)` 
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progress vs Target</CardTitle>
                  <CardDescription>Current progress against targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-[400px]" config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="value" name="Current Progress" fill={COLORS[0]} />
                        <Bar dataKey="target" name="Target" fill={COLORS[1]} opacity={0.3} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity Trends</CardTitle>
                  <CardDescription>Activity patterns over the past weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-[400px]" config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="job_applications" 
                          stackId="1" 
                          stroke={COLORS[0]} 
                          fill={COLORS[0]} 
                          name="Job Applications"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="networking" 
                          stackId="1" 
                          stroke={COLORS[1]} 
                          fill={COLORS[1]} 
                          name="Networking"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="skill_development" 
                          stackId="1" 
                          stroke={COLORS[2]} 
                          fill={COLORS[2]} 
                          name="Skill Development"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity Breakdown</CardTitle>
                  <CardDescription>Daily activities over recent days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-[400px]" config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="job_applications" 
                          stroke={COLORS[0]} 
                          strokeWidth={2}
                          name="Job Applications"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="linkedin_activities" 
                          stroke={COLORS[1]} 
                          strokeWidth={2}
                          name="LinkedIn Activities"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="github_commits" 
                          stroke={COLORS[2]} 
                          strokeWidth={2}
                          name="GitHub Commits"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="profile_views" 
                          stroke={COLORS[3]} 
                          strokeWidth={2}
                          name="Profile Views"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Last Activity</p>
                    <p className="text-lg font-bold">
                      {student.last_activity === 'Never' ? 'Never' : 
                        new Date(student.last_activity).toLocaleDateString()
                      }
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Batch</p>
                    <p className="text-lg font-bold">{student.batch_name}</p>
                  </div>
                  <Badge variant="outline">{student.batch_name}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Overall Score</p>
                    <p className="text-lg font-bold">
                      {Math.round((student.profile_completion + student.github_completion + student.linkedin_progress) / 3)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}