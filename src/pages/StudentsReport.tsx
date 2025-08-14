import { useState } from 'react';
import { useEnhancedStudentData } from '@/hooks/useEnhancedStudentData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Users, 
  RefreshCw, 
  TrendingUp, 
  User, 
  Briefcase, 
  Linkedin, 
  Github,
  Home,
  BarChart3,
  Activity,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useInstituteName } from '@/hooks/useInstituteName';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { InstituteSubscriptionBadge } from '@/components/InstituteSubscriptionBadge';
import { StudentCareerGrowthCharts } from '@/components/StudentCareerGrowthCharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
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

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export default function StudentsReport() {
  const { batches, loading, refreshData } = useEnhancedStudentData();
  const { toast } = useToast();
  const { instituteName } = useInstituteName();
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const totalStudents = batches.reduce((sum, batch) => sum + batch.student_count, 0);
  const averageProfileCompletion = batches.length > 0 
    ? Math.round(
        batches.reduce((sum, batch) => 
          sum + batch.students.reduce((batchSum, student) => 
            batchSum + student.profile_completion, 0
          ) / batch.students.length, 0
        ) / batches.length
      ) 
    : 0;

  const handleBatchSelection = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatches(prev => [...prev, batchId]);
      // Also select all students in this batch
      const batchStudents = batches.find(b => b.batch_id === batchId)?.students || [];
      setSelectedStudents(prev => [...prev, ...batchStudents.map(s => s.user_id)]);
    } else {
      setSelectedBatches(prev => prev.filter(id => id !== batchId));
      // Deselect all students in this batch
      const batchStudents = batches.find(b => b.batch_id === batchId)?.students || [];
      setSelectedStudents(prev => 
        prev.filter(id => !batchStudents.some(s => s.user_id === id))
      );
    }
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
      // If this was the last student in a batch, deselect the batch too
      const student = batches.flatMap(b => b.students).find(s => s.user_id === studentId);
      if (student) {
        const batchStudents = batches.find(b => b.batch_id === student.batch_id)?.students || [];
        const remainingSelected = batchStudents.filter(s => 
          s.user_id !== studentId && selectedStudents.includes(s.user_id)
        );
        if (remainingSelected.length === 0) {
          setSelectedBatches(prev => prev.filter(id => id !== student.batch_id));
        }
      }
    }
  };

  const handleExportSelected = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select students or batches to export',
        variant: 'destructive'
      });
      return;
    }
    toast({
      title: 'Export Started',
      description: 'Preparing selected student data for export...'
    });
  };

  const handleExportAll = () => {
    toast({
      title: 'Export Started', 
      description: 'Preparing all student data for export...'
    });
  };

  // Generate batch summary data for charts
  const batchChartData = batches.map(batch => ({
    name: batch.batch_name,
    students: batch.student_count,
    avgCompletion: batch.avg_completion,
    avgLinkedIn: batch.avg_linkedin_progress,
    avgGitHub: batch.avg_github_progress,
    avgJobApps: batch.avg_job_applications
  }));

  const progressDistribution = batches.flatMap(batch => 
    batch.students.map(student => ({
      range: student.profile_completion >= 80 ? '80-100%' :
             student.profile_completion >= 60 ? '60-79%' :
             student.profile_completion >= 40 ? '40-59%' : '0-39%',
      value: 1
    }))
  );

  const progressSummary = progressDistribution.reduce((acc, curr) => {
    acc[curr.range] = (acc[curr.range] || 0) + curr.value;
    return acc;
  }, {} as Record<string, number>);

  const progressChartData = Object.entries(progressSummary).map(([range, count]) => ({
    name: range,
    value: count,
    percentage: Math.round((count / totalStudents) * 100)
  }));

  const getStatusColor = (value: number, type: 'profile' | 'github') => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getActivityStatus = (lastActivity: string) => {
    if (lastActivity === 'Never') return { color: 'bg-gray-500', text: 'Inactive' };
    
    const activityDate = new Date(lastActivity);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) return { color: 'bg-green-500', text: 'Active' };
    if (daysDiff <= 7) return { color: 'bg-yellow-500', text: 'Recent' };
    if (daysDiff <= 30) return { color: 'bg-orange-500', text: 'Moderate' };
    return { color: 'bg-red-500', text: 'Inactive' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-semibold">
                {instituteName ? `${instituteName} - Students Report` : 'Students Report'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor and track student progress across all batches
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <InstituteSubscriptionBadge />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Report Overview</h2>
              <p className="text-muted-foreground">
                Detailed analytics and insights
              </p>
            </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportSelected} disabled={selectedStudents.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          <Button onClick={handleExportAll} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {batches.length} batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profile Completion</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProfileCompletion}%</div>
            <Progress value={averageProfileCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected for Export</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Students selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch-wise Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Batch Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Batch Performance Overview
                </CardTitle>
                <CardDescription>Average completion rates across batches</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]" config={{}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={batchChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="avgCompletion" name="Profile %" fill={CHART_COLORS[0]} />
                      <Bar dataKey="avgLinkedIn" name="LinkedIn %" fill={CHART_COLORS[1]} />
                      <Bar dataKey="avgGitHub" name="GitHub %" fill={CHART_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Progress Distribution
                </CardTitle>
                <CardDescription>Student progress distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]" config={{}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {progressChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Batch Details */}
          {batches.map((batch) => (
            <Card key={batch.batch_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedBatches.includes(batch.batch_id)}
                      onCheckedChange={(checked) => 
                        handleBatchSelection(batch.batch_id, checked as boolean)
                      }
                    />
                    <div>
                      <CardTitle>{batch.batch_name}</CardTitle>
                      <CardDescription>
                        {batch.student_count} students • Avg: {batch.avg_completion}% completion
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {batch.student_count} Students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Batch Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{batch.avg_completion}%</p>
                    <p className="text-sm text-muted-foreground">Avg Profile</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{batch.avg_linkedin_progress}%</p>
                    <p className="text-sm text-muted-foreground">Avg LinkedIn</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{batch.avg_github_progress}%</p>
                    <p className="text-sm text-muted-foreground">Avg GitHub</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{batch.avg_job_applications}</p>
                    <p className="text-sm text-muted-foreground">Avg Job Apps</p>
                  </div>
                </div>

                {/* Student Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {batch.students.slice(0, 8).map((student) => (
                    <Card key={student.user_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Checkbox
                            checked={selectedStudents.includes(student.user_id)}
                            onCheckedChange={(checked) => 
                              handleStudentSelection(student.user_id, checked as boolean)
                            }
                          />
                          <Badge 
                            variant="outline" 
                            className={`${getActivityStatus(student.last_activity).color} text-white`}
                          >
                            {getActivityStatus(student.last_activity).text}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.username}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Profile</span>
                            <span>{student.profile_completion}%</span>
                          </div>
                          <Progress value={student.profile_completion} className="h-1" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <Briefcase className="h-3 w-3 mx-auto mb-1" />
                            <p className="font-medium">{student.total_job_applications}</p>
                            <p className="text-muted-foreground">Jobs</p>
                          </div>
                          <div className="text-center">
                            <Linkedin className="h-3 w-3 mx-auto mb-1" />
                            <p className="font-medium">{student.linkedin_connections}</p>
                            <p className="text-muted-foreground">Connections</p>
                          </div>
                          <div className="text-center">
                            <Github className="h-3 w-3 mx-auto mb-1" />
                            <p className="font-medium">{student.github_completion}%</p>
                            <p className="text-muted-foreground">GitHub</p>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <StudentCareerGrowthCharts student={student} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {batch.students.length > 8 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    ... and {batch.students.length - 8} more students
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Students Details</CardTitle>
              <CardDescription>
                Comprehensive view of all student activities and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === totalStudents}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allStudentIds = batches.flatMap(b => b.students.map(s => s.user_id));
                            setSelectedStudents(allStudentIds);
                            setSelectedBatches(batches.map(b => b.batch_id));
                          } else {
                            setSelectedStudents([]);
                            setSelectedBatches([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Job Apps</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.flatMap(batch => 
                    batch.students.map(student => (
                      <TableRow key={student.user_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.user_id)}
                            onCheckedChange={(checked) => 
                              handleStudentSelection(student.user_id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{student.batch_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.profile_completion} className="w-16 h-2" />
                            <span className="text-sm">{student.profile_completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{student.active_job_applications}</p>
                            <p className="text-xs text-muted-foreground">
                              /{student.total_job_applications} total
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{student.linkedin_connections}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.linkedin_posts} posts
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.github_completion} className="w-16 h-2" />
                            <span className="text-sm">{student.github_completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.last_activity === 'Never' ? 'Never' : 
                            new Date(student.last_activity).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getActivityStatus(student.last_activity).color} text-white`}
                          >
                            {getActivityStatus(student.last_activity).text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StudentCareerGrowthCharts student={student} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}