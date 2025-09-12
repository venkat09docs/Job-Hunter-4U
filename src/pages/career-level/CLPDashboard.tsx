import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ClipboardCheck, Trophy, Plus, Eye, Home, Award, Medal } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CourseManagementTab from '@/components/CourseManagementTab';
import CLPAssignmentManagementTab from '@/components/admin/CLPAssignmentManagementTab';
import CLPReviewManagement from '@/components/admin/CLPReviewManagement';
import type { Course, Attempt, LeaderboardEntry, Module } from '@/types/clp';
import { cn } from '@/lib/utils';

const CLPDashboard = () => {
  const { user } = useAuth();
  const { role: userRole, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { loading, getCourses, getLeaderboard, getModulesByCourse } = useCareerLevelProgram();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [dashboardStats, setDashboardStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    pendingReviews: 0,
    totalAssignments: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // Leaderboard specific state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    if (user && userRole && !roleLoading) {
      fetchDashboardData();
      loadCourses();
      loadLeaderboard();
    }
  }, [user, userRole, roleLoading]);

  useEffect(() => {
    if (selectedCourse !== 'all') {
      loadModules(selectedCourse);
    } else {
      setModules([]);
    }
    setSelectedModule('all');
    loadLeaderboard();
  }, [selectedCourse]);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedModule]);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      // Fetch dashboard statistics
      const [coursesData, attemptsData, leaderboardData, profilesData] = await Promise.all([
        // Get total courses
        supabase
          .from('clp_courses')
          .select('id')
          .eq('is_active', true),
        
        // Get recent attempts for pending reviews
        supabase
          .from('clp_attempts')
          .select(`
            *,
            assignment:clp_assignments(
              title,
              module:clp_modules(
                title,
                course:clp_courses(title)
              )
            )
          `)
          .eq('status', 'submitted')
          .eq('review_status', 'pending')
          .order('submitted_at', { ascending: false })
          .limit(10),
        
        // Get leaderboard data
        getLeaderboard(),
        
        // Get unique active students count
        supabase
          .from('clp_attempts')
          .select('user_id')
      ]);

      // Count unique students
      const uniqueStudents = new Set(profilesData.data?.map(p => p.user_id) || []).size;
      
      // Get total assignments count
      const { data: assignmentsData } = await supabase
        .from('clp_assignments')
        .select('id')
        .eq('is_published', true);

      setDashboardStats({
        totalCourses: coursesData.data?.length || 0,
        activeStudents: uniqueStudents,
        pendingReviews: attemptsData.data?.length || 0,
        totalAssignments: assignmentsData?.length || 0
      });

      setRecentSubmissions(attemptsData.data || []);
      setTopPerformers(leaderboardData.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Leaderboard functions
  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const loadModules = async (courseId: string) => {
    try {
      const modulesData = await getModulesByCourse(courseId);
      setModules(modulesData);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const courseId = selectedCourse !== 'all' ? selectedCourse : undefined;
      const moduleId = selectedModule !== 'all' ? selectedModule : undefined;
      
      const data = await getLeaderboard(courseId, moduleId);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  // Helper functions for leaderboard
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getPositionStyles = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default:
        return "bg-background border-border";
    }
  };

  // Leaderboard calculations
  const currentUserEntry = leaderboardData.find(entry => entry.user_id === user?.id);
  const currentUserRank = currentUserEntry 
    ? leaderboardData.findIndex(entry => entry.user_id === user?.id) + 1 
    : null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for role to load before checking permissions
  if (roleLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'recruiter' || userRole === 'institute_admin';

  if (!isAdmin) {
    return <Navigate to="/dashboard/career-level/dashboard" replace />;
  }

  const stats = [
    {
      title: 'Total Courses',
      value: dashboardStats.totalCourses.toString(),
      change: 'Active courses',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Active Students',
      value: dashboardStats.activeStudents.toString(),
      change: 'Enrolled students',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Pending Reviews',
      value: dashboardStats.pendingReviews.toString(),
      change: 'Awaiting review',
      icon: ClipboardCheck,
      color: 'text-orange-600'
    },
    {
      title: 'Assignments',
      value: dashboardStats.totalAssignments.toString(),
      change: 'Published assignments',
      icon: Trophy,
      color: 'text-purple-600'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Assignments',
      description: 'View and edit existing assignments',
      icon: Eye,
      onClick: () => navigate('/dashboard/career-level/assignments'),
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      title: 'Review Submissions',
      description: 'Check pending assignment submissions',
      icon: ClipboardCheck,
      onClick: () => setActiveTab('reviews'),
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      title: 'View Leaderboard',
      description: 'Monitor student progress and rankings',
      icon: Trophy,
      onClick: () => navigate('/dashboard/career-level/leaderboard'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      title: 'Manage Courses',
      description: 'Organize courses and modules',
      icon: BookOpen,
      onClick: () => navigate('/dashboard/career-level/courses'),
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          {/* Left side - Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Career Level Up Program</span>
            </div>
          </div>
          
          {/* Right side - User Profile */}
          <UserProfileDropdown />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Career Level Up Program
          </h1>
          <p className="text-muted-foreground">
            Manage courses, assignments, and track student progress
          </p>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-6 justify-start ${action.color}`}
                  onClick={action.onClick}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-background/50">
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm opacity-80">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSubmissions.length > 0 ? (
                      recentSubmissions.slice(0, 5).map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ClipboardCheck className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{submission.assignment?.title || 'Assignment'}</p>
                              <p className="text-sm text-muted-foreground">
                                {submission.assignment?.module?.course?.title || 'Course'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            {submission.review_status === 'pending' ? 'Pending' : 'In Review'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent submissions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.length > 0 ? (
                      topPerformers.slice(0, 5).map((performer, index) => (
                        <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{performer.user?.full_name || performer.user?.username || 'Student'}</p>
                              <p className="text-sm text-muted-foreground">{performer.points_total} points</p>
                            </div>
                          </div>
                          <Badge className="bg-gradient-primary">
                            #{index + 1}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No performance data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <CourseManagementTab />
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <CLPAssignmentManagementTab />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <CLPReviewManagement />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Participants
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {leaderboardData.length}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Rank
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentUserRank ? `#${currentUserRank}` : 'Not ranked'}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-purple-600">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Points
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentUserEntry?.points_total || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-green-600">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Filter Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Course</label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Module</label>
                    <Select 
                      value={selectedModule} 
                      onValueChange={setSelectedModule}
                      disabled={selectedCourse === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Modules" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={loadLeaderboard} disabled={loading}>
                      Refresh Rankings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Rankings
                  </span>
                  {selectedCourse !== 'all' && (
                    <Badge variant="secondary">
                      {courses.find(c => c.id === selectedCourse)?.title}
                      {selectedModule !== 'all' && modules.length > 0 && (
                        <span className="ml-2">
                          • {modules.find(m => m.id === selectedModule)?.title}
                        </span>
                      )}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No rankings available
                    </h3>
                    <p className="text-muted-foreground">
                      Complete assignments to appear on the leaderboard
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardData.map((entry, index) => {
                      const position = index + 1;
                      const isCurrentUser = entry.user_id === user?.id;
                      
                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border transition-colors",
                            getPositionStyles(position),
                            isCurrentUser ? "ring-2 ring-primary ring-opacity-50" : ""
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10">
                              {getRankIcon(position)}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={entry.user?.profile_image_url} />
                                <AvatarFallback>
                                  {entry.user?.full_name?.charAt(0) || 
                                   entry.user?.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {entry.user?.full_name || entry.user?.username || 'Anonymous'}
                                  </p>
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="text-xs">
                                      You
                                    </Badge>
                                  )}
                                </div>
                                {entry.user?.username && entry.user?.full_name && (
                                  <p className="text-sm text-muted-foreground">
                                    @{entry.user.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              {entry.points_total}
                            </p>
                            <p className="text-sm text-muted-foreground">points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Performance Section */}
            {currentUserEntry && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        #{currentUserRank}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Rank</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {currentUserEntry.points_total}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {leaderboardData.length > 0 ? 
                          Math.round(((leaderboardData.length - (currentUserRank || 0) + 1) / leaderboardData.length) * 100) : 0
                        }%
                      </div>
                      <div className="text-sm text-muted-foreground">Percentile</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CLPDashboard;