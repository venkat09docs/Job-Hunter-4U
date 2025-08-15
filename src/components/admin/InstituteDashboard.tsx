import { useState, useEffect } from 'react';
import { useEnhancedStudentData } from '@/hooks/useEnhancedStudentData';
import { useInstituteName } from '@/hooks/useInstituteName';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Award,
  Calendar,
  Target,
  Activity,
  UserCheck,
  Briefcase,
  Github,
  Linkedin,
  RefreshCw
} from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))'
];

export const InstituteDashboard = () => {
  const { batches, loading, refreshData } = useEnhancedStudentData();
  const { instituteName, instituteSubscription } = useInstituteName();

  // Calculate metrics
  const totalStudents = batches.reduce((sum, batch) => sum + batch.student_count, 0);
  const totalBatches = batches.length;

  // Debug logging
  console.log('InstituteDashboard - Batches data:', batches);
  console.log('InstituteDashboard - Total students:', totalStudents);
  
  // Student progress metrics
  const allStudents = batches.flatMap(batch => batch.students);
  const totalStudentsCount = allStudents.length;
  
  const avgProfileCompletion = totalStudentsCount > 0 
    ? Math.round(allStudents.reduce((sum, student) => sum + student.profile_completion, 0) / totalStudentsCount)
    : 0;

  const avgLinkedInProgress = totalStudentsCount > 0 
    ? Math.round(allStudents.reduce((sum, student) => sum + student.linkedin_progress, 0) / totalStudentsCount)
    : 0;

  const totalJobApplications = allStudents.reduce((sum, student) => sum + student.total_job_applications, 0);

  const avgGithubCompletion = totalStudentsCount > 0 
    ? Math.round(allStudents.reduce((sum, student) => sum + student.github_completion, 0) / totalStudentsCount)
    : 0;

  // Batch distribution data for pie chart
  const batchDistribution = batches.map(batch => ({
    name: batch.batch_name,
    value: batch.student_count,
    percentage: totalStudents > 0 ? ((batch.student_count / totalStudents) * 100).toFixed(1) : 0
  }));

  // Profile completion by batch for bar chart
  const batchProgressData = batches.map(batch => {
    const avgCompletion = batch.students.length > 0 
      ? batch.students.reduce((sum, student) => sum + student.profile_completion, 0) / batch.students.length 
      : 0;
    const avgGithub = batch.students.length > 0 
      ? batch.students.reduce((sum, student) => sum + student.github_completion, 0) / batch.students.length 
      : 0;
    const avgLinkedIn = batch.students.length > 0 
      ? batch.students.reduce((sum, student) => sum + student.linkedin_progress, 0) / batch.students.length 
      : 0;
    
    return {
      batch: batch.batch_name,
      'Profile Completion': Math.round(avgCompletion),
      'GitHub Progress': Math.round(avgGithub),
      'LinkedIn Progress': Math.round(avgLinkedIn),
      'Students': batch.student_count
    };
  });

  // Activity levels data for area chart
  const activityData = batches.map(batch => {
    const totalConnections = batch.students.reduce((sum, student) => sum + student.linkedin_connections, 0);
    const totalPosts = batch.students.reduce((sum, student) => sum + student.linkedin_posts, 0);
    const totalJobs = batch.students.reduce((sum, student) => sum + student.total_job_applications, 0);
    
    return {
      batch: batch.batch_name,
      'LinkedIn Connections': totalConnections,
      'LinkedIn Posts': totalPosts,
      'Job Applications': totalJobs
    };
  });

  // Performance levels distribution
  const performanceLevels = {
    excellent: 0, // >80% completion
    good: 0,      // 60-80% completion
    average: 0,   // 40-60% completion
    poor: 0       // <40% completion
  };

  allStudents.forEach(student => {
    if (student.profile_completion >= 80) performanceLevels.excellent++;
    else if (student.profile_completion >= 60) performanceLevels.good++;
    else if (student.profile_completion >= 40) performanceLevels.average++;
    else performanceLevels.poor++;
  });

  const performanceData = [
    { name: 'Excellent (80%+)', value: performanceLevels.excellent, color: 'hsl(var(--success))' },
    { name: 'Good (60-80%)', value: performanceLevels.good, color: 'hsl(var(--primary))' },
    { name: 'Average (40-60%)', value: performanceLevels.average, color: 'hsl(var(--warning))' },
    { name: 'Needs Help (<40%)', value: performanceLevels.poor, color: 'hsl(var(--destructive))' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {instituteName} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your institute's performance and student progress
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalStudentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalBatches} batches
            </p>
            {instituteSubscription && (
              <div className="text-xs text-muted-foreground mt-1">
                Capacity: {totalStudentsCount}/{instituteSubscription.maxStudents}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profile Completion</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{avgProfileCompletion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LinkedIn Progress</CardTitle>
            <Linkedin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{avgLinkedInProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average LinkedIn progress
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GitHub Progress</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{avgGithubCompletion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average completion
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalJobApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total applications submitted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Student Distribution by Batch - Pie Chart */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Distribution by Batch
            </CardTitle>
            <CardDescription>Number of students in each batch</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batchDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                >
                  {batchDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Batch - Bar Chart */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Comparison by Batch
          </CardTitle>
          <CardDescription>Profile completion, LinkedIn, and GitHub progress across batches</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={batchProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="batch" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="Profile Completion" fill="hsl(var(--primary))" />
              <Bar dataKey="LinkedIn Progress" fill="hsl(var(--chart-2))" />
              <Bar dataKey="GitHub Progress" fill="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Metrics - Area Chart */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Student Activity by Batch
          </CardTitle>
          <CardDescription>LinkedIn activity and job applications across batches</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="batch" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="LinkedIn Connections" 
                stackId="1" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="LinkedIn Posts" 
                stackId="1" 
                stroke="hsl(var(--success))" 
                fill="hsl(var(--success))" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="Job Applications" 
                stackId="1" 
                stroke="hsl(var(--warning))" 
                fill="hsl(var(--warning))" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};