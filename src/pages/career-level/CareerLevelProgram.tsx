import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Trophy,
  FileText,
  Timer,
  PlayCircle,
  Home,
  Medal,
  Award,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { 
  AssignmentWithProgress, 
  Attempt, 
  LeaderboardEntry, 
  Course, 
  Module 
} from '@/types/clp';
import { ASSIGNMENT_STATUS_LABELS, ATTEMPT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import AIGeneralistsTab from '@/components/AIGeneralistsTab';
import AssignmentManagementTab from '@/components/admin/AssignmentManagementTab';

const CareerLevelProgram: React.FC = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    loading, 
    getAssignmentsWithProgress, 
    getAttemptsByUser,
    getLeaderboard,
    getCourses,
    getModulesByCourse
  } = useCareerLevelProgram();
  
  // State for My Assignments tab
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  
  // State for Leaderboard tab
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  
  // Get active tab from URL params or default to 'ai-generalists'
  const activeTab = searchParams.get('tab') || 'ai-generalists';

  useEffect(() => {
    if (user) {
      loadData();
      loadCourses();
      loadLeaderboard();
    }
  }, [user]);

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

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Load data for My Assignments
  const loadData = async () => {
    const [assignmentsData, attemptsData] = await Promise.all([
      getAssignmentsWithProgress(),
      getAttemptsByUser()
    ]);
    
    setAssignments(assignmentsData);
    setAttempts(attemptsData);
  };

  // Load data for Leaderboard
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

  // Helper functions for My Assignments
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getAttemptStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-500';
      case 'started': return 'bg-blue-500';
      case 'auto_submitted': return 'bg-orange-500';
      case 'invalidated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper functions for Leaderboard
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

  // Filter assignments by status
  const upcomingAssignments = assignments.filter(a => 
    a.status === 'scheduled' || (a.status === 'open' && a.canAttempt)
  );
  
  const activeAssignments = assignments.filter(a => 
    a.userAttempts.some(attempt => attempt.status === 'started')
  );
  
  const completedAssignments = assignments.filter(a => 
    a.userAttempts.some(attempt => 
      attempt.status === 'submitted' || attempt.status === 'auto_submitted'
    )
  );

  // Leaderboard calculations
  const currentUserEntry = leaderboardData.find(entry => entry.user_id === user?.id);
  const currentUserRank = currentUserEntry 
    ? leaderboardData.findIndex(entry => entry.user_id === user?.id) + 1 
    : null;

  const renderAssignmentCard = (assignment: AssignmentWithProgress) => {
    const hasActiveAttempt = assignment.userAttempts.some(a => a.status === 'started');
    const isCompleted = assignment.userAttempts.some(a => 
      a.status === 'submitted' || a.status === 'auto_submitted'
    );
    
    const bestScore = assignment.userAttempts
      .filter(a => a.score_numeric !== null)
      .reduce((max, attempt) => 
        Math.max(max, attempt.score_numeric || 0), 0
      );

    return (
      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{assignment.title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>{assignment.module?.course?.title} • {assignment.module?.title}</span>
              </div>
            </div>
            <Badge 
              className={cn('text-white', getStatusColor(assignment.status))}
            >
              {ASSIGNMENT_STATUS_LABELS[assignment.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Assignment Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Timer className="w-4 h-4 mr-2" />
              <span>
                {assignment.duration_minutes ? 
                  `${assignment.duration_minutes} minutes` : 
                  'No time limit'
                }
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Trophy className="w-4 h-4 mr-2" />
              <span>{assignment.max_attempts} attempt{assignment.max_attempts !== 1 ? 's' : ''}</span>
            </div>
            {assignment.due_at && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Due: {formatDateTime(assignment.due_at)}</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
              <FileText className="w-4 h-4 mr-2" />
              <span>Type: {assignment.type.toUpperCase()}</span>
            </div>
          </div>

          {/* Progress/Status */}
          {assignment.userAttempts.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Attempts: {assignment.userAttempts.length}/{assignment.max_attempts}</span>
                {bestScore > 0 && <span>Best Score: {bestScore.toFixed(1)}%</span>}
              </div>
              <Progress 
                value={(assignment.userAttempts.length / assignment.max_attempts) * 100} 
                className="h-2" 
              />
            </div>
          )}

          {/* Due Date Warning */}
          {assignment.due_at && assignment.status === 'open' && (
            <div className="text-sm">
              {(() => {
                const daysRemaining = getDaysRemaining(assignment.due_at);
                if (daysRemaining <= 1) {
                  return (
                    <div className="flex items-center text-red-600 bg-red-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Due {daysRemaining === 0 ? 'today' : 'tomorrow'}!</span>
                    </div>
                  );
                } else if (daysRemaining <= 3) {
                  return (
                    <div className="flex items-center text-orange-600 bg-orange-50 p-2 rounded">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Due in {daysRemaining} days</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Instructions */}
          {assignment.instructions && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-2">{assignment.instructions}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {hasActiveAttempt ? (
              <Button asChild className="flex-1">
                <Link to={`/career-level/attempt/${assignment.userAttempts.find(a => a.status === 'started')?.id}`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continue Attempt
                </Link>
              </Button>
            ) : assignment.canAttempt && assignment.status === 'open' ? (
              <Button asChild className="flex-1">
                <Link to={`/career-level/assignment/${assignment.id}/start`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Assignment
                </Link>
              </Button>
            ) : isCompleted ? (
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/career-level/feedback/${assignment.userAttempts[0]?.id}`}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  View Results
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled className="flex-1">
                {assignment.status === 'scheduled' ? 'Not Started' : 
                 assignment.status === 'closed' ? 'Closed' : 
                 'No Attempts Remaining'}
              </Button>
            )}
            
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/career-level/assignment/${assignment.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Dashboard</span>
              </Button>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Career Level Up Program</span>
              </div>
            </div>
            <UserProfileDropdown />
          </div>
        </header>
        
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Career Level Up Program
          </h1>
          <p className="text-muted-foreground">
            Track your assignments and compete with peers in your learning journey
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={`grid w-full ${role === 'admin' || role === 'recruiter' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="ai-generalists">Skill Developer Programs</TabsTrigger>
            <TabsTrigger value="assignments">My Assignments</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            {(role === 'admin' || role === 'recruiter') && (
              <TabsTrigger value="manage-assignments">Assignments</TabsTrigger>
            )}
          </TabsList>

          {/* Skill Developer Programs Tab */}
          <TabsContent value="ai-generalists" className="space-y-6">
            <AIGeneralistsTab />
          </TabsContent>

          {/* My Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center">
                  <PlayCircle className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">{activeAssignments.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedAssignments.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center">
                  <Trophy className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">
                      {attempts.reduce((sum, attempt) => sum + attempt.score_points, 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Assignment Tabs */}
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Available ({upcomingAssignments.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  In Progress ({activeAssignments.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedAssignments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingAssignments.map(renderAssignmentCard)}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No assignments available</h3>
                    <p className="text-sm text-muted-foreground">
                      Check back later for new assignments or contact your instructor.
                    </p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {activeAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeAssignments.map(renderAssignmentCard)}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No active assignments</h3>
                    <p className="text-sm text-muted-foreground">
                      Start an assignment to see it here.
                    </p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedAssignments.map(renderAssignmentCard)}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No completed assignments</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete assignments to see them here.
                    </p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
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
                          className={`
                            flex items-center justify-between p-4 rounded-lg border transition-colors
                            ${getPositionStyles(position)}
                            ${isCurrentUser ? 'ring-2 ring-primary ring-opacity-50' : ''}
                          `}
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

          {/* Assignment Management Tab - Only for Admins */}
          {(role === 'admin' || role === 'recruiter') && (
            <TabsContent value="manage-assignments" className="space-y-6">
              <AssignmentManagementTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default CareerLevelProgram;