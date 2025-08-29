import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Building2, 
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
  Shield,
  ClipboardList,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))'
];

interface InstituteMetrics {
  institute_id: string;
  institute_name: string;
  student_count: number;
  batch_count: number;
  subscription_plan: string;
  subscription_active: boolean;
  max_students: number;
  avg_profile_completion: number;
  total_job_applications: number;
  avg_github_completion: number;
  linkedin_activity: number;
}

interface OverallMetrics {
  total_institutes: number;
  total_students: number;
  total_batches: number;
  active_subscriptions: number;
  avg_institute_utilization: number;
  pending_assignments: number;
  verified_assignments: number;
  extension_requests: number;
}

export const SuperAdminDashboard = () => {
  const [instituteMetrics, setInstituteMetrics] = useState<InstituteMetrics[]>([]);
  const [overallMetrics, setOverallMetrics] = useState<OverallMetrics>({
    total_institutes: 0,
    total_students: 0,
    total_batches: 0,
    active_subscriptions: 0,
    avg_institute_utilization: 0,
    pending_assignments: 0,
    verified_assignments: 0,
    extension_requests: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuperAdminMetrics();
  }, []);

  const fetchSuperAdminMetrics = async () => {
    try {
      setLoading(true);

      // Get all institutes with their metrics
      const { data: institutes, error: instituteError } = await supabase
        .from('institutes')
        .select(`
          id,
          name,
          subscription_plan,
          subscription_active,
          max_students,
          current_student_count
        `)
        .eq('is_active', true);

      if (instituteError) throw instituteError;

      // Get batch counts for each institute
      const { data: batchCounts, error: batchError } = await supabase
        .from('batches')
        .select('institute_id')
        .eq('is_active', true);

      if (batchError) throw batchError;

      const batchCountMap = new Map<string, number>();
      batchCounts?.forEach(batch => {
        const current = batchCountMap.get(batch.institute_id) || 0;
        batchCountMap.set(batch.institute_id, current + 1);
      });

      // Get all student assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('user_assignments')
        .select(`
          institute_id,
          user_id
        `)
        .eq('is_active', true)
        .eq('assignment_type', 'batch');

      if (assignmentError) throw assignmentError;

      // Get student metrics for each institute
      const instituteStudentMap = new Map<string, string[]>();
      assignments?.forEach(assignment => {
        if (!instituteStudentMap.has(assignment.institute_id)) {
          instituteStudentMap.set(assignment.institute_id, []);
        }
        instituteStudentMap.get(assignment.institute_id)?.push(assignment.user_id);
      });

      const metricsPromises = institutes?.map(async (institute) => {
        const studentIds = instituteStudentMap.get(institute.id) || [];
        
        if (studentIds.length === 0) {
          return {
            institute_id: institute.id,
            institute_name: institute.name,
            student_count: 0,
            batch_count: batchCountMap.get(institute.id) || 0,
            subscription_plan: institute.subscription_plan || 'none',
            subscription_active: institute.subscription_active || false,
            max_students: institute.max_students || 0,
            avg_profile_completion: 0,
            total_job_applications: 0,
            avg_github_completion: 0,
            linkedin_activity: 0
          };
        }

        // Get profile completion data
        const { data: resumeData } = await supabase
          .from('resume_data')
          .select('*')
          .in('user_id', studentIds);

        const profileCompletions = resumeData?.map(resume => {
          const sections = [
            resume.personal_details,
            resume.experience,
            resume.education,
            resume.skills_interests,
            resume.professional_summary
          ];
          const completedSections = sections.filter(section => 
            section && (Array.isArray(section) ? section.length > 0 : Object.keys(section).length > 0)
          ).length;
          return (completedSections / sections.length) * 100;
        }) || [];

        const avgProfileCompletion = profileCompletions.length > 0 
          ? profileCompletions.reduce((sum, completion) => sum + completion, 0) / profileCompletions.length 
          : 0;

        // Get job applications
        const { data: jobApps } = await supabase
          .from('job_tracker')
          .select('user_id')
          .in('user_id', studentIds)
          .eq('is_archived', false);

        // Get GitHub progress
        const { data: githubProgress } = await supabase
          .from('github_progress')
          .select('user_id, completed')
          .in('user_id', studentIds);

        const githubCompletions = studentIds.map(userId => {
          const userProgress = githubProgress?.filter(p => p.user_id === userId && p.completed) || [];
          return (userProgress.length / 10) * 100; // Assuming 10 total tasks
        });

        const avgGithubCompletion = githubCompletions.length > 0 
          ? githubCompletions.reduce((sum, completion) => sum + completion, 0) / githubCompletions.length 
          : 0;

        // Get LinkedIn activity
        const { data: linkedinMetrics } = await supabase
          .from('linkedin_network_metrics')
          .select('value')
          .in('user_id', studentIds);

        const linkedinActivity = linkedinMetrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;

        return {
          institute_id: institute.id,
          institute_name: institute.name,
          student_count: studentIds.length,
          batch_count: batchCountMap.get(institute.id) || 0,
          subscription_plan: institute.subscription_plan || 'none',
          subscription_active: institute.subscription_active || false,
          max_students: institute.max_students || 0,
          avg_profile_completion: Math.round(avgProfileCompletion),
          total_job_applications: jobApps?.length || 0,
          avg_github_completion: Math.round(avgGithubCompletion),
          linkedin_activity: linkedinActivity
        };
      }) || [];

      const metrics = await Promise.all(metricsPromises);
      setInstituteMetrics(metrics);

      // Calculate overall metrics
      const totalStudents = metrics.reduce((sum, metric) => sum + metric.student_count, 0);
      const totalBatches = metrics.reduce((sum, metric) => sum + metric.batch_count, 0);
      const activeSubscriptions = metrics.filter(metric => metric.subscription_active).length;
      const avgUtilization = metrics.length > 0 
        ? metrics.reduce((sum, metric) => {
            const utilization = metric.max_students > 0 ? (metric.student_count / metric.max_students) * 100 : 0;
            return sum + utilization;
           }, 0) / metrics.length 
         : 0;

      // Fetch assignment statistics
      // Get pending assignments from career_task_assignments
      const { data: pendingCareerAssignments, error: pendingCareerError } = await supabase
        .from('career_task_assignments')
        .select('id')
        .in('status', ['assigned', 'submitted']);

      if (pendingCareerError) throw pendingCareerError;

      // Get verified assignments from career_task_assignments
      const { data: verifiedCareerAssignments, error: verifiedCareerError } = await supabase
        .from('career_task_assignments')
        .select('id')
        .eq('status', 'verified');

      if (verifiedCareerError) throw verifiedCareerError;

      // Get pending assignments from job_hunting_assignments
      const { data: pendingJobAssignments, error: pendingJobError } = await supabase
        .from('job_hunting_assignments')
        .select('id')
        .in('status', ['assigned', 'submitted']);

      if (pendingJobError) throw pendingJobError;

      // Get verified assignments from job_hunting_assignments
      const { data: verifiedJobAssignments, error: verifiedJobError } = await supabase
        .from('job_hunting_assignments')
        .select('id')
        .eq('status', 'verified');

      if (verifiedJobError) throw verifiedJobError;

      // Get extension requests
      const { data: extensionRequests, error: extensionError } = await supabase
        .from('linkedin_task_renable_requests')
        .select('id')
        .eq('status', 'pending');

      if (extensionError) throw extensionError;

      const totalPendingAssignments = (pendingCareerAssignments?.length || 0) + (pendingJobAssignments?.length || 0);
      const totalVerifiedAssignments = (verifiedCareerAssignments?.length || 0) + (verifiedJobAssignments?.length || 0);
      const totalExtensionRequests = extensionRequests?.length || 0;

      setOverallMetrics({
        total_institutes: institutes?.length || 0,
        total_students: totalStudents,
        total_batches: totalBatches,
        active_subscriptions: activeSubscriptions,
        avg_institute_utilization: Math.round(avgUtilization),
        pending_assignments: totalPendingAssignments,
        verified_assignments: totalVerifiedAssignments,
        extension_requests: totalExtensionRequests
      });

    } catch (error) {
      console.error('Error fetching super admin metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscription distribution data
  const subscriptionData = instituteMetrics.reduce((acc, institute) => {
    const plan = institute.subscription_plan || 'none';
    const existing = acc.find(item => item.name === plan);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: plan, value: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  // Institute utilization data
  const utilizationData = instituteMetrics.map(institute => ({
    name: institute.institute_name,
    'Student Count': institute.student_count,
    'Max Capacity': institute.max_students,
    'Utilization %': institute.max_students > 0 ? Math.round((institute.student_count / institute.max_students) * 100) : 0
  }));

  // Performance comparison data
  const performanceData = instituteMetrics.map(institute => ({
    institute: institute.institute_name,
    'Profile Completion': institute.avg_profile_completion,
    'GitHub Progress': institute.avg_github_completion,
    'Job Applications': institute.total_job_applications,
    'LinkedIn Activity': institute.linkedin_activity
  }));

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System-wide overview of all institutes, batches, and student performance
        </p>
      </div>

      {/* Overall KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{overallMetrics.total_institutes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallMetrics.active_subscriptions} with active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{overallMetrics.total_students}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all institutes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{overallMetrics.total_batches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active batches system-wide
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{overallMetrics.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently paying institutes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{overallMetrics.avg_institute_utilization}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Capacity utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Statuses Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignment Statuses</h2>
          <p className="text-muted-foreground">Overview of all assignment activities and requests across the system</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{overallMetrics.pending_assignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assignments awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Assignments</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{overallMetrics.verified_assignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully completed assignments
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Extension Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{overallMetrics.extension_requests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending extension requests
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution - Pie Chart */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Subscription Plan Distribution
            </CardTitle>
            <CardDescription>Number of institutes by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Institute Utilization - Bar Chart */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Institute Capacity Utilization
            </CardTitle>
            <CardDescription>Student count vs maximum capacity by institute</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                <Bar dataKey="Student Count" fill="hsl(var(--primary))" />
                <Bar dataKey="Max Capacity" fill="hsl(var(--muted))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison - Line Chart */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Institute Performance Comparison
          </CardTitle>
          <CardDescription>Profile completion and GitHub progress across institutes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="institute" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Line 
                type="monotone" 
                dataKey="Profile Completion" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="GitHub Progress" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Overview - Area Chart */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Student Activity Overview by Institute
          </CardTitle>
          <CardDescription>Job applications and LinkedIn activity across institutes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="institute" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
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
                dataKey="Job Applications" 
                stackId="1" 
                stroke="hsl(var(--warning))" 
                fill="hsl(var(--warning))" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="LinkedIn Activity" 
                stackId="1" 
                stroke="hsl(var(--accent))" 
                fill="hsl(var(--accent))" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};