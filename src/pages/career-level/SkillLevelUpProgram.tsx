import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Users,
  Lock,
  ExternalLink,
  Play,
  RotateCcw,
  Eye
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
import { useProfile } from '@/hooks/useProfile';
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
import SkillDeveloperProgramsTab from '@/components/SkillDeveloperProgramsTab';
import { LearningGoalsSection } from '@/components/LearningGoalsSection';

const SkillLevelUpProgram: React.FC = () => {
  const { user } = useAuth();
  const { profile, hasActiveSubscription } = useProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    loading, 
    getAssignmentsWithProgress, 
    getAttemptsByUser,
    getLeaderboard,
    getCourses,
    getModulesByCourse,
    getUserAssignmentsOrganized
  } = useCareerLevelProgram();
  
  // State for My Assignments tab
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [organizedAssignments, setOrganizedAssignments] = useState<any>({});
  
  // State for Leaderboard tab
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  
  // State for course enrollment flow
  const [pendingCourseEnrollment, setPendingCourseEnrollment] = useState<Course | null>(null);
  const [shouldOpenLearningGoalForm, setShouldOpenLearningGoalForm] = useState(false);
  
  // Internal loading state to avoid multiple loading indicators
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Get active tab from URL params or default to 'skill-programs'
  const activeTab = searchParams.get('tab') || 'skill-programs';

  // Optimized initial data loading - combine all API calls
  const loadAllData = useCallback(async () => {
    if (!user) return;
    
    console.log('🚀 Loading all data for Skill Level Up Program...');
    setIsInitialLoading(true);
    try {
      // Load all data in parallel for better performance
      const [assignmentsData, attemptsData, coursesData, leaderboardData] = await Promise.all([
        getAssignmentsWithProgress(),
        getAttemptsByUser(),
        getCourses(),
        getLeaderboard()
      ]);
      
      console.log('📊 Data loaded:', {
        assignments: assignmentsData?.length || 0,
        attempts: attemptsData?.length || 0,
        courses: coursesData?.length || 0,
        leaderboard: leaderboardData?.length || 0
      });
      
      setAssignments(assignmentsData);
      setAttempts(attemptsData);
      setCourses(coursesData);
      setLeaderboardData(leaderboardData);
      
      // We don't need organized assignments anymore as we're using subtabs
      setOrganizedAssignments({});
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user, getAssignmentsWithProgress, getAttemptsByUser, getCourses, getLeaderboard]);

  // Load initial data only once
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle course/module changes for leaderboard (optimized)
  useEffect(() => {
    if (selectedCourse !== 'all') {
      loadModules(selectedCourse);
    } else {
      setModules([]);
    }
    setSelectedModule('all');
  }, [selectedCourse]);

  // Optimized leaderboard loading
  const loadLeaderboardOptimized = useCallback(async () => {
    try {
      const courseId = selectedCourse !== 'all' ? selectedCourse : undefined;
      const moduleId = selectedModule !== 'all' ? selectedModule : undefined;
      
      const data = await getLeaderboard(courseId, moduleId);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }, [selectedCourse, selectedModule, getLeaderboard]);

  useEffect(() => {
    if (!isInitialLoading) {
      loadLeaderboardOptimized();
    }
  }, [selectedModule, loadLeaderboardOptimized, isInitialLoading]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Handle course enrollment - redirect to learning goals tab
  const handleCourseEnrollment = (course: Course) => {
    setPendingCourseEnrollment(course);
    setShouldOpenLearningGoalForm(true);
    setSearchParams({ tab: 'completed-learning' });
  };

  // Handle learning goal creation - redirect to course content
  const handleLearningGoalCreated = useCallback((courseId: string) => {
    navigate(`/course/${courseId}`);
  }, [navigate]);

  // Handle learning goal form closed
  const handleLearningGoalFormClosed = useCallback(() => {
    setPendingCourseEnrollment(null);
    setShouldOpenLearningGoalForm(false);
  }, []);

  // Load modules for selected course
  const loadModules = useCallback(async (courseId: string) => {
    try {
      const modulesData = await getModulesByCourse(courseId);
      setModules(modulesData);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  }, [getModulesByCourse]);

  // Memoized calculations for better performance
  const filteredAssignments = useMemo(() => {
    if (!assignments) {
      return { upcoming: [], active: [], completed: [] };
    }
    
    const upcoming: AssignmentWithProgress[] = [];
    const active: AssignmentWithProgress[] = [];
    const completed: AssignmentWithProgress[] = [];
    
    for (const assignment of assignments) {
      const hasAttempts = assignment.userAttempts && assignment.userAttempts.length > 0;
      const hasStartedAttempt = hasAttempts && assignment.userAttempts.some(attempt => attempt.status === 'started');
      
      if (!hasAttempts) {
        if (assignment.status === 'scheduled' || (assignment.status === 'open' && assignment.canAttempt)) {
          upcoming.push(assignment);
        }
      } else if (hasStartedAttempt || assignment.canAttempt) {
        active.push(assignment);
      } else {
        completed.push(assignment);
      }
    }
    
    return { upcoming, active, completed };
  }, [assignments]);

  // Memoized leaderboard calculations
  const leaderboardStats = useMemo(() => {
    const safeLeaderboardData = leaderboardData || [];
    const currentUserEntry = safeLeaderboardData.find(entry => entry.user_id === user?.id);
    const currentUserRank = currentUserEntry 
      ? safeLeaderboardData.findIndex(entry => entry.user_id === user?.id) + 1 
      : null;
    
    return { currentUserEntry, currentUserRank };
  }, [leaderboardData, user?.id]);

  // Helper functions for My Assignments (memoized)
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getAttemptStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-500';
      case 'started': return 'bg-blue-500';
      case 'auto_submitted': return 'bg-orange-500';
      case 'invalidated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getDaysRemaining = useCallback((dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Helper functions for Leaderboard (memoized)
  const getRankIcon = useCallback((position: number) => {
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
  }, []);

  const getPositionStyles = useCallback((position: number) => {
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
  }, []);

  // Helper function to get assignment status color and info for organized assignments
  const getOrganizedAssignmentStatus = useCallback((assignment: any) => {
    const attempt = assignment.userAttempt;
    if (!attempt) return { status: 'available', color: 'bg-blue-500', label: 'Available' };
    
    switch (attempt.status) {
      case 'submitted':
      case 'auto_submitted':
        return { status: 'completed', color: 'bg-green-500', label: 'Completed' };
      case 'started':
        return { status: 'pending', color: 'bg-orange-500', label: 'In Progress' };
      case 'available':
      default:
        return { status: 'available', color: 'bg-blue-500', label: 'Available' };
    }
  }, []);

  // Helper function to render organized assignment card
  const renderOrganizedAssignmentCard = useCallback((assignment: any) => {
    const statusInfo = getOrganizedAssignmentStatus(assignment);
    const attempt = assignment.latestAttempt || assignment.userAttempts?.[0];
    
    return (
      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{assignment.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {assignment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`text-xs ${statusInfo.color} text-white`}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              {assignment.instructions && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {assignment.instructions}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Assignment Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {assignment.duration_minutes && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-medium">{assignment.duration_minutes} min</div>
                </div>
              )}
              {assignment.due_at && (
                <div>
                  <span className="text-muted-foreground">Due:</span>
                  <div className="font-medium">
                    {formatDateTime(assignment.due_at)}
                  </div>
                </div>
              )}
            </div>

            {/* Attempt Information */}
            {attempt && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latest Attempt:</span>
                  <span className="font-medium">
                    {attempt.score_numeric ? `${attempt.score_numeric}%` : 'In Progress'}
                  </span>
                </div>
                {attempt.submitted_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Submitted: {formatDateTime(attempt.submitted_at)}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {statusInfo.status === 'available' && (!attempt || attempt.status === 'available') && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/career-level/assignments/${assignment.id}`)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Assignment
                </Button>
              )}
              {attempt && attempt.status === 'started' && (
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(`/career-level/assignment/${assignment.id}/attempt?attempt=${attempt.id}`)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              )}
              {attempt && attempt.status === 'submitted' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/career-level/assignment/${assignment.id}/results?attempt=${attempt.id}`)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                  {assignment.canAttempt && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/career-level/assignment/${assignment.id}/start`)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              )}
              {statusInfo.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/career-level/assignments/${assignment.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [formatDateTime, getOrganizedAssignmentStatus, navigate]);

  // Memoized assignment card rendering for better performance (original function)
  const renderAssignmentCard = useCallback((assignment: AssignmentWithProgress) => {
    console.log('🔍 Rendering assignment card for:', assignment.id);
    
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
                <span>{assignment.section?.course?.title} • {assignment.section?.title}</span>
              </div>
            </div>
            <Badge 
              className={cn('text-white', getStatusColor(assignment.status))}
            >
              {ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}
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
              <span>Type: {assignment.type ? assignment.type.toUpperCase() : 'N/A'}</span>
            </div>
          </div>

          {/* Progress/Status */}
          {assignment.userAttempts && assignment.userAttempts.filter(a => a.status !== 'available').length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Attempts: {assignment.userAttempts.filter(a => a.status !== 'available').length}/{assignment.max_attempts}</span>
                {bestScore > 0 && <span>Best Score: {bestScore.toFixed(1)}%</span>}
              </div>
              <Progress 
                value={(assignment.userAttempts.filter(a => a.status !== 'available').length / assignment.max_attempts) * 100} 
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
                <Link to={`/dashboard/career-level/attempt/${assignment.userAttempts.find(a => a.status === 'started')?.id}`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continue Attempt
                </Link>
              </Button>
            ) : assignment.canAttempt && assignment.status === 'open' ? (
              <Button asChild className="flex-1">
                <Link to={`/dashboard/career-level/assignments/${assignment.id}`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Assignment
                </Link>
              </Button>
            ) : assignment.userAttempts.some(attempt => attempt.status === 'available') ? (
              <Button asChild className="flex-1">
                <Link to={`/dashboard/career-level/assignments/${assignment.id}`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Assignment
                </Link>
              </Button>
            ) : isCompleted ? (
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/career-level/feedback/${assignment.userAttempts && assignment.userAttempts[0]?.id}`}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  View Results
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled className="flex-1">
                {assignment.status === 'scheduled' ? 'Not Started' : 
                 assignment.status === 'closed' ? 'Closed' : 
                 assignment.userAttempts.filter(a => a.status !== 'available').length >= assignment.max_attempts ? 'No Attempts Remaining' :
                 'Available'}
              </Button>
            )}
            
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/dashboard/career-level/assignments/${assignment.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [getStatusColor, formatDateTime, getDaysRemaining]);

  if (loading || isInitialLoading) {
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
                <span className="font-semibold">Skill Level Up Program</span>
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
              <span className="font-semibold">Skill Level Up Program</span>
            </div>
          </div>
          
          {/* Right side - Action Buttons and User Profile */}
          <div className="flex items-center gap-3">
            {/* YouTube Channel Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.youtube.com/@career-levelup', '_blank')}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Go to YouTube Channel</span>
            </Button>
            
            {/* Career Level Up Community Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://members.risenshinetechnologies.com/communities/groups/career-level-up/home', '_blank')}
              className="flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Join Community</span>
            </Button>
            
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Page Header - moved above tabs */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Skill Developer Programs
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Master in-demand skills with our comprehensive courses. Build your expertise and advance your career.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skill-programs" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Skill Developer Programs</span>
              <span className="sm:hidden">Programs</span>
            </TabsTrigger>
            <TabsTrigger value="my-assignments" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Assignments</span>
              <span className="sm:hidden">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="completed-learning" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Completed Learning</span>
              <span className="sm:hidden">Learning</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Ranks</span>
            </TabsTrigger>
          </TabsList>

          {/* Skill Developer Programs Tab */}
          <TabsContent value="skill-programs" className="space-y-6">
            <SkillDeveloperProgramsTab onEnrollCourse={handleCourseEnrollment} />
          </TabsContent>

          {/* My Assignments Tab */}
          <TabsContent value="my-assignments" className="space-y-6">
            {/* Current User's Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">My Assignment Progress</h2>
                  <p className="text-muted-foreground">Track your assignments and performance</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredAssignments.completed.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredAssignments.active.length}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredAssignments.upcoming.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Total Score Card */}
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <Trophy className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Total Score</h3>
                      <p className="text-3xl font-bold text-emerald-600">
                        {assignments.reduce((total, assignment) => {
                          const bestAttempt = assignment.userAttempts
                            .filter(a => a.score_numeric !== null)
                            .reduce((max, attempt) => 
                              Math.max(max, attempt.score_numeric || 0), 0
                            );
                          return total + bestAttempt;
                        }, 0)}
                     </p>
                   </div>
                 </div>
               </CardContent>
              </Card>
            </div>

            {/* Assignment Status Tabs */}
            <Tabs defaultValue="available" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Available ({filteredAssignments.upcoming.length})</span>
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  <span>In Progress ({filteredAssignments.active.length})</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed ({filteredAssignments.completed.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Available Assignments */}
              <TabsContent value="available" className="space-y-4">
                {filteredAssignments.upcoming.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssignments.upcoming.map((assignment) => renderAssignmentCard(assignment))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <Clock className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">No Available Assignments</h3>
                      <p className="text-muted-foreground max-w-md">
                        Complete course sections to unlock new assignments. Keep learning to get more challenges!
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* In Progress Assignments */}
              <TabsContent value="in-progress" className="space-y-4">
                {filteredAssignments.active.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssignments.active.map((assignment) => renderAssignmentCard(assignment))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <PlayCircle className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">No Assignments in Progress</h3>
                      <p className="text-muted-foreground max-w-md">
                        Start working on your available assignments to see them here. Take your time and do your best!
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Completed Assignments */}
              <TabsContent value="completed" className="space-y-4">
                {filteredAssignments.completed.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssignments.completed.map((assignment) => renderAssignmentCard(assignment))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">No Completed Assignments</h3>
                      <p className="text-muted-foreground max-w-md">
                        Complete assignments to see your achievements here. Your completed work will be displayed with scores and feedback.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Empty State for no assignments at all */}
            {assignments.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground">
                    Check back later for new assignments to complete.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Completed Learning Tab */}
          <TabsContent value="completed-learning" className="space-y-6">
            <LearningGoalsSection 
              shouldOpenForm={shouldOpenLearningGoalForm}
              courseInfo={pendingCourseEnrollment ? {
                id: pendingCourseEnrollment.id,
                title: pendingCourseEnrollment.title,
                description: pendingCourseEnrollment.description
              } : undefined}
              onGoalCreated={handleLearningGoalCreated}
              onFormClosed={handleLearningGoalFormClosed}
            />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Current User Stats */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Leaderboard Rankings</h2>
                  <p className="text-muted-foreground">See how you rank among your peers</p>
                </div>
                {leaderboardStats.currentUserRank && (
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        #{leaderboardStats.currentUserRank}
                      </div>
                      <div className="text-sm text-muted-foreground">Your Rank</div>
                    </div>
                    {leaderboardStats.currentUserEntry && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(leaderboardStats.currentUserEntry as any).total_score?.toFixed(1) || '0'}
                        </div>
                        <div className="text-sm text-muted-foreground">Your Score</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Course:</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-[200px]">
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

              {selectedCourse !== 'all' && modules.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Module:</label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger className="w-[200px]">
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
              )}
            </div>

            {/* Leaderboard */}
            <div className="space-y-4">
              {leaderboardData.length > 0 ? (
                leaderboardData.map((entry, index) => {
                  const position = index + 1;
                  const isCurrentUser = entry.user_id === user?.id;
                  
                  return (
                    <Card 
                      key={entry.user_id} 
                      className={cn(
                        'transition-all duration-200 hover:shadow-md',
                        getPositionStyles(position),
                        isCurrentUser && 'ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10">
                              {getRankIcon(position)}
                            </div>
                            
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={(entry as any).profiles?.avatar_url} />
                              <AvatarFallback className="text-sm">
                                {((entry as any).profiles?.display_name || (entry as any).profiles?.email || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <div className="font-medium text-foreground">
                                {(entry as any).profiles?.display_name || (entry as any).profiles?.email || 'Anonymous User'}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(entry as any).assignment_count || 0} assignment{((entry as any).assignment_count || 0) !== 1 ? 's' : ''} completed
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">
                              {((entry as any).total_score || 0).toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Avg: {((entry as any).avg_score || 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-12">
                  <div className="text-center">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
                    <p className="text-muted-foreground">
                      Complete some assignments to see the leaderboard.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SkillLevelUpProgram;